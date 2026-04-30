import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Gemini API Key is missing. AI features will be disabled.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const enhanceItemDescription = async (shortDescription: string): Promise<string> => {
  try {
    const client = getAiClient();
    if (!client) return shortDescription;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an assistant for a Prop Shop called "Saraab". 
      Write a concise, professional, and descriptive line item for an invoice based on this keyword: "${shortDescription}". 
      Mention texture, era, or material if implied. Keep it under 15 words. Do not use quotes.`,
    });

    return response.text?.trim() || shortDescription;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return shortDescription;
  }
};