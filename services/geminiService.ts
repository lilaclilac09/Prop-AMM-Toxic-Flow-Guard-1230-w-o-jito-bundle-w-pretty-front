
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeTransactionPattern = async (txData: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following Solana transaction log for Toxic MEV behavior.
      Focus on identifying high Compute Units (CU), suspicious bundle patterns, and stale quote exploitation.
      
      Transaction Logs:
      ${txData}
      
      Explain if this looks like Toxic Flow (sniping stale quotes), Arb, or Organic user.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: { type: Type.STRING, description: 'TOXIC, ORGANIC, or ARB' },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            riskScore: { type: Type.INTEGER, description: '1-100 score' }
          },
          required: ['classification', 'confidence', 'reasoning', 'riskScore']
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
