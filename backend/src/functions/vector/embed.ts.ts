import axios from 'axios';

export async function embed(text: string): Promise<number[]> {
    const res = await axios.post('http://localhost:9000/embed', {
        text: text
    });
    
    return res.data.embedding;
} 