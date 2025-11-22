import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedMoodResponse, MoodResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMood = async (base64Image: string): Promise<MoodResult> => {
  // Strip the prefix if present (e.g., "data:image/jpeg;base64,")
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          {
            text: `Analyze this selfie and generate a funny, slightly exaggerated, meme-worthy 'mood diagnosis'. 
            It should be in the style of viral internet content (e.g., '93% Done with Life', '110% Chaos Energy').
            
            Return JSON with:
            - mood_percentage: A number between 0 and 100 representing intensity.
            - mood_label: Short, punchy title (max 5 words).
            - witty_comment: A one-sentence roast or funny observation about the expression.
            - accent_color: A hex code string that matches the vibe (e.g., #FF0000 for angry, #00FF00 for happy).
            `
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood_percentage: { type: Type.NUMBER },
            mood_label: { type: Type.STRING },
            witty_comment: { type: Type.STRING },
            accent_color: { type: Type.STRING },
          },
          required: ["mood_percentage", "mood_label", "witty_comment", "accent_color"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const json: GeneratedMoodResponse = JSON.parse(text);

    return {
      percentage: json.mood_percentage,
      label: json.mood_label,
      description: json.witty_comment,
      colorHex: json.accent_color,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback in case of API failure or safety block
    return {
      percentage: 69,
      label: "Mysteriously Vague",
      description: "The AI is confused by your overwhelming aura.",
      colorHex: "#A855F7"
    };
  }
};