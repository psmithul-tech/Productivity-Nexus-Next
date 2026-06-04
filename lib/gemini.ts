import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { formatDateInTimeZone, formatLocalIsoInTimeZone, formatTimeInTimeZone, normalizeTimeZone } from "@/lib/timezone";

export function getAIClient(apiKey: string | null) {
  if (!apiKey) throw new Error("Gemini API Key is required but was not provided. Please add it in your Settings.");
  return new GoogleGenAI({ apiKey });
}

export function buildSystemPrompt(timeZone?: string | null): string {
  const userTimeZone = normalizeTimeZone(timeZone);
  const now = new Date();
  const dateStr = formatDateInTimeZone(now, userTimeZone);
  const timeStr = formatTimeInTimeZone(now, userTimeZone);
  const localIso = formatLocalIsoInTimeZone(now, userTimeZone);

  return `You are the user's AI Chief of Staff — a proactive personal executive assistant, scheduler, and accountability partner.

The user's configured timezone is ${userTimeZone}.
Today is ${dateStr} and the current local time is ${timeStr}.
The current local datetime is ${localIso}.

You have access to tools to create tasks, schedule events, and set reminders.

Rules:
- CLARIFY BEFORE CREATING: If the user asks you to add tasks but does not provide details like priority or deadlines, ASK THEM clarifying questions first instead of guessing (e.g. "What priority should these be? When are they due?").
- BATCHING: If the user provides a list of tasks or asks to create multiple tasks, ALWAYS use the 'createTasksBatch' tool to add them simultaneously in one action.
- DATES: Resolve relative expressions (like "tomorrow at 5pm") in ${userTimeZone}. For tool date arguments, output local ISO 8601 strings without "Z" or an offset, e.g. "2026-06-04T17:00:00".
- Be concise, direct, and action-oriented.`;
}

export const createTaskTool: FunctionDeclaration = {
  name: "createTask",
  description: "Creates a single task in the user's task manager.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Clean, action-oriented task title" },
      dueDate: { type: Type.STRING, description: "Local ISO 8601 datetime in the user's timezone, without Z/offset, if specified; else omit" },
      priority: { type: Type.STRING, enum: ["low", "medium", "high", "urgent"], description: "Default is medium" },
      bucket: { type: Type.STRING, enum: ["today", "this_week", "upcoming", "someday"], description: "Which bucket it belongs to" }
    },
    required: ["title", "priority", "bucket"]
  }
};

export const createTasksBatchTool: FunctionDeclaration = {
  name: "createTasksBatch",
  description: "Creates multiple tasks simultaneously in the user's task manager. Use this when the user asks to add multiple tasks or a list of tasks.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      tasks: {
        type: Type.ARRAY,
        description: "List of tasks to create",
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Task title" },
            dueDate: { type: Type.STRING, description: "Local ISO 8601 datetime in the user's timezone, without Z/offset, if specified; else omit" },
            priority: { type: Type.STRING, enum: ["low", "medium", "high", "urgent"] },
            bucket: { type: Type.STRING, enum: ["today", "this_week", "upcoming", "someday"] }
          },
          required: ["title", "priority", "bucket"]
        }
      }
    },
    required: ["tasks"]
  }
};

export const createEventTool: FunctionDeclaration = {
  name: "createEvent",
  description: "Schedules a new event/meeting in the calendar.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Event title" },
      startTime: { type: Type.STRING, description: "Local ISO 8601 datetime in the user's timezone for the start, without Z/offset" },
      endTime: { type: Type.STRING, description: "Local ISO 8601 datetime in the user's timezone for the end, without Z/offset" },
      location: { type: Type.STRING, description: "Location if any" }
    },
    required: ["title", "startTime", "endTime"]
  }
};

export const createReminderTool: FunctionDeclaration = {
  name: "createReminder",
  description: "Sets up a reminder for the user via a specific channel.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskId: { type: Type.INTEGER, description: "ID of the task this reminder is for" },
      channel: { type: Type.STRING, enum: ["email", "push", "telegram"], description: "Channel to send reminder" },
      scheduledAt: { type: Type.STRING, description: "Local ISO 8601 datetime in the user's timezone to trigger reminder, without Z/offset" }
    },
    required: ["taskId", "channel", "scheduledAt"]
  }
};

export const tools = [{ functionDeclarations: [createTaskTool, createTasksBatchTool, createEventTool, createReminderTool] }];
