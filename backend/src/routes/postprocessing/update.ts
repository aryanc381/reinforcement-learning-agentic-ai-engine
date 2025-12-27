import express from 'express';
import zod from 'zod';
import { prisma } from '../../lib/prisma.js';

const router = express.Router();

const updateObj = zod.object({
  kb_id: zod.number(),
  qualities: zod.array(zod.string()),
  specs: zod.array(zod.string()),
  outliers: zod.array(zod.string()).optional(),
  convRate: zod.number().optional(),
  rationale: zod.string()
});

router.post('/update', async (req, res) => {
  const parsed = updateObj.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      msg: 'Invalid /update payload',
      errors: parsed.error.issues
    });
  }

  const {
    kb_id,
    qualities,
    specs,
    outliers,
    convRate,
    rationale
  } = parsed.data;

  /* -----------------------------
     1. Fetch existing KB
  ------------------------------ */
  const existing = await prisma.kB.findUnique({
    where: { id: kb_id }
  });

  if (!existing) {
    return res.status(404).json({ msg: 'KB not found' });
  }

  /* -----------------------------
     2. Detect change
  ------------------------------ */
  const hasChanged =
    JSON.stringify(existing.qualities) !== JSON.stringify(qualities) ||
    JSON.stringify(existing.specs) !== JSON.stringify(specs) ||
    (outliers &&
      JSON.stringify(existing.outliers) !== JSON.stringify(outliers)) ||
    (convRate !== undefined && existing.convRate !== convRate);

  if (!hasChanged) {
    return res.json({
      decision: 'no_change',
      kb_id,
      current_state: existing
    });
  }

  /* -----------------------------
     3. Transaction (ARCHIVE → UPDATE)
  ------------------------------ */
  const result = await prisma.$transaction(async (tx) => {
    const archive = await tx.lB_Archive.create({
      data: {
        parentId: existing.id,
        category: existing.category,
        useCase: existing.useCase,
        qualities: existing.qualities,
        specs: existing.specs,
        outliers: existing.outliers,
        convRate: existing.convRate,
        rationale
      }
    });

    const updated = await tx.kB.update({
      where: { id: existing.id },
      data: {
        qualities,
        specs,
        outliers: outliers ?? existing.outliers,
        convRate: convRate ?? existing.convRate
      }
    });

    return { archive, updated };
  });

  /* -----------------------------
     4. Respond
  ------------------------------ */
  return res.json({
    decision: 'updated',
    kb_id,
    rationale,
    archived_snapshot: result.archive,
    updated_primary: result.updated
  });
});

export default router;
