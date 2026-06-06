import { AGENTS } from "@/lib/agents";
import { formatDateInTimeZone, formatLocalIsoInTimeZone, formatTimeInTimeZone, normalizeTimeZone } from "@/lib/timezone";

export function buildSystemPrompt(timeZone?: string | null, tasks?: string, events?: string): string {
  const userTimeZone = normalizeTimeZone(timeZone);
  const now = new Date();
  const dateStr = formatDateInTimeZone(now, userTimeZone);
  const timeStr = formatTimeInTimeZone(now, userTimeZone);
  const localIso = formatLocalIsoInTimeZone(now, userTimeZone);

  return `<ROLE>
You are the user's AI Chief of Staff—an elite, proactive executive assistant, scheduler, and accountability partner.
</ROLE>

<CONTEXT>
Timezone: ${userTimeZone}
Date: ${dateStr}
Local Time: ${timeStr}
Local Datetime: ${localIso}

[ACTIVE TASKS]
${tasks || "No active tasks."}

[UPCOMING EVENTS]
${events || "No upcoming events."}
</CONTEXT>

<CAPABILITIES>
You have native tool access to create tasks, schedule events, and set reminders.
</CAPABILITIES>

<CONSTRAINTS>
1. CLARIFY BEFORE ACTION: Never guess task priority or deadlines. Ask clarifying questions if unspecified.
2. EFFICIENT BATCHING: If provided multiple tasks, ALWAYS use the 'createTasksBatch' tool simultaneously.
3. TIMEZONE ACCURACY: Resolve relative expressions (e.g., "tomorrow at 5pm") strictly in ${userTimeZone}.
4. DATE FORMAT: Tool date arguments MUST be local ISO 8601 without "Z" or offset (e.g., "2026-06-04T17:00:00").
5. TONE: Be concise, highly professional, direct, and action-oriented. Avoid fluff.
</CONSTRAINTS>`;
}

