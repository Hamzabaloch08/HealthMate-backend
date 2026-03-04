import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";
import cloudinary from "../config/cloudinary.mjs";
import { client } from "../config/db.mjs";

const reportCollection = client.db("healthMateDB").collection("userReports");
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
    const userName = req.user.firstName;

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
        { folder: "healthmate", resource_type: "auto" },
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

IMPORTANT: If the file is NOT a medical/health report (e.g. invoice, resume, random document), respond ONLY with:
{ "response": "I'm HealthMate, I can only analyze medical and health reports.", "summary": "", "dietTips": [], "isMedicalReport": false }

If it IS a medical report, respond using this JSON structure:
{
  "response": "6-8 short simple lines about the actual findings.",
  "summary": "3-4 line easy summary.",
  "dietTips": ["1-2 short diet tips based on report findings"],
  "isMedicalReport": true
}`,
      );

      const result = await jsonModel.generateContent(content);
      const parsed = JSON.parse(result.response.text());
      if (parsed.isMedicalReport) {
        const reportPayload = {
          userId: req.user.id,
          fileUrl,
          summary: parsed.summary,
          dietTips: parsed.dietTips,
          type: "ai",
          createdAt: new Date(),
        };

        await reportCollection.insertOne(reportPayload);
      }

      return res.json({ success: true, type: "report", fileUrl, ...parsed });
    }

    if (file && message) {
      // PDF + message
      content.push(
        `You are HealthMate — a friendly AI health assistant.
The user's name is ${userName}.
A file is attached with a user question.
IMPORTANT: If the file is NOT a medical/health report, respond ONLY with:
{ "response": "I'm HealthMate, I can only analyze medical and health reports.", "summary": "", "dietTips": [], "isMedicalReport": false }

If it IS a medical report, answer the user's question based on this report.
If the user greets you (hello, hi, salam, etc), greet them back warmly and ask how you can help with their health.
LANGUAGE: Use English and Roman Urdu mixed together naturally.
TONE: Simple, short sentences.

Respond using this JSON structure:
{
  "response": "answer to user's question based on the report",
  "summary": "3-4 line easy summary of the report.",
  "dietTips": ["1-2 short diet tips based on report findings"],
  "isMedicalReport": true
}

User's question: "${message}"`,
      );

      const result = await jsonModel.generateContent(content);
      const parsed = JSON.parse(result.response.text());
      if (parsed.isMedicalReport) {
        const reportPayload = {
          userId: req.user.id,
          fileUrl,
          summary: parsed.summary,
          dietTips: parsed.dietTips,
          type: "ai",
          createdAt: new Date(),
        };
        await reportCollection.insertOne(reportPayload);
      }
      return res.json({ success: true, type: "report-chat", fileUrl, ...parsed });
    }

    // normal health chat
    content.push(
      `You are HealthMate, an AI health assistant.
The user's name is ${userName}.
Detect user's language (English, Urdu, Roman Urdu). Reply in same language.
Only answer health, medicine, diet, or wellness questions.
If the user greets you (hello, hi, salam, assalamualaikum, etc), greet them back warmly and ask how you can help with their health.
If the message is unrelated to health AND not a greeting, say: "I'm trained to answer health-related questions only."
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
    if (err.status === 429) {
      return res.status(429).json({ error: "Daily limit reached. Please try again after 24 hours." });
    }
    res.status(500).json({ error: "AI request failed" });
  }
};
