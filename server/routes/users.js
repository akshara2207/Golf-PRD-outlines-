const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

async function createNotification(userId, type, title, message) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message },
    });
  } catch (e) {
    console.error('Notification creation failed', e);
  }
}

router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { id: parseInt(req.params.id), userId: req.user.id },
      data: { read: true },
    });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        subscription: true,
        charityPref: { include: { charity: true } },
        scores: { orderBy: { enteredAt: 'desc' }, take: 5 },
        drawResults: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { draw: true },
        },
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

router.patch(
  '/me',
  authenticate,
  [
    body('fullName').optional().trim().notEmpty(),
    body('handicap').optional().isFloat({ min: -10, max: 54 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updateData = {};
      if (req.body.fullName) updateData.fullName = req.body.fullName;
      if (req.body.handicap !== undefined) updateData.handicap = parseFloat(req.body.handicap);

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        include: { subscription: true, charityPref: { include: { charity: true } } },
      });

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  }
);

module.exports = router;
