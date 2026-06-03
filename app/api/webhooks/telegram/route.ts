import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable, tasksTable, eventsTable, remindersTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { ai, buildSystemPrompt, tools } from "@/lib/gemini";
import { pushTaskToGoogleCalendar } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  let chatId: string | null | undefined;
  let token: string | null | undefined;

  try {
    const body = await req.json();
    
    // Telegram sends message objects
    if (!body.message || !body.message.text || !body.message.chat) {
      return NextResponse.json({ ok: true }); // Ignore non-text messages
    }
    
    chatId = body.message.chat.id.toString();
    const text = body.message.text;

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    // Look up the user by their Telegram Chat ID
    const [userSettings] = await db.select().from(settingsTable).where(eq(settingsTable.telegramChatId, chatId));
    
    if (!userSettings) {
      // Return a message telling them their Chat ID so they can link it easily
      return NextResponse.json({
        method: "sendMessage",
        chat_id: chatId,
        text: `I don't recognize this chat! Your Telegram Chat ID is:\n\n\`${chatId}\`\n\nPlease copy this number and save it in your Productivity Nexus Settings page to link your account.`
      });
    }

    const userId = userSettings.userId;
    token = userSettings.telegramBotToken?.trim();

    // Fetch active tasks to give Gemini context
    const allTasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, userId));
    const activeTasks = allTasks.filter(t => t.status === "active");
    const tasksContext = `
Here are the user's current active tasks:
${activeTasks.length === 0 ? "No active tasks." : activeTasks.map(t => `- ${t.title} (Priority: ${t.priority}, Bucket: ${t.bucket}${t.dueDate ? `, Due: ${new Date(t.dueDate).toLocaleDateString()}` : ''})`).join("\n")}
`;

    const systemPrompt = buildSystemPrompt() + tasksContext + "\nCRITICAL RULE: You MUST always output a cheerful, conversational text response to the user, EVEN IF you are calling a function/tool! Never return only a function call without text. If they ask for their tasks, read them from the context provided above.";

    // Call Gemini to parse and respond
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

    // Reply to Telegram via direct fetch (more reliable than webhook response)
    if (token) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: finalText
        })
      });
    }

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error("Telegram webhook error:", error);
    
    if (chatId && token) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Oops! I encountered an error: ${error.message}`
        })
      }).catch(() => {});
    }
    
    return NextResponse.json({ ok: true });
  }
}
