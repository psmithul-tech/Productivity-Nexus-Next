import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch (err: any) {
    return NextResponse.json({ 
      status: "error", 
      message: err.message, 
      dbUrlMasked: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.slice(0, 15)}...` : "NOT_SET"
    }, { status: 500 });
  }
}
