import { NextRequest } from "next/server";
import { db, conversations, messages, tasksTable } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { ai, buildSystemPrompt, extractTaskFromResponse, stripCreateTask } from "@/lib/gemini";

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

  const chatMessages = history.map((m) => ({
    role: m.role === "assistant" ? "model" as const : "user" as const,
    parts: [{ text: m.content }],
  }));

  const contentToSend = chatMessages.length === 1
    ? [{ role: "user" as const, parts: [{ text: `${systemPrompt}\n\n${content}` }] }]
    : [
        { role: "user" as const, parts: [{ text: systemPrompt }] },
        { role: "model" as const, parts: [{ text: "Understood. I'm your AI Chief of Staff. How can I help you today?" }] },
        ...chatMessages,
      ];

  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const aiStream = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: contentToSend,
          config: { maxOutputTokens: 8192 },
        });

        let pendingChunk = "";
        for await (const chunk of aiStream) {
          const text = chunk.text;
          if (text) {
            fullResponse += text;
            pendingChunk += text;
            const visible = stripCreateTask(pendingChunk);
            if (visible) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: visible })}\n\n`));
              pendingChunk = "";
            }
          }
        }
        const remaining = stripCreateTask(pendingChunk);
        if (remaining) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: remaining })}\n\n`));

        const taskData = extractTaskFromResponse(fullResponse);
        const cleanResponse = stripCreateTask(fullResponse);

        await db.insert(messages).values({ conversationId: convId, role: "assistant", content: cleanResponse });

        if (taskData) {
          try {
            await db.insert(tasksTable).values({ userId: user.id, 
              title: String(taskData.title || "New task"),
              priority: String(taskData.priority || "medium"),
              bucket: String(taskData.bucket || "today"),
              dueDate: taskData.dueDate ? new Date(String(taskData.dueDate)) : undefined,
            });
          } catch { /* ignore task creation errors */ }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ task: taskData })}\n\n`));
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (err) {
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
