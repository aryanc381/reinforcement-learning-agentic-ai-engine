import type { ISTM } from "../types/ISTM.js";

export async function buildSTM(LOGS: ISTM[], windowSize = 6) {
    return LOGS.slice(-windowSize);
}