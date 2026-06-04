import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));
  if (!settings) return NextResponse.json({ error: "No settings found" }, { status: 404 });
  return NextResponse.json({ ...settings, createdAt: settings.createdAt.toISOString() });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  
  const allowedFields: Record<string, any> = {};
  const fieldMap: Record<string, string> = {
    workdayStart: 'workdayStart',
    workdayEnd: 'workdayEnd',
    quietHoursStart: 'quietHoursStart',
    quietHoursEnd: 'quietHoursEnd',
    focusModeEnabled: 'focusModeEnabled',
    hourlyUpdatesEnabled: 'hourlyUpdatesEnabled',
    timezone: 'timezone',
    discordWebhookUrl: 'discordWebhookUrl',
    telegramBotToken: 'telegramBotToken',
    telegramChatId: 'telegramChatId',
    geminiApiKey: 'geminiApiKey',
    googleAccessToken: 'googleAccessToken',
    googleRefreshToken: 'googleRefreshToken',
    accentColor: 'accentColor',
  };
  
  for (const [key, schemaKey] of Object.entries(fieldMap)) {
    if (key in body && body[key] !== undefined) {
      allowedFields[schemaKey] = body[key];
    }
  }

  // Handle username separately with validation
  if ("username" in body && body.username !== undefined) {
    const rawUsername = body.username as string;
    const cleanUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, "");
    
    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
    }
    if (cleanUsername.length > 20) {
      return NextResponse.json({ error: "Username must be under 20 characters." }, { status: 400 });
    }

    // Check uniqueness (excluding current user)
    const [taken] = await db
      .select({ id: settingsTable.id, userId: settingsTable.userId })
      .from(settingsTable)
      .where(eq(settingsTable.username, cleanUsername));
    
    if (taken && taken.userId !== user.id) {
      return NextResponse.json({ error: `@${cleanUsername} is already taken.` }, { status: 409 });
    }

    allowedFields.username = cleanUsername;
  }
  
  const [existing] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));
  if (existing) {
    const [updated] = await db.update(settingsTable).set(allowedFields).where(eq(settingsTable.userId, user.id)).returning();
    return NextResponse.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  }
  const [created] = await db.insert(settingsTable).values({ ...allowedFields, userId: user.id }).returning();
  return NextResponse.json({ ...created, createdAt: created.createdAt.toISOString() }, { status: 201 });
}
