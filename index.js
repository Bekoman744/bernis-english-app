import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const CLIENTS = [
  {
    key: process.env.GEMINI_API_KEY_1,
    models: ["gemini-2.0-flash"]
  },
  {
    key: process.env.GEMINI_API_KEY_2,
    models: ["gemini-2.0-flash"]
  }
];

async function askGemini(question) {
  for (const client of CLIENTS) {
    const ai = new GoogleGenAI({ apiKey: client.key });

    for (const model of client.models) {
      try {
        console.log("🧠 Deneniyor:", model);
        const result = await ai.models.generateContent({
          model,
          contents: question
        });
        return result.text;
      } catch (err) {
        const msg = err?.message || "";
        if (
          msg.includes("429") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("NOT_FOUND")
        ) {
          console.log("⚠️ Atlandı:", model);
          continue;
        }
        throw err;
      }
    }
  }

  return "Şu an yoğunluk var, lütfen biraz sonra tekrar dene.";
}

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    const answer = await askGemini(question);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3001, () => {
  console.log("✅ Backend çalışıyor: http://localhost:3001");
});
