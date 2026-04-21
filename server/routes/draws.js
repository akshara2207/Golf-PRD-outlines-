const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

function getMonthBounds(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

router.get('/', async (req, res) => {
  try {
    const draws = await prisma.draw.findMany({
      orderBy: { drawDate: 'desc' },
      include: {
        results: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
    });
    res.json(draws);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch draws' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const draw = await prisma.draw.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        results: {
          include: { user: { select: { id: true, fullName: true } } },
          orderBy: { tier: 'asc' },
        },
      },
    });
    if (!draw) return res.status(404).json({ message: 'Draw not found' });
    res.json(draw);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch draw' });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { drawDate, totalPool, drawLogic } = req.body;
    const basePool = parseFloat(totalPool) || 0;

    const completedDrawsWithNoTier1 = await prisma.draw.findMany({
      where: { status: 'COMPLETED' },
      include: { results: true },
      orderBy: { drawDate: 'desc' },
    });

    let rolledOver = 0;
    for (const d of completedDrawsWithNoTier1) {
      const hasTier1 = d.results.some((r) => r.tier === 'TIER_1');
      if (!hasTier1) {
        rolledOver += d.tier1Pool;
      } else {
        break;
      }
    }

    const totalPoolWithRollover = basePool + rolledOver;

    const draw = await prisma.draw.create({
      data: {
        drawDate: new Date(drawDate),
        totalPool: totalPoolWithRollover,
        tier1Pool: totalPoolWithRollover * 0.4,
        tier2Pool: totalPoolWithRollover * 0.35,
        tier3Pool: totalPoolWithRollover * 0.25,
        rolledOverJackpot: rolledOver,
        drawLogic: drawLogic || 'RANDOM',
        status: 'PENDING',
      },
    });
    res.status(201).json(draw);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create draw' });
  }
});

router.post('/:id/run', authenticate, requireAdmin, async (req, res) => {
  try {
    const drawId = parseInt(req.params.id);
    const draw = await prisma.draw.findUnique({
      where: { id: drawId },
      include: { results: true },
    });

    if (!draw) return res.status(404).json({ message: 'Draw not found' });
    if (draw.status === 'COMPLETED') return res.status(400).json({ message: 'Draw already completed' });

    const { start, end } = getMonthBounds(draw.drawDate);
    const eligibleUsers = await prisma.user.findMany({
      where: {
        scores: {
          some: {
            enteredAt: { gte: start, lt: end },
          },
        },
      },
      include: { scores: { where: { enteredAt: { gte: start, lt: end } } } },
    });

    if (eligibleUsers.length === 0) {
      await prisma.draw.update({
        where: { id: drawId },
        data: { status: 'COMPLETED', randomSeed: 'no-eligible-users' },
      });
      return res.json({ message: 'Draw completed with no eligible users', draw: await prisma.draw.findUnique({ where: { id: drawId } }) });
    }

    const seed = crypto.randomBytes(32).toString('hex');
    const seedHash = crypto.createHash('sha256').update(seed).digest('hex');

    function seededRandom(seedStr) {
      let hash = crypto.createHash('sha256').update(seedStr).digest('hex');
      let idx = 0;
      return () => {
        if (idx + 8 > hash.length) {
          hash = crypto.createHash('sha256').update(hash).digest('hex');
          idx = 0;
        }
        const val = parseInt(hash.slice(idx, idx + 8), 16) / 0xffffffff;
        idx += 8;
        return val;
      };
    }

    const rand = seededRandom(seed);

    let shuffled;
    if (draw.drawLogic === 'ALGORITHMIC') {
      const weighted = eligibleUsers.map((u) => {
        const frequency = u.scores.length;
        return { user: u, weight: Math.max(frequency, 1) };
      });
      const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
      shuffled = [];
      const pool = [...weighted];
      while (pool.length > 0) {
        let point = rand() * totalWeight;
        let found = false;
        for (let i = 0; i < pool.length; i++) {
          point -= pool[i].weight;
          if (point <= 0) {
            shuffled.push(pool[i].user);
            pool.splice(i, 1);
            found = true;
            break;
          }
        }
        if (!found) {
          shuffled.push(pool.pop().user);
        }
      }
    } else {
      shuffled = [...eligibleUsers].sort(() => rand() - 0.5);
    }

    const tiers = [
      { tier: 'TIER_1', pool: draw.tier1Pool, count: 1 },
      { tier: 'TIER_2', pool: draw.tier2Pool, count: Math.min(3, shuffled.length) },
      { tier: 'TIER_3', pool: draw.tier3Pool, count: Math.min(5, shuffled.length) },
    ];

    let userIdx = 0;
    const results = [];

    for (const t of tiers) {
      if (userIdx >= shuffled.length) break;
      const winners = shuffled.slice(userIdx, userIdx + t.count);
      const prizePerWinner = winners.length > 0 ? parseFloat((t.pool / winners.length).toFixed(2)) : 0;
      for (const w of winners) {
        results.push({
          drawId,
          userId: w.id,
          tier: t.tier,
          prizeAmount: prizePerWinner,
          verificationStatus: t.tier === 'TIER_1' ? 'PENDING' : 'APPROVED',
          payoutStatus: 'PENDING',
        });
      }
      userIdx += t.count;
    }

    await prisma.drawResult.createMany({ data: results });
    await prisma.draw.update({
      where: { id: drawId },
      data: { status: 'COMPLETED', randomSeed: seedHash },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'RUN_DRAW',
        entityType: 'Draw',
        entityId: drawId,
        details: `Draw run with ${eligibleUsers.length} eligible users, seed hash: ${seedHash}`,
      },
    });

    const updatedDraw = await prisma.draw.findUnique({
      where: { id: drawId },
      include: {
        results: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
    });

    res.json({ message: 'Draw completed successfully', draw: updatedDraw });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to run draw' });
  }
});

