
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ProductAnalysis } from "../types";

// Helper to get API key
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API_KEY environment variable is missing.");
  }
  return key;
};

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ANALYSIS_SYSTEM_INSTRUCTION = `
You are the full AI engine of a greenwashing detection app called GreenLens.
You will receive any of these inputs:
- Product label image (OCR needed)
- Barcode number
- Product name
- Ingredient list
- Marketing claims
- Certification text/logos

Your job is to: Scan → Extract → Analyze → Warn → Recommend → Speak → Return JSON

STEP 1 — SCAN & EXTRACT INFORMATION
From the input, extract:
- Product name
- Product category (Food / Cosmetic / Home Product / Other)
- Full ingredients (clean list)
- Marketing claims found on label
- Certification names/logos
If something is missing, say: "📌 Not enough label information detected".

STEP 2 — INGREDIENT SAFETY ANALYSIS
For every ingredient, show:
- Purpose
- Health Risk: Low / Medium / High
- Environmental Risk: Low / Medium / High
- Safety Emoji: 🌱 Safe / ⚠️ Caution / ❌ Avoid
- Max 12-word explanation in simple language
Highlight ❌ harmful and ⚠️ risky ones in alerts later.

STEP 3 — ALLERGY & SENSITIVITY CHECK
Check for:
- Major food allergens: peanuts, nuts, soy, gluten, milk, eggs, shellfish, sesame
- Skin triggers: fragrance, parabens, sulfates, formaldehyde releasers, nickel
- Lactose, artificial colors, artificial sweeteners
Output:
- Ingredient name
- Risk: Allergy / Sensitivity
- 1-line warning
If none: "No common allergens or sensitivities detected 👍".

STEP 4 — GREENWASHING CHECK
Identify:
- Fake or vague "Natural/Organic/Eco" claims
- Hidden harmful ingredients
- Weak or fake certifications
- Misleading icons
For each flagged claim:
- Technique type
- Truth Score (1–10)
- Evidence required to be true

STEP 5 — CERTIFICATION VERIFICATION
For each certification:
- ✔️ Trusted / ⚠️ Weak / ❌ Fake or Marketing Only
- One short reason

STEP 6 — FINAL SCORE & DECISION
- EcoScore (0–100)
- Greenwashing Risk: Low / Medium / High
- Health Decision: ✔️ Good Choice / ⚠️ Think Twice / ❌ Avoid
- One actionable tip for the user (mapped to safety_advice)

STEP 7 — ALTERNATIVES
Suggest 1–2 safer / allergy-friendly options:
- Product name
- Why it’s better

STEP 8 — VOICE MODE SUMMARY
Provide a friendly 5-line spoken-style summary with emojis:
- Summary
- Good things
- Risks
- Smart suggestion
- Encouragement

STEP 9 — JSON FORMAT (for API/Firebase)
Provide a second version ONLY in JSON format according to the schema.
`;

export const analyzeProductWithGemini = async (
  textInput: string,
  imageFile?: File
): Promise<ProductAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const parts: any[] = [];
  
  if (imageFile) {
    const imagePart = await fileToGenerativePart(imageFile);
    parts.push(imagePart);
  }
  
  if (textInput) {
    parts.push({ text: textInput });
  } else if (!imageFile) {
     throw new Error("Please provide text or an image.");
  }

  // Schema definition for strictly typed JSON output
  const schema = {
    type: Type.OBJECT,
    properties: {
      product_name: { type: Type.STRING },
      product_type: { type: Type.STRING },
      eco_score: { type: Type.INTEGER },
      greenwashing_risk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
      final_decision: { type: Type.STRING, enum: ["Good Choice", "Think Twice", "Avoid"] },
      safety_advice: { type: Type.STRING },
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            purpose: { type: Type.STRING },
            health_risk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            environment_risk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            safety: { type: Type.STRING },
            explanation: { type: Type.STRING },
          }
        }
      },
      allergy_alerts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            ingredient: { type: Type.STRING },
            risk_type: { type: Type.STRING, enum: ["Allergy", "Sensitivity"] },
            warning: { type: Type.STRING }
          }
        }
      },
      claims_analysis: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            claim: { type: Type.STRING },
            technique_type: { type: Type.STRING },
            truth_score: { type: Type.INTEGER },
            evidence_required: { type: Type.STRING },
            flagged: { type: Type.BOOLEAN }
          }
        }
      },
      certifications: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            status: { type: Type.STRING, enum: ["Trusted", "Weak", "Fake", "Marketing"] },
            explanation: { type: Type.STRING }
          }
        }
      },
      alternatives: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            product_name: { type: Type.STRING },
            reason: { type: Type.STRING }
          }
        }
      },
      voice_output: { type: Type.STRING }
    },
    required: ["product_name", "eco_score", "greenwashing_risk", "final_decision", "ingredients", "allergy_alerts", "voice_output"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      role: 'user',
      parts: [
        ...parts,
        { text: "Analyze this product input and return the result in JSON format according to the schema." }
      ]
    },
    config: {
      systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("No response from AI");
  
  return JSON.parse(jsonText) as ProductAnalysis;
};

// Helper for TTS
export const generateSpeechFromText = async (text: string): Promise<AudioBuffer> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: {
      parts: [{ text: text }]
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Failed to generate audio");
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Decode base64 to buffer
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return await audioContext.decodeAudioData(bytes.buffer);
};

export const playAudioBuffer = (buffer: AudioBuffer) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start(0);
};
