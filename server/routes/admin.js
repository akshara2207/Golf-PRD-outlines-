const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

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

router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, activeSubs, totalScores, totalCharities, pendingVerifications, totalPoolThisMonth] =
      await Promise.all([
        prisma.user.count(),
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.score.count(),
        prisma.charity.count({ where: { isActive: true } }),
        prisma.drawResult.count({
          where: { tier: 'TIER_1', verificationStatus: 'PENDING' },
        }),
        prisma.draw.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { totalPool: true },
        }),
      ]);

    const recentScores = await prisma.score.findMany({
      orderBy: { enteredAt: 'desc' },
      take: 10,
      include: { user: { select: { fullName: true } } },
    });

    res.json({
      stats: {
        totalUsers,
        activeSubs,
        totalScores,
        totalCharities,
        pendingVerifications,
        totalPoolAllTime: totalPoolThisMonth._sum.totalPool || 0,
      },
      recentScores,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch dashboard' });
  }
});

router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { subscription: true, charityPref: { include: { charity: true } } },
    });
    res.json(users.map(u => {
      const { password, ...rest } = u;
      return rest;
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.patch('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role, handicap, fullName } = req.body;
    const updateData = {};
    if (role) updateData.role = role;
    if (handicap !== undefined) updateData.handicap = parseFloat(handicap);
    if (fullName) updateData.fullName = fullName;

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: { subscription: true },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'UPDATE_USER',
        entityType: 'User',
        entityId: user.id,
        details: JSON.stringify(updateData),
      },
    });

    const { password, ...rest } = user;
    res.json(rest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

router.get('/scores', authenticate, requireAdmin, async (req, res) => {
  try {
    const scores = await prisma.score.findMany({
      orderBy: { enteredAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    res.json(scores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch scores' });
  }
});

router.delete('/scores/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const score = await prisma.score.delete({
      where: { id: parseInt(req.params.id) },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'DELETE_SCORE',
        entityType: 'Score',
        entityId: score.id,
        details: `Deleted score for user ${score.userId}`,
      },
    });

    res.json({ message: 'Score deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete score' });
  }
});

router.get('/draws', authenticate, requireAdmin, async (req, res) => {
  try {
    const draws = await prisma.draw.findMany({
      orderBy: { drawDate: 'desc' },
      include: {
        results: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
        },
      },
    });
    res.json(draws);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch draws' });
  }
});

router.post('/draws/:id/verify', authenticate, requireAdmin, async (req, res) => {
  try {
    const { resultId, status } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await prisma.drawResult.update({
      where: { id: parseInt(resultId) },
      data: {
        verificationStatus: status,
        payoutStatus: status === 'APPROVED' ? 'PENDING' : 'REJECTED',
      },
      include: { user: { select: { fullName: true, id: true } }, draw: true },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'VERIFY_WINNER',
        entityType: 'DrawResult',
        entityId: result.id,
        details: `Winner ${status}: ${result.user.fullName}`,
      },
    });

    if (status === 'APPROVED') {
      await createNotification(result.user.id, 'WINNER_VERIFIED', 'Winner Verified', `Your ${result.tier === 'TIER_1' ? '5-Number Match' : result.tier === 'TIER_2' ? '4-Number Match' : '3-Number Match'} win has been verified! Prize: £${result.prizeAmount.toFixed(2)}`);
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to verify winner' });
  }
});

router.patch('/draws/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const draw = await prisma.draw.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'UPDATE_DRAW',
        entityType: 'Draw',
        entityId: draw.id,
        details: `Draw status updated to ${status}`,
      },
    });

    if (status === 'PUBLISHED') {
      const eligibleUsers = await prisma.user.findMany({
        where: {
          scores: {
            some: {
              enteredAt: { gte: new Date(draw.drawDate.getFullYear(), draw.drawDate.getMonth(), 1), lt: new Date(draw.drawDate.getFullYear(), draw.drawDate.getMonth() + 1, 1) },
            },
          },
        },
      });
      for (const u of eligibleUsers) {
        await createNotification(u.id, 'DRAW_PUBLISHED', 'Draw Results Published', `Results for the ${draw.drawDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} draw are now available.`);
      }
    }

    res.json(draw);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update draw' });
  }
});

