import type { IMemory } from "../types/IMemory.js";

export async function memoryVisualizer(i: number, memory: IMemory[]) {
    console.log("This has been added to the memory: " + memory[i]?.payload);
}