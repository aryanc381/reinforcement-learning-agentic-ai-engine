import type { ISTM } from "../types/ISTM.js";

export async function LOG_Handler(STM: ISTM[], id: number, entity: any, payload: string) {
    return STM.push({id: id, entity: entity, payload: payload});
}