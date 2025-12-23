import { WebSocketServer } from "ws";
import { gemma } from "../llm/gemma.js";
import { memoryVisualizer } from "../state/state.js";
import type { IMemory } from "../types/IMemory.js";

export let i = 0;
export const memory: IMemory[] = [];

async function payloadHandler(entity: string, payload: string) {
    memory.push({id: i, entity: entity, payload: payload});
    
}

export function initSocket(server: any) {
    const ws = new WebSocketServer({ server });
    ws.on('connection', (socket) => {
        console.log('Client connected.');

        socket.on('message', async (data) => {
            const user_message = data.toString();
            payloadHandler("USER", user_message);
            memoryVisualizer(i, memory);
            

            try {
                const reply: string = await gemma(user_message);
                socket.send(reply);
                payloadHandler("LLM", reply);
                memoryVisualizer(i, reply);
            } catch(err) {
                socket.send("Error generating the response.");
            }
        });

        socket.on('close', () => {
            i = -1;
            console.log(memory);
            console.log('Client Disconnected.');
        });
    });
}    