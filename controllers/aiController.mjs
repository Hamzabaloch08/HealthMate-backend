import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";
import cloudinary from "../config/cloudinary.mjs";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

const jsonModel = genAI.getGenerativeModel({
  model: "models/gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

/* One endpoint for everything: chat, pdf, pdf + chat */
export const chat = async (req, res) => {
  try {
    const { message } = req.body;
    const file = req.file;
    const userName = req.user.firstName

    if (!message && !file) {
      return res.status(400).json({ error: "Message or file required" });
    }

    const content = [];
    let fileUrl = null;

    if (file) {
      const base64Data = file.buffer.toString("base64");

      content.push({
        inlineData: {
          mimeType: file.mimetype,
          data: base64Data,
        },
      });

      const uploaded = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${base64Data}`,
        { folder: "healthmate", resource_type: "auto" }
      );
      fileUrl = uploaded.secure_url;
    }

    if (file && !message) {
      //PDF — default analysis
      content.push(
        `You are HealthMate — a friendly AI health assistant. Talk like a caring friend.
The user's name is ${userName}.
Analyze this medical report. It can be any type (blood, urine, X-ray, MRI, ultrasound, liver, kidney, thyroid, sugar, ECG, etc).
Read the report carefully. Do not assume the report type.
LANGUAGE: Use English and Roman Urdu mixed together naturally.
TONE: Simple, easy to understand, short sentences.

Respond using this JSON structure:
{
  "response": "6-8 short simple lines about the actual findings.",
  "summary": "3-4 line easy summary.",
  "dietTips": ["1-2 short diet tips based on report findings"]
}`,
      );

      const result = await jsonModel.generateContent(content);
      const parsed = JSON.parse(result.response.text());
      return res.json({ success: true, type: "report", fileUrl, ...parsed });
    }

    if (file && message) {
      // PDF + message
      content.push(
        `You are HealthMate — a friendly AI health assistant.
The user's name is ${userName}.
A medical report is attached. Answer the user's question based on this report.
LANGUAGE: Use English and Roman Urdu mixed together naturally.
TONE: Simple, short sentences. Plain text only, no markdown.

User's question: "${message}"`,
      );

      const result = await model.generateContent(content);
      const reply = result.response
        .text()
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/\n+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return res.json({ success: true, type: "report-chat", fileUrl, reply });
    }

    // Sirf message — normal health chat
    content.push(
      `You are HealthMate, an AI health assistant.
The user's name is ${userName}.
Detect user's language (English, Urdu, Roman Urdu). Reply in same language.
Only answer health, medicine, diet, or wellness questions.
If unrelated, say: "I'm trained to answer health-related questions only."
Do not use markdown or formatting. Write plain text only, simple sentences.

User message: "${message}"`,
    );

    const result = await model.generateContent(content);
    const reply = result.response
      .text()
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    res.json({ success: true, type: "chat", reply });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
};
