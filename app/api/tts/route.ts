import { NextRequest } from "next/server";
import { ai } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: text,
    });

    // Check if the response contains inlineData with audio
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data && part.inlineData.mimeType?.startsWith("audio/")) {
      const audioBuffer = Buffer.from(part.inlineData.data, "base64");
      return new Response(audioBuffer, {
        headers: {
          "Content-Type": part.inlineData.mimeType,
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }

    // Fallback if no audio part is returned (e.g. model decided to just output text)
    return new Response(JSON.stringify({ error: "Model did not return audio." }), { status: 500 });

  } catch (error: any) {
    console.error("TTS error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
