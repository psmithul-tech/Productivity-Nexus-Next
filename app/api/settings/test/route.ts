import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ai } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, url, token, chatId, origin } = body;

  try {
    if (type === "discord") {
      if (!url) return NextResponse.json({ error: "Discord Webhook URL is missing." }, { status: 400 });
      
      const prompt = `You are Restia, an AI Chief of Staff. Write a very brief (1-2 sentences), cheerful, and human-like welcome message to test a Discord integration. Introduce yourself. Use emojis.`;
      const aiRes = await ai.models.generateContent({ model: "gemini-3.1-flash-lite", contents: [{ role: "user", parts: [{ text: prompt }] }] });
      const textMsg = aiRes.text || "👋 Hello, I'm Restia! Your Discord integration is working perfectly.";
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textMsg })
      });
      
      if (!res.ok) throw new Error("Discord API rejected the request. Check your URL.");
      return NextResponse.json({ success: true, message: "Discord test message sent!" });
      
    } else if (type === "telegram") {
      if (!token || !chatId) return NextResponse.json({ error: "Telegram Token or Chat ID missing." }, { status: 400 });
      
      // 1. Set Webhook
      if (origin) {
        const webhookUrl = `${origin}/api/webhooks/telegram`;
        const setWebhookRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
        if (!setWebhookRes.ok) {
          console.error("Failed to set webhook", await setWebhookRes.text());
        }
      }

      // 2. Send Test Message
      const prompt = `You are Restia, an AI Chief of Staff. Write a very brief (1-2 sentences), cheerful, and human-like welcome message to test a Telegram integration. Introduce yourself. Tell them they can reply to add tasks. Use emojis.`;
      const aiRes = await ai.models.generateContent({ model: "gemini-3.1-flash-lite", contents: [{ role: "user", parts: [{ text: prompt }] }] });
      const textMsg = aiRes.text || "👋 Hello, I'm Restia! Your Telegram integration is working perfectly. You can now reply to me to add tasks or check your schedule!";

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: textMsg
        })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.description || "Telegram API rejected the request. Check your Token and Chat ID.");
      }
      
      return NextResponse.json({ success: true, message: "Telegram test message sent and webhook registered!" });
      
    } else {
      return NextResponse.json({ error: "Invalid integration type." }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
