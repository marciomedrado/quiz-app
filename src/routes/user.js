const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const prisma = require('../db/prisma');

router.get('/me', requireAuth, (req, res) => {
    res.json(req.user);
});

router.patch('/me', requireAuth, async (req, res) => {
    try {
        const { channelName } = req.body;
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { channelName }
        });
        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

module.exports = router;
