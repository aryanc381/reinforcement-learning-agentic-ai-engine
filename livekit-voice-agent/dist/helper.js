async function fetchSystemPrompt(inputContext) {
    const response = await fetch('http://localhost:4000/v1/api/search/similarity', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputContext })
    });
    const data = await response.json();
    console.log(data.system_prompt);
    return data.system_prompt;
}
const resp = await fetchSystemPrompt("Child Marriage");
export {};
//# sourceMappingURL=helper.js.map