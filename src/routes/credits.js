const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const { addCredits } = require('../services/creditService');

// Admin: Add credits to any user
router.post('/admin/add', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { userEmail, amount, reason } = req.body;

        if (!userEmail || !amount) {
            return res.status(400).json({ error: 'E-mail e quantidade são obrigatórios.' });
        }

        const user = await addCredits(userEmail, parseInt(amount), reason || 'Adicionado pelo administrador');
        res.json({ message: 'Créditos adicionados!', user: { email: user.email, credits: user.credits } });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
