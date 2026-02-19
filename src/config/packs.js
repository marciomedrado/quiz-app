/**
 * Credit pack definitions for Stripe Checkout.
 * 
 * Logic:
 * - Prefer new IDs (based on Total Credits): 100, 550, 2400, 6500.
 * - Fallback to old IDs (based on Base Credits): 500, 2000, 5000.
 */

const resolvePriceId = (mainVar, fallbackVar) => {
    return process.env[mainVar] || process.env[fallbackVar] || null;
};

const packsDef = [
    {
        id: 'pack_100',
        name: 'Pack Iniciante',
        credits: 100,
        bonus: 0,
        priceId: resolvePriceId('STRIPE_PRICE_ID_PACK_100', 'STRIPE_PRICE_ID_PACK_100'), // No fallback needed really
        priceDisplay: '$5.90'
    },
    {
        id: 'pack_550',
        name: 'Pack Versátil',
        credits: 500,
        bonus: 50,
        priceId: resolvePriceId('STRIPE_PRICE_ID_PACK_550', 'STRIPE_PRICE_ID_PACK_500'),
        priceDisplay: '$24.90'
    },
    {
        id: 'pack_2400',
        name: 'Pack Profissional',
        credits: 2000,
        bonus: 400,
        priceId: resolvePriceId('STRIPE_PRICE_ID_PACK_2400', 'STRIPE_PRICE_ID_PACK_2000'),
        priceDisplay: '$89.90'
    },
    {
        id: 'pack_6500',
        name: 'Pack Mestre',
        credits: 5000,
        bonus: 1500,
        priceId: resolvePriceId('STRIPE_PRICE_ID_PACK_6500', 'STRIPE_PRICE_ID_PACK_5000'),
        priceDisplay: '$199.90'
    }
];

// Helper to map old IDs to new ones if necessary for legacy Webhook events?
// If a webhook comes in with metadata packId='pack_500', we might want to handle it.
// We can add aliases or just be smart in the lookup.
const getPackById = (id) => {
    // Direct match
    let match = packsDef.find(p => p.id === id);
    if (match) return match;

    // Legacy aliases
    const aliases = {
        'pack_500': 'pack_550',
        'pack_2000': 'pack_2400',
        'pack_5000': 'pack_6500'
    };

    if (aliases[id]) {
        return packsDef.find(p => p.id === aliases[id]);
    }

    return null;
};

module.exports = {
    packs: packsDef,
    getPackById
};
