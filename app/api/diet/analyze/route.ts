import { AGENTS } from "@/lib/agents";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { callOpenRouterVision } from "@/lib/vision";
import { callOpenRouter } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { imageBase64, textDescription } = await req.json();
    if (!imageBase64 && !textDescription) {
      return NextResponse.json({ error: "Missing image or text description" }, { status: 400 });
    }

    const prompt = `Analyze this meal. 
Identify the main food items and estimate their nutritional value.
Output ONLY a raw JSON object (no markdown fences) with the following structure:
{
  "foodItems": ["Item 1", "Item 2"],
  "calories": 450,
  "protein": 25,
  "carbs": 40,
  "fat": 15
}
Be as accurate as possible with the estimates. If it's not food, return all 0s and empty array.`;

    let result;
    if (imageBase64) {
      result = await callOpenRouterVision(imageBase64, prompt, {
        model: AGENTS.VISION_AGENT,
        temperature: 0.1,
        jsonMode: true,
      });
    } else {
      result = await callOpenRouter(
        `Meal description: ${textDescription}\n\n${prompt}`,
        "You are an expert nutritionist.",
        {
          model: AGENTS.VISION_AGENT,
          temperature: 0.1,
          jsonMode: true,
        }
      );
    }

    if (!result) throw new Error("No result from AI");

    const jsonStr = result.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Diet analyze error:", error);
    return NextResponse.json({ error: "Failed to analyze meal" }, { status: 500 });
  }
}
