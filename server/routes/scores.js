const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireSubscription } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post(
  '/',
  authenticate,
  requireSubscription,
  [
    body('courseName').trim().notEmpty(),
    body('stablefordPoints').isInt({ min: 1, max: 45 }),
    body('playedDate').isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user.id;
      const points = parseInt(req.body.stablefordPoints);
      const playedDate = new Date(req.body.playedDate);
      const dateStart = new Date(playedDate.getFullYear(), playedDate.getMonth(), playedDate.getDate());
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 1);

      const duplicate = await prisma.score.findFirst({
        where: {
          userId,
          playedDate: { gte: dateStart, lt: dateEnd },
        },
      });

      if (duplicate) {
        return res.status(400).json({ message: 'A score for this date already exists. Edit or delete the existing entry.' });
      }

      const existingScores = await prisma.score.findMany({
        where: { userId },
        orderBy: { enteredAt: 'asc' },
      });

      if (existingScores.length >= 5) {
        const oldest = existingScores[0];
        await prisma.score.delete({ where: { id: oldest.id } });
      }

      const score = await prisma.score.create({
        data: {
          userId,
          courseName: req.body.courseName,
          stablefordPoints: points,
          playedDate,
        },
      });
      res.status(201).json(score);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to save score' });
    }
  }
);

router.get('/my-scores', authenticate, async (req, res) => {
  try {
    const scores = await prisma.score.findMany({
      where: { userId: req.user.id },
      orderBy: { enteredAt: 'desc' },
    });
    res.json(scores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch scores' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const scoreId = parseInt(req.params.id);
    const score = await prisma.score.findUnique({ where: { id: scoreId } });
    if (!score) return res.status(404).json({ message: 'Score not found' });
    if (score.userId !== req.user.id) return res.status(403).json({ message: 'Not your score' });

    const { courseName, stablefordPoints, playedDate } = req.body;
    const updateData = {};
    if (courseName !== undefined) updateData.courseName = courseName;
    if (stablefordPoints !== undefined) {
      const points = parseInt(stablefordPoints);
      if (points < 1 || points > 45) return res.status(400).json({ message: 'Score must be 1-45' });
      updateData.stablefordPoints = points;
    }
    if (playedDate !== undefined) updateData.playedDate = new Date(playedDate);

    const updated = await prisma.score.update({
      where: { id: scoreId },
      data: updateData,
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update score' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const scores = await prisma.score.findMany({
      where: {
        enteredAt: { gte: startOfMonth, lt: endOfMonth },
      },
      orderBy: [{ stablefordPoints: 'desc' }, { enteredAt: 'asc' }],
      take: 50,
      include: { user: { select: { id: true, fullName: true, handicap: true } } },
    });

    const leaderboard = scores.map((s, index) => ({
      rank: index + 1,
      userId: s.user.id,
      fullName: s.user.fullName,
      handicap: s.user.handicap,
      courseName: s.courseName,
      stablefordPoints: s.stablefordPoints,
      playedDate: s.playedDate,
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
