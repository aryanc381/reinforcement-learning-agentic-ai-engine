import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();
const ai = new GoogleGenAI({ apiKey: `${process.env.GEMINI_API}` });
export async function gemma(prompt) {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    return response.text ?? "No Response";
}
//# sourceMappingURL=gemma.js.map