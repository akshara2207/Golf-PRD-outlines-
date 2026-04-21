const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const charities = await prisma.charity.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(charities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch charities' });
  }
});

router.get('/my-charity', authenticate, async (req, res) => {
  try {
    const pref = await prisma.userCharityPreference.findUnique({
      where: { userId: req.user.id },
      include: { charity: true },
    });
    res.json(pref);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch charity preference' });
  }
});

router.post(
  '/select',
  authenticate,
  [body('charityId').isInt(), body('contributionPercentage').optional().isFloat({ min: 10, max: 50 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const charity = await prisma.charity.findUnique({
        where: { id: parseInt(req.body.charityId) },
      });
      if (!charity || !charity.isActive) {
        return res.status(400).json({ message: 'Invalid charity' });
      }

      const pref = await prisma.userCharityPreference.upsert({
        where: { userId: req.user.id },
        update: {
          charityId: parseInt(req.body.charityId),
          ...(req.body.contributionPercentage && {
            contributionPercentage: parseFloat(req.body.contributionPercentage),
          }),
        },
        create: {
          userId: req.user.id,
          charityId: parseInt(req.body.charityId),
          contributionPercentage: req.body.contributionPercentage
            ? parseFloat(req.body.contributionPercentage)
            : 10,
        },
        include: { charity: true },
      });

      res.json(pref);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update charity preference' });
    }
  }
);

router.post('/donate', authenticate, async (req, res) => {
  try {
    const { charityId, amount, message } = req.body;
    const charity = await prisma.charity.findUnique({
      where: { id: parseInt(charityId) },
    });
    if (!charity || !charity.isActive) {
      return res.status(400).json({ message: 'Invalid charity' });
    }

    await prisma.charity.update({
      where: { id: parseInt(charityId) },
      data: { totalDonations: { increment: parseFloat(amount) || 0 } },
    });

    res.json({ message: 'Donation recorded. Thank you!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to process donation' });
  }
});

module.exports = router;
