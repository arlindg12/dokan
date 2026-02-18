
import { GoogleGenAI } from "@google/genai";

// Use the pre-configured process.env.API_KEY directly for initialization as per guidelines.
export const getGeminiInsights = async (shopData: any) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Analyze the following shop management data and provide 3 key business recommendations.
        Data: ${JSON.stringify(shopData)}
        Focus on: Stock efficiency, sales trends, and financial health.
        Keep it concise (3 bullet points).
      `,
    });
    // The text property returns the generated string directly.
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Unable to generate insights at this time.";
  }
};
