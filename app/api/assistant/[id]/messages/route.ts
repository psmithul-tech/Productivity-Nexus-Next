import { AGENTS } from "@/lib/agents";
import { NextRequest } from "next/server";
import { db, conversations, messages, tasksTable, eventsTable, remindersTable, settingsTable, subjectsTable, attendanceLogsTable } from "@/lib/db";
import { eq, and, or, arrayContains, gte } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { buildSystemPrompt } from "@/lib/openrouter";
import { pushTaskToGoogleCalendar } from "@/lib/google-calendar";
import { normalizeTimeZone, parseDateTimeInTimeZone, timeOnDateInTimeZone, formatTimeInTimeZone, formatDateInTimeZone } from "@/lib/timezone";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id } = await params;
  const convId = parseInt(id);
  const { content } = await req.json();
  if (!content) return new Response(JSON.stringify({ error: "content required" }), { status: 400 });

  const [conv] = await db.select().from(conversations).where(and(eq(conversations.id, convId), eq(conversations.userId, user.id)));
  if (!conv) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  await db.insert(messages).values({ conversationId: convId, role: "user", content });
  const history = await db.select().from(messages).where(eq(messages.conversationId, convId));
  
  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));
  const userTz = normalizeTimeZone(settings?.timezone);
  const now = new Date();

  const allTasks = await db.select().from(tasksTable).where(
    or(
      eq(tasksTable.userId, user.id),
      (settings?.username ? eq(tasksTable.assignedTo, settings.username) : undefined)
    )
  );
  const activeTasks = allTasks.filter((t) => t.status === "active");
  const taskList = activeTasks.length === 0 ? "" : activeTasks.map((t) => 
    `• ${t.title} [${t.priority} priority, ${t.bucket}${t.dueDate ? `, due ${formatTimeInTimeZone(new Date(t.dueDate), userTz)}` : ""}]`
  ).join("\n");

  const allEvents = await db.select().from(eventsTable).where(and(
    eq(eventsTable.userId, user.id),
    gte(eventsTable.endTime, new Date(now.getTime() - 24 * 60 * 60 * 1000))
  ));
  const eventList = allEvents.length === 0 ? "" : allEvents.map((e) => 
    `• [ID:${e.id}] ${e.title} (${formatTimeInTimeZone(new Date(e.startTime), userTz)} - ${formatTimeInTimeZone(new Date(e.endTime), userTz)} on ${formatDateInTimeZone(new Date(e.startTime), userTz)})`
  ).join("\n");

  const allSubjects = await db.select().from(subjectsTable).where(eq(subjectsTable.userId, user.id));
  const subjectList = allSubjects.length === 0 ? "" : allSubjects.map((s) => 
    `• [ID:${s.id}] ${s.name} (Target: ${s.targetPercentage}%)`
  ).join("\n");

  let extraContext = "";
  if (content.toLowerCase().includes("news") || content.toLowerCase().includes("headlines")) {
    try {
      const { generateDailyNewsSummary } = await import("@/lib/news");
      const summary = await generateDailyNewsSummary();
      extraContext = `\n\nUSER REQUESTED NEWS UPDATE:\nHere is the latest news summary to provide to the user (do not generate it from scratch, just deliver this or a slightly shorter version of this to the user):\n${summary}`;
    } catch (e) {
      console.error("Failed to generate news summary for assistant:", e);
    }
  }

  const systemPrompt = buildSystemPrompt(userTz, taskList, eventList) + 
    `\n\n## SUBJECTS FOR ATTENDANCE\n${subjectList || "No subjects found."}` + 
    extraContext;

  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" as const : "user" as const,
    parts: [{ text: m.content }],
  }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullText = "";
        let functionCalls: any[] = [];
        try {
          const { callOpenRouterStream, openaiTools } = await import("@/lib/openrouter");
          const orStream = callOpenRouterStream(
            [
              { role: "system", content: systemPrompt },
              ...history.map(m => ({
                role: m.role,
                content: m.content
              }))
            ],
            { 
              model: AGENTS.CHIEF_OF_STAFF,
              temperature: 0.7,
              tools: openaiTools 
            }
          );

          for await (const chunk of orStream) {
            if (chunk.text) {
              fullText += chunk.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk.text })}\\n\\n`));
            }
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
              functionCalls.push(...chunk.functionCalls);
            }
          }
        } catch (orError) {
          console.error("OpenRouter Stream Error:", orError);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream error" })}\\n\\n`));
        }

        if (fullText.trim()) {
          await db.insert(messages).values({ conversationId: convId, role: "assistant", content: fullText });
        }

        for (const call of functionCalls) {
          const args = call.args as any;
          if (call.name === "createTask") {
            const dueDate = args.dueDate ? parseDateTimeInTimeZone(args.dueDate, userTz) : null;
            const [newTask] = await db.insert(tasksTable).values({
              userId: user.id,
              title: args.title,
              priority: args.priority || "medium",
              bucket: args.bucket || "today",
              dueDate: dueDate,
            }).returning({ id: tasksTable.id });
            
            // Automatic reminder at 09:00 on due date if specified
            if (dueDate) {
              const reminderDate = timeOnDateInTimeZone(dueDate, userTz, "09:00");
              if (reminderDate > new Date()) {
                await db.insert(remindersTable).values({
                  userId: user.id,
                  taskId: newTask.id,
                  channel: "telegram", // Default fallback channel
                  scheduledAt: reminderDate,
                });
              }
              pushTaskToGoogleCalendar(user.id, args.title, dueDate).catch(console.error);
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ task: args })}\n\n`));
            
          } else if (call.name === "createTasksBatch") {
            const batchArgs = args.tasks || [];
            for (const t of batchArgs) {
              const dueDate = t.dueDate ? parseDateTimeInTimeZone(t.dueDate, userTz) : null;
              const [newTask] = await db.insert(tasksTable).values({
                userId: user.id,
                title: t.title,
                priority: t.priority || "medium",
                bucket: t.bucket || "today",
                dueDate: dueDate,
              }).returning({ id: tasksTable.id });
              
              if (dueDate) {
                const reminderDate = timeOnDateInTimeZone(dueDate, userTz, "09:00");
                if (reminderDate > new Date()) {
                  await db.insert(remindersTable).values({
                    userId: user.id,
                    taskId: newTask.id,
                    channel: "telegram",
                    scheduledAt: reminderDate,
                  });
                }
                pushTaskToGoogleCalendar(user.id, t.title, dueDate).catch(console.error);
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tasksBatch: args })}\n\n`));
            
          } else if (call.name === "createEvent") {
            await db.insert(eventsTable).values({
              userId: user.id,
              title: args.title,
              startTime: parseDateTimeInTimeZone(args.startTime, userTz),
              endTime: parseDateTimeInTimeZone(args.endTime, userTz),
              location: args.location || null,
              source: "ai"
            });
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: args })}\n\n`));
          } else if (call.name === "createReminder") {
            await db.insert(remindersTable).values({
              userId: user.id,
              taskId: args.taskId,
              channel: args.channel,
              scheduledAt: parseDateTimeInTimeZone(args.scheduledAt, userTz)
            });
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ reminder: args })}\n\n`));
          } else if (call.name === "setAttendance") {
            // First, delete all existing logs
            await db.delete(attendanceLogsTable).where(eq(attendanceLogsTable.subjectId, args.subjectId));
            
            // Insert present and absent logs directly
            const total = args.presents + args.absents;
            const newLogs = [];
            for (let i = 0; i < args.presents; i++) newLogs.push({ subjectId: args.subjectId, status: "present" as const });
            for (let i = 0; i < args.absents; i++) newLogs.push({ subjectId: args.subjectId, status: "absent" as const });
            
            if (newLogs.length > 0) {
              await db.insert(attendanceLogsTable).values(newLogs);
            }
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ attendanceUpdated: args })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (err: any) {
        console.error("AI Assistant Error:", err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message || "Stream error" })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