router.post('/simulate', authenticate, requireAdmin, async (req, res) => {
  try {
    const { drawDate, totalPool, simulations = 100, drawLogic = 'RANDOM' } = req.body;
    const pool = parseFloat(totalPool) || 1000;
    const { start, end } = getMonthBounds(new Date(drawDate));

    const eligibleUsers = await prisma.user.findMany({
      where: {
        scores: {
          some: {
            enteredAt: { gte: start, lt: end },
          },
        },
      },
      include: { scores: { where: { enteredAt: { gte: start, lt: end } } } },
    });

    if (eligibleUsers.length === 0) {
      return res.json({ message: 'No eligible users for simulation', stats: null });
    }

    const winCounts = {};
    for (const u of eligibleUsers) winCounts[u.id] = 0;

    for (let i = 0; i < simulations; i++) {
      const seed = crypto.randomBytes(32).toString('hex');
      function seededRandom(seedStr) {
        let hash = crypto.createHash('sha256').update(seedStr).digest('hex');
        let idx = 0;
        return () => {
          if (idx + 8 > hash.length) {
            hash = crypto.createHash('sha256').update(hash).digest('hex');
            idx = 0;
          }
          return parseInt(hash.slice(idx, idx + 8), 16) / 0xffffffff;
        };
      }
      const rand = seededRandom(seed);

      let shuffled;
      if (drawLogic === 'ALGORITHMIC') {
        const weighted = eligibleUsers.map((u) => {
          const frequency = u.scores.length;
          return { user: u, weight: Math.max(frequency, 1) };
        });
        const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
        shuffled = [];
        const poolArr = [...weighted];
        while (poolArr.length > 0) {
          let point = rand() * totalWeight;
          let found = false;
          for (let k = 0; k < poolArr.length; k++) {
            point -= poolArr[k].weight;
            if (point <= 0) {
              shuffled.push(poolArr[k].user);
              poolArr.splice(k, 1);
              found = true;
              break;
            }
          }
          if (!found) shuffled.push(poolArr.pop().user);
        }
      } else {
        shuffled = [...eligibleUsers].sort(() => rand() - 0.5);
      }

      const totalWinners = Math.min(9, shuffled.length);
      for (let j = 0; j < totalWinners; j++) {
        winCounts[shuffled[j].id]++;
      }
    }

    const stats = Object.entries(winCounts)
      .map(([userId, wins]) => ({
        userId: parseInt(userId),
        winRate: ((wins / simulations) * 100).toFixed(2) + '%',
        wins,
      }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10);

    res.json({ simulations, eligibleUsers: eligibleUsers.length, stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Simulation failed' });
  }
});

router.patch('/results/:id/proof', authenticate, async (req, res) => {
  try {
    const resultId = parseInt(req.params.id);
    const { proofUrl, proofDescription } = req.body;

    const result = await prisma.drawResult.findUnique({
      where: { id: resultId },
      include: { draw: true },
    });

    if (!result) return res.status(404).json({ message: 'Result not found' });
    if (result.userId !== req.user.id) return res.status(403).json({ message: 'Not your result' });
    if (result.tier !== 'TIER_1') return res.status(400).json({ message: 'Proof only required for jackpot winners' });

    const updated = await prisma.drawResult.update({
      where: { id: resultId },
      data: {
        proofUrl: proofUrl || null,
        proofDescription: proofDescription || null,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to upload proof' });
  }
});

module.exports = router;
