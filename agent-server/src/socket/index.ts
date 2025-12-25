import { WebSocketServer } from "ws";
import { callLLM } from "../functions/llm.js";
import type { ISTM } from "../types/ISTM.js";
import { LOG_Handler } from "../functions/logs.js";
import { buildSTM } from "../functions/stm.js";
import { buildLTM } from "../functions/ltm.js";

export function initSocket(server: any) {
    const ws = new WebSocketServer({ server });
    ws.on('connection', (socket) => {

        const LOGS: ISTM[] = [];
        
        let STM: ISTM[] = [];
        let i = 0;

        let LTM: string = "";
        let ltmInProgress: boolean = false;
        let pending_STM: ISTM[] | null = null;

        let context = "The owner could not pay debt because he had a house wedding."

        async function triggerLTMBuild() {
            pending_STM = STM.slice();

            if(ltmInProgress) return;
            ltmInProgress = true;
            
            (async function run() {
                while(pending_STM) {
                    const stmSnapShot = pending_STM;
                    pending_STM = null;

                    try {
                        LTM = await buildLTM(LTM, stmSnapShot);
                        console.log("LTM Updated: " +LTM);
                    } catch(err) {
                        console.error("LTM Update failed: ", err);
                    }
                }
                ltmInProgress = false;
            })();
        }

        socket.on('message', async(data) => {

            const user_message = data.toString();
            LOG_Handler(LOGS, i++, "user", user_message);
            
            const reply = await callLLM(context, user_message, LTM, STM);    
            LOG_Handler(LOGS, i++, "agent", reply);
            
            if(i % 6 === 0) {
                STM = await buildSTM(LOGS);
                console.log(STM);
            }

            if(LOGS.length % 12 === 0) {
                triggerLTMBuild();
                console.log(LTM);
            }
            
            socket.send(reply);
        });

        socket.on('close', async(data) => {
            console.log('User left.')
        })
    });

}