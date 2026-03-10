import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { createHash } from "crypto";
import { getCache, setCache } from "./cache";
import { SentimentAnalysisResult } from "@pulse/shared";
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

const SYSTEM_PROMPT = `
You are a sentiment analysis engine.
You respond ONLY with valid JSON — no markdown, no backticks,
no explanation, no preamble.
Your JSON must exactly match the schema provided.
`;

function buildUserPrompt(text: string) {
    return `
Analyze the sentiment of the following text and return a JSON
object matching this exact schema:

{
  "score":      <integer 0-100, 0=extremely negative, 100=extremely positive>,
  "confidence": <integer 0-100, your confidence in this analysis>,
  "label":      <"positive" | "neutral" | "negative">,
  "summary":    "<one sentence describing the overall sentiment tone>",
  "emotions": {
    "joy":      <float 0-1>,
    "anger":    <float 0-1>,
    "fear":     <float 0-1>,
    "sadness":  <float 0-1>,
    "surprise": <float 0-1>,
    "disgust":  <float 0-1>
  },
  "keywords": [
    { "word": "<string>", "sentiment": <float -1 to 1> }
    // up to 8 most sentiment-charged words
  ],
  "sentences": [
    { "text": "<sentence>", "sentiment": <float -1 to 1> }
    // each sentence from the input
  ]
}

Text to analyze:
"""
${text}
"""
  `;
}

export async function analyzeText(text: string): Promise<SentimentAnalysisResult & { fromCache?: boolean }> {
    // 1. CHECK CACHE FIRST — never call AI for duplicate text
    const hash = createHash("sha256").update(text.trim()).digest("hex");
    const cacheKey = `analysis:${hash}`;
    const cached = await getCache<SentimentAnalysisResult>(cacheKey);

    if (cached) {
        console.log(`[CACHE HIT] analysis:${hash}`);
        return { ...cached, fromCache: true };
    }

    // 2. TRY GEMINI (primary)
    let result: SentimentAnalysisResult | null = null;
    try {
        console.log(`[AI TRY] calling Gemini...`);
        result = await callGemini(text);
    } catch (err: any) {
        console.warn("[AI ERROR] Gemini failed, trying Groq:", err.message);
    }

    // 3. FALLBACK TO GROQ
    if (!result) {
        try {
            console.log(`[AI TRY] falling back to Groq...`);
            result = await callGroq(text);
        } catch (err: any) {
            console.error("[AI ERROR] Both AI providers failed:", err.message);
            throw new Error("AI_UNAVAILABLE");
        }
    }

    // 4. STORE IN CACHE (24 hour TTL)
    await setCache(cacheKey, result, 60 * 60 * 24);

    return result;
}

async function callGemini(text: string): Promise<SentimentAnalysisResult> {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
        }
    });
    const response = await model.generateContent(buildUserPrompt(text));
    const responseText = response.response.text();

    // Quick safety clean to remove backticks if the model still adds them
    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);
}

async function callGroq(text: string): Promise<SentimentAnalysisResult> {
    const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(text) }
        ]
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Groq returned empty response");

    return JSON.parse(content);
}
