import { WebSocketServer } from "ws";
import type { IMemory } from "../types/IMemory.js";
import { Meta_Agent } from "../agents/meta.js";
import Main_Agent from "../agents/main.js";

let STM: IMemory[] = [];
let LTM: String = "";

let i: number = 0;

async function stm_mem_updater(entity: string, message: string) {
    if(STM.length > 7) {
        STM = [];
    } else {
        STM.push({id: i, entity:entity, payload:message});
        i++;
    }
}

export function initSocket(server: any) {
    const ws = new WebSocketServer({ server });
    ws.on('connection', (socket) => {
        console.log('Client connected.');

        socket.on('message', async(data) => {
            const user_message = data.toString();
            stm_mem_updater("USER", user_message);

            // try {
                const preprocessing = await Meta_Agent(LTM, STM);
                const response_meta = JSON.parse(preprocessing as string);
                console.log(response_meta);
                
                LTM = response_meta.summarized_LTM;
                let account_context = "The person aryan could not repay teh debt because he bought a new house." ;
                let tone: string = response_meta.inferred_runtime.tone;
                let assertiveness: number = response_meta.inferred_runtime.assertiveness;
                let strategy: string = response_meta.inferred_runtime.strategy;
                let risk_level: string = response_meta.inferred_runtime.risk_level;
                let conversation_stage: string = response_meta.inferred_runtime.conversation_stage

                const respone_final = await Main_Agent(LTM, STM, user_message, tone, assertiveness, strategy, risk_level, conversation_stage, account_context);

                socket.send(respone_final);
                stm_mem_updater("LLM", respone_final);

            // } catch(err) {
            //     socket.send("Error generating this response.")
            // }
        });
    });
}