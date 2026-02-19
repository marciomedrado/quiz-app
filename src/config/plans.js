/**
 * Subscription plans definitions.
 * Price IDs must come from Stripe Dashboard.
 */

const plans = {
    BASIC: {
        id: 'BASIC',
        name: 'Plano Básico',
        priceId: process.env.STRIPE_PRICE_ID_PLAN_BASIC,
        creditsPerMonth: 500,
        priceUsd: 9.90,
        features: ['500 Créditos/mês', 'Suporte Prioritário']
    },
    PRO: {
        id: 'PRO',
        name: 'Plano Profissional',
        priceId: process.env.STRIPE_PRICE_ID_PLAN_PRO,
        creditsPerMonth: 2000,
        priceUsd: 29.90,
        features: ['2000 Créditos/mês', 'Geração de Imagens Imagen 3', 'Suporte 24/7']
    }
};

module.exports = plans;
