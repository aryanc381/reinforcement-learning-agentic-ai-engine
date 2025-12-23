import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();
const ai = new GoogleGenAI({apiKey: `${process.env.GEMINI_API}`});


async function formatMemory(memory: any) {
    return JSON.stringify(memory, null, 2)
}
export default async function prompt_updater(LTM: any, STM: any, question:string) {
    const prompt = `
        You are an AI agent with two distinct memory systems:

        1. Long-Term Memory (LTM)
        2. Short-Term Memory (STM)


        LONG-TERM MEMORY:
        ${await formatMemory(LTM)}

        SHORT-TERM MEMORY:
        
        ${await formatMemory(STM)}

        When responding:
        - Use STM to guide tone, urgency, and immediate intent.
        - Use LTM to guide strategy, personalization, and consistency.
        - Adapt naturally without mentioning “memory systems” unless asked.

        You do not invent memories. You only use what is explicitly provided.Answer the following while keeping the Long-Term Memory and the Short-Term Memory in mind, if they are related, asnwer relevantly : ${question}.`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
    });
    console.log(prompt);
    return response.text ?? "No Response";
}