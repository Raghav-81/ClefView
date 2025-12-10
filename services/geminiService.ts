import { GoogleGenAI, Type } from "@google/genai";
import { AudioAnalysisResult } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert musicologist and audio engineer AI. 
Your task is to analyze audio inputs and provide a structured musical analysis.
1. Identify the instruments present (Source Separation context).
2. Estimate the Tempo (BPM) and Key Signature.
3. Generate a COMPLETE transcription of the FULL song (or as much as fits in context) in ABC Notation format. Do not summarize; write out the notes.
4. Provide a brief description of the musical style and mood.

Output strictly JSON.
`;

export const analyzeAudio = async (base64Audio: string, mimeType: string): Promise<AudioAnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: "Analyze this audio clip. Identify instruments, tempo, key, and transcribe the FULL melody to ABC notation."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            instruments: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of detected instruments"
            },
            tempo: { type: Type.STRING, description: "Estimated BPM" },
            keySignature: { type: Type.STRING, description: "Key of the piece" },
            transcription: { type: Type.STRING, description: "ABC Notation of the full melody" },
            description: { type: Type.STRING, description: "Brief musical analysis" }
          },
          required: ["instruments", "tempo", "keySignature", "transcription", "description"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AudioAnalysisResult;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};