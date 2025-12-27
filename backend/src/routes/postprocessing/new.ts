import express from 'express';
import axios from 'axios';
import zod from 'zod';
import { prisma } from '../../lib/prisma.js';
import { embed } from '../../functions/vector/embed.ts.js';
import { vec_client } from '../../functions/vector/vec-store.js';

const logs = zod.object({
        id: zod.number(),
        entity: zod.string(),
        payload: zod.string()
});

const router = express.Router();

const newDB = zod.object({
    category: zod.string(),
    useCase: zod.string(),
    qualities: zod.array(zod.string()),
    specs: zod.array(zod.string()),
    convRate: zod.number(),
    input_logs: zod.array(logs)
});

router.post('/add', async (req, res) => {
    try {
        const parsed = newDB.safeParse(req.body);
        if(!parsed.success) {
            const formattedErrors = parsed.error.issues.map(err => ({ path: err.path[0], msg: err.message }));
            return res.json({
                status: 403,
                msg: 'Invalid /add object.',
                error: formattedErrors
            });
        }
        const { category, useCase, qualities, specs, convRate } = req.body;

        const input_txt = `${useCase}`;
        const vector = await embed(input_txt);

        const exists = await prisma.kB.findUnique({
            where: {
                category_useCase: {
                category,
                useCase
                }
            }
        });

        if (exists) {
            return res.status(409).json({
                status: 409,
                msg: "DB entry already exists for this category and useCase"
            });
        }
        
        const kb = await prisma.kB.create({
                data: {
                    category: category,
                    useCase:   useCase,
                    qualities: qualities,
                    specs:     specs,
                    convRate:  convRate,
                }
        });

        const vec_res = await vec_client.upsert("kb_vector3", {
            points: [
                {
                    id: kb.id,
                    vector,
                    payload: {
                        category: kb.category,
                        use_case: kb.useCase
                    }
                }
            ]
        });

        return res.json({
            status: 200,
            msg: "Knowledge-base scenario is created.",
            knowledge: {
                id: kb.id,
                category: kb.category,
                useCase: kb.useCase,
                qualities: kb.qualities,
                specs: kb.specs,
                convRate: kb.convRate,
                qDrantRes: vec_res
            } 
        });
    } catch(err) {
        return res.json({
            status: 500,
            msg: "Internal Server Error."
        });
    }
    
});

export default router;