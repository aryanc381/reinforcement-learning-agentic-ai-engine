import express from 'express';
import zod from 'zod';
import axios from 'axios';
import { prisma } from '../../lib/prisma.js';

const router = express.Router();

const updateObj = zod.object({
    kb_id: zod.number(),
    qualities: zod.array(zod.string()),
    specs: zod.array(zod.string())
});

router.post('/update', async (req, res) => {
    const parsed = updateObj.safeParse(req.body);
    if(!parsed.success) {
        const formattedErrors = parsed.error.issues.map(err => ({ path: err.path[0], msg: err.message }));
        return res.json({
            status: 403,
            msg: 'Invalid /add object.',
            error: formattedErrors
        });
    }

    const { kb_id } = req.body;
    const existing_vec = await prisma.kB.findUnique({
        where: {
            id: kb_id
        },
        select: { qualities: true, specs: true }
    });
    const existing_qualities = existing_vec?.qualities;
    const existing_specs = existing_vec?.specs;
});