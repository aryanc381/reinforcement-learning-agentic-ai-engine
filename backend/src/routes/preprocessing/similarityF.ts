import express from 'express';
import zod from 'zod';
import { embed } from '../../functions/vector/embed.ts.js';
import { vec_client } from '../../functions/vector/vec-store.js';
import { prisma } from '../../lib/prisma.js';

const router = express.Router();

const inputContext = zod.object({
    input: zod.string()
});



router.post('/similarityF', async (req, res) => {
    const parsed = inputContext.safeParse(req.body);
    if(!parsed.success) {
        const formattedErrors = parsed.error.issues.map(err => ({ path: err.path[0], msg: err.message }));
        return res.json({
            status: 403,
            msg: 'Invalid /similarity object.',
            error: formattedErrors
        });
    }

    const { input } = req.body;

    const BASE_PROMPT = `You are a debt collecting assistant, you are calling for collecting debt based on the context ${input}.`
    
    const vector = await embed(input);
    const search = await vec_client.search("kb_vector3", {
        vector,
        limit: 1,
        with_payload: true
    });

    if(search.length === 0) {
        return res.json({
            status: 201,
            theta: 0,
            system_prompt: BASE_PROMPT.trim()
        });
    }

    const topMatch = search[0];
    const theta = topMatch?.score;

    const kb = await prisma.kB.findUnique({
        where: { id: Number(topMatch?.id) }
    });

    if(!kb) {
        return res.json({
            status: 404,
            theta: theta,
            system_prompt: BASE_PROMPT.trim(),
            msg: 'User not found in Postgres-DB.'
        });
    }

    let modified_prompt = BASE_PROMPT;
    if(theta! >= 0.85) {
        modified_prompt += `QUALITIES: ${kb.qualities.join(", ")} | SPECIFICATIONS: ${kb.specs.join(", ")}`
    } else if (theta! >= 0.25) {
        modified_prompt += `QUALITIES: ${kb.qualities.join(", ")}`
    }

    return res.json({
        status: 200,
        match_kb_id: kb.id,
        similarity: theta! * 100,
        system_prompt: modified_prompt.trim()
    });

});


export default router;