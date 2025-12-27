import express from 'express';
import zod from 'zod';
import { embed } from '../../functions/vector/embed.ts.js';
import { vec_client } from '../../functions/vector/vec-store.js';
import { prisma } from '../../lib/prisma.js';

const router = express.Router();

const inputContext = zod.object({
    input: zod.string()
});

router.post('/similarity', async (req, res) => {
    const parsed = inputContext.safeParse(req.body);
    if (!parsed.success) {
        const formattedErrors = parsed.error.issues.map(err => ({
            path: err.path[0],
            msg: err.message
        }));
        return res.json({
            status: 403,
            msg: 'Invalid /similarity object.',
            error: formattedErrors
        });
    }

    const { input } = req.body;

    const BASE_PROMPT = `
You are a professional debt collection agent calling on behalf of Riverline Bank.

Base behavior:
- Maintain a calm, respectful, and professional tone at all times
- Clearly identify yourself and the purpose of the call
- Show empathy if the customer expresses distress or inability to pay
- Never threaten, intimidate, or use aggressive language
- Do not provide legal advice or discuss legal consequences unless explicitly permitted
- If the customer cannot pay immediately, offer to discuss available payment options
- Respect user privacy and comply with standard banking and debt collection regulations

Call context:
${input}
`.trim();

    const vector = await embed(input);

    const search = await vec_client.search("kb_vector3", {
        vector,
        limit: 1,
        with_payload: true
    });

    if (search.length === 0) {
        return res.json({
            status: 201,
            theta: 0,
            match_kb_id: null,
            system_prompt: BASE_PROMPT
        });
    }

    const topMatch = search[0];
    const theta = topMatch?.score ?? 0;

    /* -----------------------------
       BELOW CONFIDENCE THRESHOLD
       → Treat as unseen use-case
    ------------------------------ */
    if (theta < 0.35) {
        return res.json({
            status: 200,
            theta: theta,
            match_kb_id: null,
            system_prompt: BASE_PROMPT
        });
    }

    const kb = await prisma.kB.findUnique({
        where: { id: Number(topMatch?.id) }
    });

    if (!kb) {
        return res.json({
            status: 404,
            theta: theta,
            match_kb_id: null,
            system_prompt: BASE_PROMPT,
            msg: 'KB entry not found in Postgres.'
        });
    }

    let modified_prompt = BASE_PROMPT;

    if (theta >= 0.85) {
        modified_prompt += `
QUALITIES:
${kb.qualities.join(", ")}

SPECIFICATIONS:
${kb.specs.join(", ")}
`.trim();
    } else if (theta >= 0.35) {
        modified_prompt += `
QUALITIES:
${kb.qualities.join(", ")}
`.trim();
    }

    return res.json({
        status: 200,
        match_kb_id: kb.id,
        similarity: theta * 100,
        system_prompt: modified_prompt
    });
});

export default router;
