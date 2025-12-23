import { WebSocketServer } from "ws";
import { server } from '../index.js';
import { gemma } from "../llm/gemma.js";

const ws = new WebSocketServer({ server });

ws.on('connection', (socket) => {
    console.log('Client connected.');

    socket.on('message', async (data) => {
        const user_message = data.toString();

        try {
            const reply: string = await gemma(user_message);
            socket.send(reply);
        } catch(err) {
            socket.send("Error generating the response.");
        }
    });

    socket.on('close', () => {
        console.log('Client Disconnected.');
    });
});