const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').trim().notEmpty(),
    body('handicap').isFloat({ min: -10, max: 54 }),
    body('charityId').isInt(),
    body('planType').isIn(['MONTHLY', 'YEARLY']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, handicap, charityId, planType } = req.body;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const charity = await prisma.charity.findUnique({ where: { id: charityId } });
      if (!charity || !charity.isActive) {
        return res.status(400).json({ message: 'Invalid charity selected' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          handicap: parseFloat(handicap),
          subscription: {
            create: {
              planType,
              status: 'ACTIVE',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + (planType === 'YEARLY' ? 365 : 30) * 24 * 60 * 60 * 1000),
            },
          },
          charityPref: {
            create: {
              charityId: parseInt(charityId),
              contributionPercentage: 10,
            },
          },
        },
        include: { subscription: true, charityPref: { include: { charity: true } } },
      });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          handicap: user.handicap,
          subscription: user.subscription,
          charity: user.charityPref?.charity,
          contributionPercentage: user.charityPref?.contributionPercentage,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { subscription: true, charityPref: { include: { charity: true } } },
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          handicap: user.handicap,
          subscription: user.subscription,
          charity: user.charityPref?.charity,
          contributionPercentage: user.charityPref?.contributionPercentage,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Login failed' });
    }
  }
);

module.exports = router;
