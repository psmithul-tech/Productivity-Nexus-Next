import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable, tasksTable, eventsTable, remindersTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { ai, buildSystemPrompt, tools } from "@/lib/gemini";
import { pushTaskToGoogleCalendar } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Telegram sends message objects
    if (!body.message || !body.message.text || !body.message.chat) {
      return NextResponse.json({ ok: true }); // Ignore non-text messages
    }
    
    const chatId = body.message.chat.id.toString();
    const text = body.message.text;

    // Look up the user by their Telegram Chat ID
    const [userSettings] = await db.select().from(settingsTable).where(eq(settingsTable.telegramChatId, chatId));
    
    if (!userSettings) {
      // Return a message telling them to link their account
      return NextResponse.json({
        method: "sendMessage",
        chat_id: chatId,
        text: "I don't recognize this chat. Please add this Chat ID to your Productivity Nexus settings."
      });
    }

    const userId = userSettings.userId;
    const systemPrompt = buildSystemPrompt();

    // Call Gemini to parse and respond
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        systemInstruction: systemPrompt,
        tools: tools,
        maxOutputTokens: 1024,
      }
    });

    let replyText = response.text || "";
    let actionsTaken = [];

    // Execute any function calls Gemini requested
    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const call of response.functionCalls) {
        const args = call.args as any;
        
        if (call.name === "createTask") {
          const dueDate = args.dueDate ? new Date(args.dueDate) : null;
          const [newTask] = await db.insert(tasksTable).values({
            userId,
            title: args.title,
            priority: args.priority || "medium",
            bucket: args.bucket || "today",
            dueDate: dueDate,
          }).returning({ id: tasksTable.id });
          
          if (dueDate) {
            const reminderDate = new Date(dueDate);
            reminderDate.setHours(9, 0, 0, 0);
            if (reminderDate > new Date()) {
              await db.insert(remindersTable).values({
                userId, taskId: newTask.id, channel: "telegram", scheduledAt: reminderDate,
              });
            }
            pushTaskToGoogleCalendar(userId, args.title, dueDate).catch(console.error);
          }
          actionsTaken.push(`Created task: ${args.title}`);
          
        } else if (call.name === "createTasksBatch") {
          const batchArgs = args.tasks || [];
          for (const t of batchArgs) {
            const dueDate = t.dueDate ? new Date(t.dueDate) : null;
            const [newTask] = await db.insert(tasksTable).values({
              userId,
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
                  userId, taskId: newTask.id, channel: "telegram", scheduledAt: reminderDate,
                });
              }
              pushTaskToGoogleCalendar(userId, t.title, dueDate).catch(console.error);
            }
          }
          actionsTaken.push(`Created ${batchArgs.length} tasks`);
          
        } else if (call.name === "createEvent") {
          await db.insert(eventsTable).values({
            userId,
            title: args.title,
            startTime: new Date(args.startTime),
            endTime: new Date(args.endTime),
            location: args.location || null,
            source: "ai"
          });
          actionsTaken.push(`Scheduled event: ${args.title}`);
          
        } else if (call.name === "createReminder") {
          await db.insert(remindersTable).values({
            userId, taskId: args.taskId, channel: args.channel, scheduledAt: new Date(args.scheduledAt)
          });
          actionsTaken.push(`Set a reminder`);
        }
      }
    }

    // Combine Gemini's natural response with our explicit action confirmations
    let finalText = replyText;
    if (actionsTaken.length > 0) {
      const actionsStr = actionsTaken.map(a => `✅ ${a}`).join("\n");
      finalText = finalText ? `${finalText}\n\n${actionsStr}` : actionsStr;
    }
    
    if (!finalText) {
      finalText = "I processed that for you.";
    }

    // Reply to Telegram
    return NextResponse.json({
      method: "sendMessage",
      chat_id: chatId,
      text: finalText
    });

  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true }); // Still return 200 so Telegram doesn't retry infinitely
  }
}
