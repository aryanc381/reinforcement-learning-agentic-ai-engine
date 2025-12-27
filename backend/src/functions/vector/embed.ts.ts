import axios from 'axios';

export async function embed(text: string): Promise<number[]> {
    const res = await axios.post('http://localhost:8000/embed', {
        text: text
    });
    
    return res.data.embedding;
} 