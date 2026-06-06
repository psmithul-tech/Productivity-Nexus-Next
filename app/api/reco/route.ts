import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const n = searchParams.get("n") || "20";

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const response = await fetch(`http://127.0.0.1:8000/reco/recommend?user_id=${userId}&n=${n}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python backend error: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Reco API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch recommendations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Trigger a fit/training run
  try {
    const response = await fetch(`http://127.0.0.1:8000/reco/fit`, {
      method: "POST"
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python backend error: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Reco Fit Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fit recommendations" }, { status: 500 });
  }
}
