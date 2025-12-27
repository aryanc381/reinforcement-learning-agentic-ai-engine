import {
  type JobContext,
  type JobProcess,
  WorkerOptions,
  cli,
  defineAgent,
  voice,
} from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { fetchSystemPrompt } from './helper.js';

dotenv.config({ path: '.env.local' });

export function captureAssistantSpeech(
  assistant: any,
  onText: (text: string) => void
) {
  const originalSay = assistant.say.bind(assistant);

  assistant.say = async (text: string, ...args: any[]) => {
    onText(text);
    return originalSay(text, ...args);
  };
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    const vad = ctx.proc.userData.vad! as silero.VAD;
    const system_prompt = await fetchSystemPrompt("I am playing video games and just ")
    
    const assistant = new voice.Agent({
	    instructions: system_prompt,
    });

    const session = new voice.AgentSession({
      vad,
      stt: "assemblyai/universal-streaming:en",
      llm: "openai/gpt-4.1-mini",
      tts: "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
      turnDetection: new livekit.turnDetector.MultilingualModel(),
    });


    await session.start({
      agent: assistant,
      room: ctx.room,
      record: true,
      inputOptions: {
        // For telephony applications, use `TelephonyBackgroundVoiceCancellation` for best results
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    await ctx.connect();

    const handle = session.generateReply({
      instructions: 'You are a debt collecting agent and your purpose is to find the best optimal way to collect debts with the context provided in the system prompt and you are angry, even the goodbye is angry. STRICTLY FOLLOW THE SYSTEM PROMPT AND THIS',
    });
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));