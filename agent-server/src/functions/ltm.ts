import axios from "axios";
import type { ISTM } from "../types/ISTM.js";

export async function buildLTM(LTM: string, STM: ISTM[]) {
    const prompt = `
        You are a MEMORY CONSOLIDATION AGENT.

        You are given:
        ==========================================
        1. Existing Long-Term Memory (LTM): 
        ${LTM}
        ==========================================

        ==========================================
        2. Recent Short-Term Memory (STM)
        ${STM.map(e => `${e.entity}: ${e.payload}`).join("\n")}
        ==========================================

        Your task:
        - Merge STM into LTM by updating, refining, or appending only IMPORTANT information.
        - Preserve relevant facts from the existing LTM.
        - Discard redundant, transient, or conversational details.
        - Summarize STM ONLY if it introduces durable knowledge, preferences, decisions, or patterns.

        Rules:
        - Do NOT invent new facts.
        - Do NOT include timestamps, commentary, or explanations.
        - Do NOT repeat STM verbatim.
        - Output MUST be a single concise STRING representing the updated Long-Term Memory.

        Focus on:
        - Stable user preferences
        - Long-term goals or constraints
        - Repeated behaviors or decisions
        - Facts that should persist across sessions

        Output format:
        - Plain text string only with the updated string of the long term memory, no extra information or comments from your side should be added.
        `;

        const res = await axios.post('http://localhost:3005/api/generate', {
            model: "qwen2.5:1.5b",
            prompt,
            stream: false
        });
        return res.data.response;
}