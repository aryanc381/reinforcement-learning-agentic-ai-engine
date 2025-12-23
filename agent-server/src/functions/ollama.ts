import { exec } from "node:child_process";

export async function callOllama(prompt: string) {
    return new Promise((resolve, reject) => {
        const proc = exec("ollama run phi3", (err, stdout) => {
            if(err) reject(err);
            else resolve(stdout.trim());
        });
        proc.stdin?.write(prompt);
        proc.stdin?.end();
    });
}