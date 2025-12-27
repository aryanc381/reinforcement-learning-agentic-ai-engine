import express from 'express';
import zod from 'zod';
import axios from 'axios';
import { prisma } from '../../lib/prisma.js';

const router = express.Router();

/* -----------------------------
   Schemas
------------------------------ */
const inputLog = zod.object({
  id: zod.number(),
  entity: zod.string(),
  payload: zod.string()
});

const updateObj = zod.object({
  use_case: zod.string(),
  input_logs: zod.array(inputLog),
});

const normalizeUseCase = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, ' ');

/* -----------------------------
   Route
------------------------------ */
router.post('/decider', async (req, res) => {
  try {
    const parsed = updateObj.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        msg: 'Invalid /decider payload',
        errors: parsed.error.issues
      });
    }

    const { use_case, input_logs } = parsed.data;
    const normalizedUseCase = normalizeUseCase(use_case);

    const logs = input_logs.map(
      l => `${l.entity.toUpperCase()}: ${l.payload}`
    );

    /* =========================================================
       1. Fetch KB (by canonical useCase)
    ========================================================= */
    let kb = await prisma.kB.findFirst({
      where: { useCase: normalizedUseCase }
    });

    /* =========================================================
       2. BOOTSTRAP — unseen use case
    ========================================================= */
    if (!kb) {
      const bootstrap = await axios.post(
        'http://localhost:8000/bootstrap',
        {
          description: normalizedUseCase,
          logs
        },
        { timeout: 20000 }
      );

      const meta = bootstrap.data;

      kb = await prisma.kB.create({
        data: {
          category: meta.category,
          useCase: normalizedUseCase,
          qualities: meta.qualities ?? [],
          specs: meta.specs ?? [],
          outliers: meta.outliers ?? [],
          convRate: meta.convRate ?? 0
        }
      });

      return res.json({
        decision: 'bootstrap',
        reason: 'use_case_not_seen_before',
        kb_id: kb.id,
        category: kb.category,
        useCase: kb.useCase,
        kb_created: kb
      });
    }

    /* =========================================================
       3. Similarity Prompt (non-critical)
    ========================================================= */
    let system_prompt = 'You are a helpful debt collection agent.';
    try {
      const sim = await axios.post(
        'http://localhost:4000/v1/api/search/similarity',
        { input: normalizedUseCase }
      );
      system_prompt = sim.data.system_prompt ?? system_prompt;
    } catch {
      // similarity failure is non-fatal
    }

    /* =========================================================
       4. Evaluate
    ========================================================= */
    const evalRes = await axios.post(
      'http://localhost:8000/evaluate',
      {
        prompt: system_prompt,
        qualities: kb.qualities,
        specs: kb.specs,
        outliers: kb.outliers,
        logs
      },
      { timeout: 20000 }
    );

    const { conversation_quality, goal_completion, compliance } =
      evalRes.data.scores;

    const theta = 0.65;
    const score =
      0.2 * conversation_quality +
      0.5 * goal_completion +
      0.3 * compliance;

    const decision = score <= theta ? 'update_kb' : 'retain';

    /* =========================================================
       5. UPDATE PATH — archive + promote
    ========================================================= */
    let updatedState = {
      qualities: kb.qualities,
      specs: kb.specs,
      outliers: kb.outliers,
      convRate: kb.convRate
    };

    let additions = null;

    if (decision === 'update_kb') {
      const mergeUnique = (a: string[], b: string[]) =>
        Array.from(new Set([...a, ...b]));

      additions = evalRes.data.recommendations;

      const nextState = {
        qualities: mergeUnique(kb.qualities, additions.add_qualities),
        specs: mergeUnique(kb.specs, additions.add_specs),
        outliers: mergeUnique(kb.outliers, additions.add_outliers),
        convRate: Math.max(kb.convRate, score)
      };

      /* -----------------------------
         ARCHIVE OLD KB
      ------------------------------ */
      await prisma.lB_Archive.create({
        data: {
          parentId: kb.id,
          category: kb.category,
          useCase: kb.useCase,
          qualities: kb.qualities,
          specs: kb.specs,
          outliers: kb.outliers,
          convRate: kb.convRate,
          rationale: `Auto-updated due to low performance score (${score.toFixed(2)} ≤ ${theta})`
        }
      });

      /* -----------------------------
         UPDATE PRIMARY KB
      ------------------------------ */
      await prisma.kB.update({
        where: { id: kb.id },
        data: nextState
      });

      updatedState = nextState;
    }

    /* =========================================================
       6. Respond
    ========================================================= */
    return res.json({
      kb_id: kb.id,
      category: kb.category,
      useCase: kb.useCase,

      decision,
      score,
      threshold: theta,
      scores: evalRes.data.scores,

      kb_state: {
        before: {
          qualities: kb.qualities,
          specs: kb.specs,
          outliers: kb.outliers,
          convRate: kb.convRate
        },
        after: updatedState
      },

      applied_changes: additions
    });

  } catch (err) {
    console.error('DECIDER ERROR:', err);
    return res.status(500).json({
      msg: 'Internal decider error'
    });
  }
});

export default router;
