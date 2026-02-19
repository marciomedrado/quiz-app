const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middlewares/auth');
const { addCredits, subtractCredits } = require('../services/creditService');
const { z } = require('zod');

// Search users
router.get('/users/search', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: q, mode: 'insensitive' } },
                    { id: { contains: q } }
                ]
            },
            include: {
                subscription: true
            },
            take: 10
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add credits
router.post('/credits/add', requireAuth, requireAdmin, async (req, res) => {
    const schema = z.object({
        identifier: z.string(),
        amount: z.number().int().positive(),
        reason: z.string()
    });

    try {
        const { identifier, amount, reason } = schema.parse(req.body);
        const updatedUser = await addCredits(identifier, amount, `Admin (${req.user.email}): ${reason}`);
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Subtract credits
router.post('/credits/subtract', requireAuth, requireAdmin, async (req, res) => {
    const schema = z.object({
        identifier: z.string(),
        amount: z.number().int().positive(),
        reason: z.string()
    });

    try {
        const { identifier, amount, reason } = schema.parse(req.body);
        const updatedUser = await subtractCredits(identifier, amount, `Admin (${req.user.email}): ${reason}`);
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Change role (Super Admin only)
router.post('/users/role', requireAuth, requireSuperAdmin, async (req, res) => {
    const schema = z.object({
        identifier: z.string(),
        role: z.enum(['USER', 'ADMIN', 'SUPERADMIN'])
    });

    try {
        const { identifier, role } = schema.parse(req.body);
        const where = identifier.includes('@') ? { email: identifier } : { id: identifier };

        const updatedUser = await prisma.user.update({
            where,
            data: { role }
        });

        res.json({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get recent purchases
router.get('/audit/purchases', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const purchases = await prisma.purchase.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true } } }
        });
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user ledger
router.get('/audit/ledger/:userId', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const ledger = await prisma.creditLedger.findMany({
            where: { userId: req.params.userId },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(ledger);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
