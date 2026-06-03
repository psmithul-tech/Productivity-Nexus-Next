import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/GEMINI_API_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].trim() : null;
const ai = new GoogleGenAI({ apiKey: key });
async function run() {
  try {
    const res = await ai.models.generateContent({ model: "gemini-3.1-flash-lite", contents: "hi" });
    console.log("Success:", res.text);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();
