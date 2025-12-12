import { GoogleGenAI, Type } from "@google/genai";
import { AudioAnalysisResult } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert musicologist, composer, and audio engineer AI. 
Your task is to analyze audio inputs and provide a professional musical transcription.

1. **Source Separation & Identification**: Identify all instruments.
2. **Analysis**: Estimate Tempo (BPM) and Key Signature.
3. **Multi-Part Transcription**: 
   - Generate ABC Notation. 
   - You MUST return a dictionary of transcriptions.
   - Key "Full Score": A Grand Staff (Treble + Bass if applicable) or multi-voice notation containing the whole song. Use 'V:1', 'V:2' syntax for voices.
   - Key "Melody": Isolated melody line.
   - Key "Bass": Isolated bass line.
   - Additional keys for other detected instruments (e.g., "Piano", "Guitar") if distinguishable.
   - Ensure the ABC notation is valid and uses headers (X:, T:, M:, L:, K:) correctly.

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
            text: "Analyze this audio. Provide a Full Score (Grand Staff) and isolated separate parts for Melody, Bass, and any other major instruments found."
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
            partTranscriptions: {
              type: Type.OBJECT,
              description: "Dictionary where keys are instrument names (e.g., 'Full Score', 'Melody', 'Bass') and values are the ABC notation string for that part.",
            },
            description: { type: Type.STRING, description: "Brief musical analysis" }
          },
          required: ["instruments", "tempo", "keySignature", "partTranscriptions", "description"]
        }
      }
    });

    if (response.text) {
      // The API returns a stringified JSON which might contain the map as a generic object. 
      // We rely on the schema to structure it correctly.
      return JSON.parse(response.text) as AudioAnalysisResult;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};