export async function callOpenRouter(
  prompt: string,
  systemInstruction?: string,
  options?: {
    model?: string;
    temperature?: number;
    jsonMode?: boolean;
    maxTokens?: number;
    tools?: any[];
  }
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set in environment variables");
  }

  const model = options?.model || AGENTS.CHIEF_OF_STAFF;
  
  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }
  
  if (Array.isArray(prompt)) {
    // If prompt is an array of messages (e.g., from Telegram chat history)
    messages.push(...prompt);
  } else {
    messages.push({ role: "user", content: prompt });
  }

  const body: any = {
    model,
    messages,
    temperature: options?.temperature ?? 0.7,
  };

  if (options?.jsonMode) {
    body.response_format = { type: "json_object" };
  }
  if (options?.maxTokens) {
    body.max_tokens = options.maxTokens;
  }
  if (options?.tools && options.tools.length > 0) {
    body.tools = options.tools;
  }

  const fallbackModel = "openrouter/owl-alpha";
  const isKimiOrNemotron = model.toLowerCase().includes("kimi") || model.toLowerCase().includes("nemotron");
  const modelsToTry = isKimiOrNemotron ? [model, fallbackModel] : [model];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 120 seconds for free models
  
  let response;
  let lastError;

  for (const currentModel of modelsToTry) {
    body.model = currentModel;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (response.ok) {
        break;
      } else {
        const text = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${text}`);
      }
    } catch (error) {
      console.warn(`[OpenRouter] Model ${currentModel} failed:`, error);
      lastError = error;
    }
  }
  
  clearTimeout(timeout);

  if (!response || !response.ok) {
    throw lastError || new Error("All models failed");
  }

  const data = await response.json();
  const message = data.choices[0].message;

  if (message.tool_calls && message.tool_calls.length > 0) {
    return {
      text: message.content || "",
      functionCalls: message.tool_calls.map((tc: any) => ({
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments)
      }))
    };
  }

  return message.content;
}

export const openaiTools = [
  {
    type: "function",
    function: {
      name: "createTask",
      description: "Creates a single task in the user's task manager.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Clean, action-oriented task title" },
          dueDate: { type: "string", description: "Local ISO 8601 datetime in the user's timezone, without Z/offset, if specified; else omit" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Default is medium" },
          bucket: { type: "string", enum: ["today", "this_week", "upcoming", "someday"], description: "Which bucket it belongs to" }
        },
        required: ["title", "priority", "bucket"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "createTasksBatch",
      description: "Creates multiple tasks simultaneously in the user's task manager. Use this when the user asks to add multiple tasks or a list of tasks.",
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            description: "List of tasks to create",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Task title" },
                dueDate: { type: "string", description: "Local ISO 8601 datetime in the user's timezone, without Z/offset, if specified; else omit" },
                priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                bucket: { type: "string", enum: ["today", "this_week", "upcoming", "someday"] }
              },
              required: ["title", "priority", "bucket"]
            }
          }
        },
        required: ["tasks"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "createEvent",
      description: "Schedules a new event/meeting in the calendar.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event title" },
          startTime: { type: "string", description: "Local ISO 8601 datetime in the user's timezone for the start, without Z/offset" },
          endTime: { type: "string", description: "Local ISO 8601 datetime in the user's timezone for the end, without Z/offset" },
          location: { type: "string", description: "Location if any" }
        },
        required: ["title", "startTime", "endTime"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "createReminder",
      description: "Sets up a reminder for the user via a specific channel.",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "integer", description: "ID of the task this reminder is for" },
          channel: { type: "string", enum: ["email", "push", "telegram"], description: "Channel to send reminder" },
          scheduledAt: { type: "string", description: "Local ISO 8601 datetime in the user's timezone to trigger reminder, without Z/offset" }
        },
        required: ["taskId", "channel", "scheduledAt"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "setAttendance",
      description: "Sets the absolute number of presents and absents for a subject's attendance, replacing any existing records.",
      parameters: {
        type: "object",
        properties: {
          subjectId: { type: "integer", description: "ID of the subject" },
          presents: { type: "integer", description: "Number of classes attended (present)" },
          absents: { type: "integer", description: "Number of classes missed (absent)" }
        },
        required: ["subjectId", "presents", "absents"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "logDiet",
      description: "Logs a meal and its calories for the user.",
      parameters: {
        type: "object",
        properties: {
          mealType: { type: "string", enum: ["Breakfast", "Lunch", "Dinner", "Snack"], description: "Type of meal" },
          foodItems: { type: "array", items: { type: "string" }, description: "List of food items consumed" },
          calories: { type: "integer", description: "Total calories for the meal" },
        },
        required: ["mealType", "foodItems", "calories"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "logHabit",
      description: "Marks a habit as completed for today. Only requires the habit name. The system will fuzzy match to the user's habits.",
      parameters: {
        type: "object",
        properties: {
          habitName: { type: "string", description: "Name of the habit completed" },
        },
        required: ["habitName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getNews",
      description: "Fetches the daily news summary from the News Guru module.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ping",
      description: "Pings or messages another user by their username.",
      parameters: {
        type: "object",
        properties: {
          username: { type: "string", description: "The username of the person to ping (without @)" },
          message: { type: "string", description: "The message to send them" },
        },
        required: ["username", "message"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "watchAnime",
      description: "Returns a link to watch an anime on Streaming God.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Name of the anime" },
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "startDeepResearch",
      description: "Triggers the Deep Research Agent to perform an async web search and synthesize a comprehensive report.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The specific topic or question to research deeply" },
        },
        required: ["query"]
      }
    }
  }
];

export async function* callOpenRouterStream(
  messages: any[],
  options?: {
    model?: string;
    temperature?: number;
    tools?: any[];
  }
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set in environment variables");
  }

  const model = options?.model || AGENTS.CHIEF_OF_STAFF;

  const body: any = {
    model,
    messages,
    temperature: options?.temperature ?? 0.7,
    stream: true,
  };

  if (options?.tools && options.tools.length > 0) {
    body.tools = options.tools;
  }

  const fallbackModel = "openrouter/owl-alpha";
  const isKimiOrNemotron = model.toLowerCase().includes("kimi") || model.toLowerCase().includes("nemotron");
  const modelsToTry = isKimiOrNemotron ? [model, fallbackModel] : [model];

  let response;
  let lastError;

  for (const currentModel of modelsToTry) {
    body.model = currentModel;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        break;
      } else {
        const text = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${text}`);
      }
    } catch (error) {
      console.warn(`[OpenRouterStream] Model ${currentModel} failed:`, error);
      lastError = error;
    }
  }

  if (!response || !response.ok) {
    throw lastError || new Error("All models failed");
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");
  const decoder = new TextDecoder();

  let toolCallsBuffer: { [index: number]: { id: string, name: string, arguments: string } } = {};

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    
    for (const line of chunk.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            yield { text: delta.content };
          }

          if (delta.tool_calls) {
            for (const call of delta.tool_calls) {
              const idx = call.index;
              if (!toolCallsBuffer[idx]) {
                toolCallsBuffer[idx] = {
                  id: call.id,
                  name: call.function?.name || "",
                  arguments: call.function?.arguments || "",
                };
              } else {
                if (call.function?.name) toolCallsBuffer[idx].name += call.function.name;
                if (call.function?.arguments) toolCallsBuffer[idx].arguments += call.function.arguments;
              }
            }
          }
        } catch (e) {
          console.error("OpenRouter SSE Parse Error:", e, "Line:", trimmed);
        }
      }
    }
  }

  const toolCalls = Object.values(toolCallsBuffer);
  if (toolCalls.length > 0) {
    const parsedCalls = toolCalls.map(tc => {
      let args = {};
      try { args = JSON.parse(tc.arguments); } catch (e) { console.error("Failed to parse tool call args:", tc.arguments); }
      return {
        name: tc.name,
        args: args
      };
    });
    yield { functionCalls: parsedCalls };
  }
}
