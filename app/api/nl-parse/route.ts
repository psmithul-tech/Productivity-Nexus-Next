import { NextRequest, NextResponse } from "next/server";
import { getAIClient } from "@/lib/gemini";
import { createClient } from "@/utils/supabase/server";
import { db, settingsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  formatDateInTimeZone,
  formatLocalIsoInTimeZone,
  formatTimeInTimeZone,
  normalizeTimeZone,
  parseDateTimeInTimeZone,
} from "@/lib/timezone";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query, timezone: requestedTimezone } = await req.json();
  if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));
  const timezone = normalizeTimeZone(settings?.timezone || requestedTimezone);
  const ai = getAIClient(settings?.geminiApiKey || null);
  if (!ai) return NextResponse.json({ error: "Gemini API key not configured" }, { status: 400 });

  const now = new Date();
  const localIso = formatLocalIsoInTimeZone(now, timezone);
  const dateDisplay = formatDateInTimeZone(now, timezone);
  const timeDisplay = formatTimeInTimeZone(now, timezone);
  
  const systemInstruction = `You are a natural language parser for a productivity app.

## CURRENT TIME (AUTHORITATIVE — DO NOT OVERRIDE)
current_datetime: "${localIso}"
current_time_display: "${timeDisplay}"
current_date_display: "${dateDisplay}"
timezone: "${timezone}"

YOU MUST TREAT THE ABOVE AS GROUND TRUTH. Use current_datetime to determine what "today", "tomorrow", "next week" etc. mean.

## YOUR TASK
Parse the user's input and determine if they want to create a TASK or an EVENT. Extract structured data.

Output ONLY a raw JSON object (no markdown fences):

{
  "type": "task" | "event" | "unknown",
  "data": {
    // For TASK:
    "title": "string",
    "dueDate": "YYYY-MM-DDTHH:mm:00 or null",
    "priority": "urgent" | "high" | "medium" | "low",
    "bucket": "today" | "this_week" | "upcoming" | "someday"
    
    // For EVENT:
    "title": "string",
    "startTime": "YYYY-MM-DDTHH:mm:00",
    "endTime": "YYYY-MM-DDTHH:mm:00"
  }
}

## CRITICAL DATE RULES
- Use LOCAL time from current_datetime. Today's date is ${localIso.substring(0, 10)}.
- Output times exactly as the user states them (e.g. "3pm" → "T15:00:00", "10:20 AM" → "T10:20:00").
- NEVER append "Z" or any timezone offset to dates.
- NEVER convert to UTC. Output local time only.

## EXAMPLES
Input: "Meeting with John tomorrow at 3pm" (current_datetime: "2026-06-04T10:00:00")
Output: {"type":"event","data":{"title":"Meeting with John","startTime":"2026-06-05T15:00:00","endTime":"2026-06-05T16:00:00"}}

Input: "Buy milk urgent"
Output: {"type":"task","data":{"title":"Buy milk","priority":"urgent","bucket":"today","dueDate":null}}

Input: "Dentist appointment at 2:30pm"
Output: {"type":"event","data":{"title":"Dentist appointment","startTime":"2026-06-04T14:30:00","endTime":"2026-06-04T15:30:00"}}
`;
  // Model strategy: try best model first, fall back to cheaper model if rate limited
  const MODELS = ["gemini-2.5-flash", "gemini-3.1-flash-lite"];
  
  try {
    let text: string | null = null;
    
    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: query }] }],
          config: {
            systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
            temperature: 0.1,
          },
        });
        text = response.text ?? null;
        console.log(`[nl-parse] Used model: ${model}`);
        break; // Success — stop trying models
      } catch (modelErr: any) {
        if (modelErr.status === 429) {
          console.warn(`[nl-parse] ${model} rate limited, trying next model...`);
          continue;
        }
        throw modelErr; // Re-throw non-rate-limit errors
      }
    }
    
    if (!text) throw new Error("All models failed");

    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    // Convert local time strings to UTC based on user timezone
    if (parsed.data) {
      if (parsed.data.dueDate && parsed.data.dueDate !== "null" && parsed.data.dueDate !== null) {
        const utc = parseDateTimeInTimeZone(parsed.data.dueDate, timezone);
        console.log(`[nl-parse] dueDate: raw="${parsed.data.dueDate}" → UTC=${utc.toISOString()}`);
        parsed.data.dueDate = utc.toISOString();
      }
      if (parsed.data.startTime && parsed.data.startTime !== "null" && parsed.data.startTime !== null) {
        parsed.data.startTime = parseDateTimeInTimeZone(parsed.data.startTime, timezone).toISOString();
      }
      if (parsed.data.endTime && parsed.data.endTime !== "null" && parsed.data.endTime !== null) {
        parsed.data.endTime = parseDateTimeInTimeZone(parsed.data.endTime, timezone).toISOString();
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("NL parse error:", error);
    return NextResponse.json({ error: "Failed to parse query" }, { status: 500 });
  }
}
