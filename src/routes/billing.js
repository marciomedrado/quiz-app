const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');
const { requireAuth } = require('../middlewares/auth');
const packs = require('../config/packs');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const { addCredits } = require('../services/creditService');

// Create checkout session
router.post('/checkout', express.json(), requireAuth, async (req, res) => {
    if (!stripe) {
        return res.status(503).json({ error: 'Pagamentos indisponíveis neste ambiente.' });
    }

    const { packId } = req.body;
    const pack = packs.find(p => p.id === packId);

    if (!pack) {
        return res.status(400).json({ error: 'Pacote inválido.' });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: pack.priceId,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/billing/cancel`,
            metadata: {
                userId: req.user.id,
                packId: pack.id,
                creditsAmount: pack.credits + (pack.bonus || 0)
            },
            customer_email: req.user.email
        });

        res.json({ url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Webhook handling
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (webhookSecret && stripe) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            // Development fallback if secret is missing (NOT for production)
            console.warn('⚠️ Webhook secret missing. Skipping signature validation (DEV ONLY).');
            event = JSON.parse(req.body);
        }
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, creditsAmount, packId } = session.metadata;

        try {
            await addCredits(userId, parseInt(creditsAmount), `Compra no Stripe: ${packId} (${session.id})`);
            console.log(`✅ Créditos adicionados para o usuário ${userId}: ${creditsAmount}`);
        } catch (error) {
            console.error(`❌ Erro ao adicionar créditos via webhook: ${error.message}`);
            return res.status(500).send('Internal Server Error');
        }
    }

    res.json({ received: true });
});

module.exports = router;
