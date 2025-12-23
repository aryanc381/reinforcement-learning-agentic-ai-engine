import { WebSocketServer } from "ws";
import { gemma } from "../llm/gemma.js";
import type { IMemory } from "../types/IMemory.js";
import prompt_updater from "../state/sys.js";

export let i = 0;
export const LTM: IMemory[] = [];
const STM: IMemory[] = [];

async function payloadHandler(entity: string, payload: string) {
    const length = LTM.length;
    LTM.push({id: i, entity: entity, payload: payload});
    if(LTM[i]?.id! / 3 == 0) {
        for(let j = 6; j > 0; j--) {
            STM.push(LTM[length - j - 1] as IMemory)
        }  
    }
    i++;
}

export function initSocket(server: any) {
    const ws = new WebSocketServer({ server });
    ws.on('connection', (socket) => {
        console.log('Client connected.');

        socket.on('message', async (data) => {
            const user_message = data.toString();
            payloadHandler("USER", user_message);
            // try {
                const reply: string = await prompt_updater(LTM, STM, user_message);
                socket.send(reply);
                payloadHandler("LLM", reply);
            // } catch(err) {
            //     socket.send("Error generating the response.");
            // }
        });

        socket.on('close', () => {
            i = -1;
            console.log(LTM);
            console.log('Client Disconnected.');
        });
    });
}    