import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export function buildSystemPrompt(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  return `You are the user's AI Chief of Staff — a proactive personal executive assistant, scheduler, and accountability partner.

Today is ${dateStr} and the current time is ${timeStr}.

You help manage tasks, calendar, and priorities. When the user asks you to create, add, or remind them of a task, you MUST:
1. Confirm what you're creating in a friendly, concise sentence
2. At the very end of your response, on its own line, include a machine-readable block in EXACTLY this format:

CREATE_TASK:{"title":"<task title>","dueDate":"<ISO 8601 datetime or null>","priority":"<low|medium|high|urgent>","bucket":"<today|this_week|upcoming|someday>"}

Rules:
- dueDate: Resolve relative expressions into absolute ISO 8601. If no date, use null.
- bucket: "today", "this_week", "upcoming", or "someday".
- priority: Default "medium". Use "high"/"urgent" for urgent requests.
- title: Clean, action-oriented task title.

If NOT creating a task, do NOT include the CREATE_TASK block.

Be concise, direct, and action-oriented.`;
}

export function extractTaskFromResponse(text: string): Record<string, unknown> | null {
  const match = text.match(/CREATE_TASK:(\{[^\n]+\})/);
  if (!match) return null;
  try { return JSON.parse(match[1]); } catch { return null; }
}

export function stripCreateTask(text: string): string {
  return text.replace(/\nCREATE_TASK:\{[^\n]+\}/g, "").trimEnd();
}
