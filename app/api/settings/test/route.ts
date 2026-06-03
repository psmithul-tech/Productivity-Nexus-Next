import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "👋 Hello from Productivity Nexus! Your Discord integration is working perfectly."
        })
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
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "👋 Hello from Productivity Nexus! Your Telegram integration is working perfectly. You can now reply to me to add tasks or check your schedule!"
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
