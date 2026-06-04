import { NextRequest, NextResponse } from "next/server";
import { getAIClient } from "@/lib/gemini";
import { createClient } from "@/utils/supabase/server";
import { db, settingsTable } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query, timezone = "UTC" } = await req.json();
  if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));
  const ai = getAIClient(settings?.geminiApiKey || null);
  if (!ai) return NextResponse.json({ error: "Gemini API key not configured" }, { status: 400 });

  const now = new Date();
  
  const systemInstruction = `You are a natural language parser for a productivity app.
CRITICAL TIMEZONE RULES:
- The CURRENT LOCAL TIME for the user is ${now.toLocaleString("en-US", { timeZone: timezone })}.
- You MUST use this exact time as your current reference for "today", "tomorrow", etc.
- Do NOT convert this time to UTC or any other timezone.
- For dates, output LOCAL time ISO 8601 strings WITHOUT the 'Z' (e.g. "2024-05-10T15:00:00"). Do NOT append Z or UTC offsets.

Your job is to parse the user's input and determine if they want to create a TASK or an EVENT, and extract the relevant structured data.

Output ONLY a raw JSON object with the following schema, and no markdown blocks.

{
  "type": "task" | "event" | "unknown",
  "data": {
    // For TASK:
    "title": "string",
    "dueDate": "ISO 8601 string (optional)",
    "priority": "urgent" | "high" | "medium" | "low",
    "bucket": "today" | "this_week" | "upcoming" | "someday"
    
    // For EVENT:
    "title": "string",
    "startTime": "ISO 8601 string",
    "endTime": "ISO 8601 string" (default to 1 hour after startTime if not specified)
  }
}

Examples:
Input: "Meeting with John tomorrow at 3pm"
Output: {"type": "event", "data": {"title": "Meeting with John", "startTime": "2024-05-10T15:00:00", "endTime": "2024-05-10T16:00:00"}}

Input: "Buy milk urgent"
Output: {"type": "task", "data": {"title": "Buy milk", "priority": "urgent", "bucket": "today"}}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: query }] }],
      config: {
        systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
        temperature: 0.1,
      },
    });

    const text = response.text;
    const jsonStr = (text || "").replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    // Convert local time strings to UTC based on user timezone
    if (parsed.data) {
      const { fromZonedTime } = require("date-fns-tz");
      if (parsed.data.dueDate && parsed.data.dueDate !== "null") {
        parsed.data.dueDate = fromZonedTime(parsed.data.dueDate.substring(0, 19), timezone).toISOString();
      }
      if (parsed.data.startTime && parsed.data.startTime !== "null") {
        parsed.data.startTime = fromZonedTime(parsed.data.startTime.substring(0, 19), timezone).toISOString();
      }
      if (parsed.data.endTime && parsed.data.endTime !== "null") {
        parsed.data.endTime = fromZonedTime(parsed.data.endTime.substring(0, 19), timezone).toISOString();
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("NL parse error:", error);
    return NextResponse.json({ error: "Failed to parse query" }, { status: 500 });
  }
}
