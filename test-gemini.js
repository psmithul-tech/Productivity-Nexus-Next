import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: "invalid_key" });
  try {
    const stream = await ai.models.generateContentStream({
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: "hi" }] }]
    });
    for await (const chunk of stream) {
      console.log(chunk.text);
    }
  } catch (err) {
    console.error("Gemini Error Caught:", err.message);
  }
}
run();
