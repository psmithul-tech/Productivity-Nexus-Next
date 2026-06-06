import { NextRequest, NextResponse } from "next/server";
import { db, mealLogsTable } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    
    const { mealType, foodItems, calories, protein, carbs, fat, loggedAt } = body;

    const [updated] = await db
      .update(mealLogsTable)
      .set({
        mealType,
        foodItems: typeof foodItems === 'string' ? foodItems : JSON.stringify(foodItems),
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
        loggedAt: loggedAt ? new Date(loggedAt) : undefined,
      })
      .where(and(eq(mealLogsTable.id, parseInt(id)), eq(mealLogsTable.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Meal not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, meal: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(mealLogsTable)
      .where(and(eq(mealLogsTable.id, parseInt(id)), eq(mealLogsTable.userId, user.id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Meal not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
