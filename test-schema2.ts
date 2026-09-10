import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Generate 2 quiz questions about space.",
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING" },
              options: { type: "ARRAY", items: { type: "STRING" } },
              correctAnswer: { type: "INTEGER" }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      }
    });
    console.log("Success:", response.text);
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
