/**
 * Credit pack definitions for Stripe Checkout.
 */

const packs = [
    {
        id: 'pack_100',
        name: 'Pack 100',
        credits: 100,
        bonus: 0,
        priceId: process.env.STRIPE_PRICE_ID_PACK_100
    },
    {
        id: 'pack_500',
        name: 'Pack 500',
        credits: 500,
        bonus: 50,
        priceId: process.env.STRIPE_PRICE_ID_PACK_500
    },
    {
        id: 'pack_2000',
        name: 'Pack 2000',
        credits: 2000,
        bonus: 400,
        priceId: process.env.STRIPE_PRICE_ID_PACK_2000
    },
    {
        id: 'pack_5000',
        name: 'Pack 5000',
        credits: 5000,
        bonus: 1500,
        priceId: process.env.STRIPE_PRICE_ID_PACK_5000
    }
];

module.exports = packs;