router.patch('/scores/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { stablefordPoints, courseName, playedDate } = req.body;
    const updateData = {};
    if (stablefordPoints !== undefined) updateData.stablefordPoints = parseInt(stablefordPoints);
    if (courseName) updateData.courseName = courseName;
    if (playedDate) updateData.playedDate = new Date(playedDate);

    const score = await prisma.score.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'UPDATE_SCORE',
        entityType: 'Score',
        entityId: score.id,
        details: `Updated score for user ${score.userId}`,
      },
    });

    res.json(score);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update score' });
  }
});

router.patch('/subscriptions/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, planType, currentPeriodEnd } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (planType) updateData.planType = planType;
    if (currentPeriodEnd) updateData.currentPeriodEnd = new Date(currentPeriodEnd);

    const sub = await prisma.subscription.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'UPDATE_SUBSCRIPTION',
        entityType: 'Subscription',
        entityId: sub.id,
        details: JSON.stringify(updateData),
      },
    });

    res.json(sub);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update subscription' });
  }
});

router.post('/charities', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, registrationNumber, description, logoUrl } = req.body;
    const charity = await prisma.charity.create({
      data: { name, registrationNumber, description, logoUrl, isVerified: true, isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'CREATE_CHARITY',
        entityType: 'Charity',
        entityId: charity.id,
        details: `Created charity: ${name}`,
      },
    });

    res.status(201).json(charity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create charity' });
  }
});

router.patch('/charities/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, registrationNumber, description, logoUrl, isActive, isVerified } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber;
    if (description !== undefined) updateData.description = description;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    const charity = await prisma.charity.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'UPDATE_CHARITY',
        entityType: 'Charity',
        entityId: charity.id,
        details: `Updated charity: ${name || charity.name}`,
      },
    });

    res.json(charity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update charity' });
  }
});

router.delete('/charities/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const charity = await prisma.charity.delete({
      where: { id: parseInt(req.params.id) },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'DELETE_CHARITY',
        entityType: 'Charity',
        entityId: charity.id,
        details: `Deleted charity: ${charity.name}`,
      },
    });

    res.json({ message: 'Charity deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete charity' });
  }
});

router.get('/winners', authenticate, requireAdmin, async (req, res) => {
  try {
    const results = await prisma.drawResult.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        draw: { select: { id: true, drawDate: true, totalPool: true } },
      },
    });
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch winners' });
  }
});

router.patch('/winners/:id/payout', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await prisma.drawResult.update({
      where: { id: parseInt(req.params.id) },
      data: { payoutStatus: 'COMPLETED' },
      include: { user: { select: { fullName: true } }, draw: true },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user.id,
        action: 'MARK_PAYOUT',
        entityType: 'DrawResult',
        entityId: result.id,
        details: `Payout marked completed for ${result.user.fullName}`,
      },
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to mark payout' });
  }
});

router.get('/reports', authenticate, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      newUsersThisMonth,
      activeSubs,
      totalScores,
      scoresThisMonth,
      totalPool,
      totalPrizesPaid,
      charityTotals,
      drawStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.score.count(),
      prisma.score.count({ where: { enteredAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      prisma.draw.aggregate({ _sum: { totalPool: true } }),
      prisma.drawResult.aggregate({ _sum: { prizeAmount: true } }),
      prisma.charity.findMany({ select: { name: true, totalDonations: true }, orderBy: { totalDonations: 'desc' } }),
      prisma.draw.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    res.json({
      users: { total: totalUsers, newThisMonth: newUsersThisMonth, activeSubs },
      scores: { total: totalScores, thisMonth: scoresThisMonth },
      financial: {
        totalPool: totalPool._sum.totalPool || 0,
        totalPrizesPaid: totalPrizesPaid._sum.prizeAmount || 0,
      },
      charities: charityTotals,
      draws: drawStats.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

router.get('/audit-logs', authenticate, requireAdmin, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { admin: { select: { fullName: true } } },
    });
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
