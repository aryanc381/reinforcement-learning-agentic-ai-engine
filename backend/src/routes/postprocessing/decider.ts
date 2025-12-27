import express from 'express';
import zod from 'zod';
import axios from 'axios';
import { prisma } from '../../lib/prisma.js';

const router = express.Router();

const input_logs = zod.object({
        id: zod.number(),
        entity: zod.string(),
        payload: zod.string()
});

const updateObj = zod.object({
    use_case: zod.number(),
    input_logs: zod.array(input_logs),
});

router.post('/decider', async (req, res) => {
    const parsed = updateObj.safeParse(req.body);
    if(!parsed.success) {
        const formattedErrors = parsed.error.issues.map(err => ({ path: err.path[0], msg: err.message }));
        return res.json({
            status: 403,
            msg: 'Invalid /add object.',
            error: formattedErrors
        });
    }

    const { use_case, input_logs } = req.body;
    const response = await axios.post('http://localhost:4000/v1/api/search/similarity', {
        input: use_case
    });

    
    const kb_id = response.data.match_kb_id;

    const existing_vec = await prisma.kB.findUnique({
        where: {
            id: kb_id
        },
        select: { qualities: true, specs: true, outliers: true }
    });

    const existing_qualities = existing_vec?.qualities || "No existing qualities, working on the base prompt.";
    const existing_specs = existing_vec?.specs || "No existing qualities, working on the base prompt.";
    const existing_outliers = existing_vec?.outliers || "No existing qualities, working on the base prompt.";
    const system_prompt = response.data.system_prompt || "No existing qualities, working on the base prompt.";
});