const express = require('express');
const router = express.Router();
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
    console.warn("⚠️ STRIPE_SECRET_KEY not set. Billing disabled.");
}

const prisma = require('../db/prisma');
const { requireAuth } = require('../middlewares/auth');
const { addCredits } = require('../services/creditService');
const { packs, getPackById } = require('../config/packs');
const plans = require('../config/plans');

/**
 * GET /packs -- Dynamic discovery
 */
router.get('/packs', (req, res) => {
    // Return only public data + availability
    const securePacks = packs.map(p => ({
        id: p.id,
        name: p.name,
        credits: p.credits, // Base
        bonus: p.bonus, // Bonus
        totalCredits: p.credits + (p.bonus || 0), // Helper for UI
        priceDisplay: p.priceDisplay,
        available: !!p.priceId
    }));
    res.json(securePacks);
});

/**
 * Checkout para Créditos (One-time)
 */
router.post('/checkout/credits', express.json(), requireAuth, async (req, res) => {
    if (!stripe) return res.status(503).json({ error: 'Sistema de pagamento indisponível (Stripe not configured).' });

    try {
        const { packId } = req.body;
        const pack = getPackById(packId);

        if (!pack) {
            return res.status(400).json({ error: 'Pacote inválido ou inexistente.' });
        }
        if (!pack.priceId) {
            console.error(`Missing Price ID for pack ${pack.id}`);
            return res.status(503).json({ error: 'Pacote indisponível temporariamente.' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: pack.priceId,
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.APP_URL}/pricing?error=cancelado`,
            customer_email: req.user.email,
            metadata: {
                userId: req.user.id,
                packId: pack.id,
                type: 'CREDIT_PACK'
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error.message);
        res.status(500).json({ error: 'Erro ao criar sessão de pagamento.' });
    }
});

/**
 * Checkout para Assinatura (Recurring)
 */
router.post('/checkout/subscription', express.json(), requireAuth, async (req, res) => {
    if (!stripe) return res.status(503).json({ error: 'Sistema de pagamento indisponível.' });

    try {
        const { planId } = req.body;
        const plan = plans[planId];

        if (!plan) {
            return res.status(400).json({ error: 'Plano inválido.' });
        }

        // Ensure plan priceId is available (usually in plans.js or env)
        // If plans.js maps from env, it might be undefined there
        if (!plan.priceId) {
            return res.status(503).json({ error: 'Plano indisponível temporariamente.' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: plan.priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.APP_URL}/pricing?error=cancelado`,
            customer_email: req.user.email,
            metadata: {
                userId: req.user.id,
                planId: plan.id,
                type: 'SUBSCRIPTION'
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Subscription Error:', error.message);
        res.status(500).json({ error: 'Erro ao criar sessão de assinatura.' });
    }
});

/**
 * Webhook Seguro
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) return res.status(503).send("Stripe not configured");

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Signature Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;
            case 'invoice.paid':
                await handleInvoicePaid(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            default:
            // console.log(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook logic:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * Lógica: Pagamento de Créditos concluído
 */
async function handleCheckoutCompleted(session) {
    if (session.metadata.type !== 'CREDIT_PACK') return;

    const { userId, packId } = session.metadata;

    // Resolve pack using helper (handles legacy aliases if needed)
    const pack = getPackById(packId);

    // Fallback integrity: if pack definitions changed but we got paid, we should honor it if possible.
    if (!pack) {
        console.error(`CRITICAL: Paid packId '${packId}' not found in config. UserId: ${userId}. Session: ${session.id}`);
        // TODO: Maybe credit a default amount or flag for manual review?
        return;
    }

    const totalCredits = pack.credits + (pack.bonus || 0);

    await prisma.$transaction(async (tx) => {
        // Idempotência check
        const existingPurchase = await tx.purchase.findUnique({
            where: { stripeEventId: session.id }
        });
        if (existingPurchase) return;

        // Registrar compra
        await tx.purchase.create({
            data: {
                userId,
                stripeEventId: session.id,
                type: 'CREDIT_PACK',
                amountUsd: session.amount_total / 100,
                creditsAdded: totalCredits
            }
        });

        // Adicionar créditos no Ledger + User atomicamente
        await tx.user.update({
            where: { id: userId },
            data: { credits: { increment: totalCredits } }
        });

        await tx.creditLedger.create({
            data: {
                userId,
                deltaCredits: totalCredits,
                reason: 'PURCHASE',
                refId: session.id
            }
        });
    });

    console.log(`✅ Créditos adicionados: ${totalCredits} para ${userId}`);
}

/**
 * Lógica: Mensalidade paga (Recarga de créditos)
 */
async function handleInvoicePaid(invoice) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.userId;
    const planId = subscription.metadata.planId;
    const plan = plans[planId];

    if (!plan) {
        console.error(`CRITICAL: Paid planId '${planId}' not found. UserId: ${userId}. Invoice: ${invoice.id}`);
        return;
    }

    await prisma.$transaction(async (tx) => {
        // Atualizar ou criar sub
        await tx.subscription.upsert({
            where: { userId },
            update: {
                status: 'ACTIVE',
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                stripeSubscriptionId: subscription.id
            },
            create: {
                userId,
                stripeSubscriptionId: subscription.id,
                status: 'ACTIVE',
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                planId
            }
        });

        // Recarregar créditos
        await tx.user.update({
            where: { id: userId },
            data: { credits: { increment: plan.creditsPerMonth } }
        });

        await tx.creditLedger.create({
            data: {
                userId,
                deltaCredits: plan.creditsPerMonth,
                reason: 'SUBSCRIPTION_REPLENISH',
                refId: invoice.id
            }
        });
    });
}

/**
 * Lógica: Assinatura cancelada
 */
async function handleSubscriptionDeleted(subscription) {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await prisma.subscription.updateMany({
        where: { userId, stripeSubscriptionId: subscription.id },
        data: { status: 'CANCELED' }
    });
}

module.exports = router;
