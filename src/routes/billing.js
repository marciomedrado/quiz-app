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

// Normalize APP_URL to ensure it has no trailing slash and includes protocol
const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

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
            success_url: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${APP_URL}/pricing?error=cancelado`,
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
            success_url: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${APP_URL}/pricing?error=cancelado`,
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

    const stripeEventId = event.id;

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                // Check idempotency for pack purchases (Event ID OR Session ID)
                const duplicatePack = await prisma.purchase.findFirst({
                    where: {
                        OR: [
                            { stripeEventId: stripeEventId },
                            { stripeSessionId: session.id }
                        ]
                    }
                }) || await prisma.creditLedger.findFirst({
                    where: {
                        OR: [
                            { stripeEventId: stripeEventId },
                            { refId: session.id }
                        ]
                    }
                });

                if (duplicatePack) {
                    console.log(`Duplicate detected (Event: ${stripeEventId} or Session: ${session.id}), skipping.`);
                    return res.json({ received: true, duplicate: true });
                }

                await handleCheckoutCompleted(session, stripeEventId);
                break;

            case 'invoice.paid':
                const invoice = event.data.object;
                // Check idempotency for subscriptions (Event ID OR Invoice ID)
                const duplicateInvoice = await prisma.creditLedger.findFirst({
                    where: {
                        OR: [
                            { stripeEventId: stripeEventId },
                            { refId: invoice.id }
                        ]
                    }
                });
                if (duplicateInvoice) {
                    console.log(`Duplicate detected (Event: ${stripeEventId} or Invoice: ${invoice.id}), skipping.`);
                    return res.json({ received: true, duplicate: true });
                }
                await handleInvoicePaid(invoice, stripeEventId);
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
/**
 * Lógica: Pagamento de Créditos concluído
 */
async function handleCheckoutCompleted(session, stripeEventId) {
    if (session.metadata.type !== 'CREDIT_PACK') return;

    let userId = session.metadata.userId;

    // Fallback: resolution by email if userId missing in metadata
    if (!userId && session.customer_email) {
        const user = await prisma.user.findUnique({ where: { email: session.customer_email } });
        if (user) userId = user.id;
    }

    if (!userId) {
        console.error(`CRITICAL: Could not resolve userId for session ${session.id}. Event: ${stripeEventId}`);
        return;
    }

    const { packId } = session.metadata;
    const pack = getPackById(packId);

    if (!pack) {
        console.error(`CRITICAL: Paid packId '${packId}' not found in config. UserId: ${userId}. Session: ${session.id}`);
        return;
    }

    const totalCredits = pack.credits + (pack.bonus || 0);

    await prisma.$transaction(async (tx) => {
        // Double check idempotency inside transaction
        const existing = await tx.purchase.findFirst({
            where: {
                OR: [
                    { stripeEventId: stripeEventId },
                    { stripeSessionId: session.id }
                ]
            }
        });
        if (existing) return;

        // Registrar compra
        await tx.purchase.create({
            data: {
                userId,
                stripeEventId: stripeEventId,
                stripeSessionId: session.id, // cs_...
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
                refId: session.id, // Link to session
                stripeEventId: stripeEventId
            }
        });
    });

    console.log(`✅ Créditos adicionados via Webhook: ${totalCredits} para ${userId} (Event: ${stripeEventId})`);
}

/**
 * Lógica: Mensalidade paga (Recarga de créditos)
 */
async function handleInvoicePaid(invoice, stripeEventId) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    let userId = subscription.metadata.userId;
    const planId = subscription.metadata.planId;
    const plan = plans[planId];

    // Fallback: resolution by email
    if (!userId && invoice.customer_email) {
        const user = await prisma.user.findUnique({ where: { email: invoice.customer_email } });
        if (user) userId = user.id;
    }

    if (!plan || !userId) {
        console.error(`CRITICAL: Missing plan or userId. PlanId: ${planId}, UserId: ${userId}. Invoice: ${invoice.id}`);
        return;
    }

    await prisma.$transaction(async (tx) => {
        // Double check idempotency
        const existing = await tx.creditLedger.findFirst({
            where: {
                OR: [
                    { stripeEventId: stripeEventId },
                    { refId: invoice.id }
                ]
            }
        });
        if (existing) return;

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
                refId: invoice.id,
                stripeEventId: stripeEventId
            }
        });
    });

    console.log(`✅ Mensalidade processada via Webhook para ${userId} (Plan: ${planId}, Event: ${stripeEventId})`);
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
