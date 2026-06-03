import { NextRequest, NextResponse } from "next/server";
import { db, conversations, messages, tasksTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { ai, buildSystemPrompt, extractTaskFromResponse, stripCreateTask } from "@/lib/gemini";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const convs = await db.select().from(conversations).orderBy(conversations.createdAt);
  return NextResponse.json(convs.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title } = await req.json();
  const [conv] = await db.insert(conversations).values({ title: title || "New conversation" }).returning();
  return NextResponse.json({ ...conv, createdAt: conv.createdAt.toISOString() }, { status: 201 });
}
