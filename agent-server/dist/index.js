import express from 'express';
import rootRouter from './routes/root.js';
import http from 'http';
import { WebSocketServer } from 'ws';
import { gemma } from './llm/gemma.js';
const app = express();
const server = http.createServer(app);
const ws = new WebSocketServer({ server });
ws.on('connection', (socket) => {
    console.log('Client connected.');
    socket.on('message', async (data) => {
        const user_message = data.toString();
        try {
            const reply = await gemma(user_message);
            socket.send(reply);
        }
        catch (err) {
            socket.send("Error generating the response.");
        }
    });
    socket.on('close', () => {
        console.log('Client Disconnexted.');
    });
});
app.use(express.json());
app.use('/api/', rootRouter);
server.listen(3000, () => { console.log('App is listening at PORT 3000.'); });
//# sourceMappingURL=index.js.map