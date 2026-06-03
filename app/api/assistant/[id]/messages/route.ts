import { NextRequest } from "next/server";
import { db, conversations, messages, tasksTable, eventsTable, remindersTable } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { ai, buildSystemPrompt, tools } from "@/lib/gemini";
import { pushTaskToGoogleCalendar } from "@/lib/google-calendar";

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
  
  const systemPrompt = buildSystemPrompt();

  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" as const : "user" as const,
    parts: [{ text: m.content }],
  }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model: "gemini-3.1-flash-lite",
          contents: contents,
          config: {
            systemInstruction: systemPrompt,
            tools: tools,
            maxOutputTokens: 8192,
          }
        });

        let fullText = "";
        let functionCalls: any[] = [];

        for await (const chunk of responseStream) {
          if (chunk.text) {
            fullText += chunk.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk.text })}\n\n`));
          }
          if (chunk.functionCalls && chunk.functionCalls.length > 0) {
            functionCalls.push(...chunk.functionCalls);
          }
        }

        if (fullText.trim()) {
          await db.insert(messages).values({ conversationId: convId, role: "assistant", content: fullText });
        }

        for (const call of functionCalls) {
          const args = call.args as any;
          if (call.name === "createTask") {
            const dueDate = args.dueDate ? new Date(args.dueDate) : null;
            const [newTask] = await db.insert(tasksTable).values({
              userId: user.id,
              title: args.title,
              priority: args.priority || "medium",
              bucket: args.bucket || "today",
              dueDate: dueDate,
            }).returning({ id: tasksTable.id });
            
            // Automatic reminder at 09:00 on due date if specified
            if (dueDate) {
              const reminderDate = new Date(dueDate);
              reminderDate.setHours(9, 0, 0, 0);
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
              const dueDate = t.dueDate ? new Date(t.dueDate) : null;
              const [newTask] = await db.insert(tasksTable).values({
                userId: user.id,
                title: t.title,
                priority: t.priority || "medium",
                bucket: t.bucket || "today",
                dueDate: dueDate,
              }).returning({ id: tasksTable.id });
              
              if (dueDate) {
                const reminderDate = new Date(dueDate);
                reminderDate.setHours(9, 0, 0, 0);
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
              startTime: new Date(args.startTime),
              endTime: new Date(args.endTime),
              location: args.location || null,
              source: "ai"
            });
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: args })}\n\n`));
          } else if (call.name === "createReminder") {
            await db.insert(remindersTable).values({
              userId: user.id,
              taskId: args.taskId,
              channel: args.channel,
              scheduledAt: new Date(args.scheduledAt)
            });
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ reminder: args })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (err) {
        console.error("Gemini Error:", err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`));
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
