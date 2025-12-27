export async function fetchSystemPrompt(inputContext: string): Promise<string>{
    console.log(`
        <#================================#>
          RUNNING COSINE SIMILARITY SEARCH
        <#================================#>
    `)
    const response = await fetch('http://localhost:4000/v1/api/search/similarityF', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputContext})
    });
    const data = await response.json();
    console.log(`
        <#======================================================#>
                        SIMILARITY SEARCH RESULST

        Matching kb_id: ${data.match_kb_id}
        Similarity (kb_id): ${data.similarity}%

        SYSTEM PROMPT: ${data.system_prompt}
    `)
    return data.system_prompt;
}
