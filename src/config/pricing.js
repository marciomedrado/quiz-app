/**
 * Pricing configuration for different AI models.
 * Prices are listed in USD per 1M tokens or per image.
 * 
 * Formula: credits = ceil((cost_usd * PROFIT_MULTIPLIER) / CREDIT_USD_VALUE)
 *
 * New rule:
 * - The user chooses the model and pays PROFIT_MULTIPLIER times the real cost.
 * - So: first compute the real USD cost using the chosen model rates, then apply PROFIT_MULTIPLIER in calculateCredits().
 */

const pricing = {
    // Profit and Credit settings
    settings: {
        CREDIT_USD_VALUE: parseFloat(process.env.CREDIT_USD_VALUE) || 0.01,
        // Set this to 5 in your .env to charge 5x the real cost
        PROFIT_MULTIPLIER: parseFloat(process.env.PROFIT_MULTIPLIER) || 5,
        MIN_CREDITS_PER_ACTION: parseInt(process.env.MIN_CREDITS_PER_ACTION) || 1
    },

    // Models Whitelist and Pricing (USD per 1M tokens)
    textModels: {
        "gpt-4o": { name: "GPT-4o (Mais inteligente)", input: 2.50, output: 10.00 },
        "gpt-4o-mini": { name: "GPT-4o Mini (Mais rápido e barato)", input: 0.15, output: 0.60 },
        "gpt-3.5-turbo": { name: "GPT-3.5 Turbo (Legado)", input: 0.50, output: 1.50 },

        // Models mapped in UI (keep explicit pricing; fallback will be gpt-4o-mini if unknown)
        "gpt-5.2": { name: "GPT-5.2 (Mapeado)", input: 15.00, output: 45.00 },
        "gpt-5-mini": { name: "GPT-5 Mini (Mapeado)", input: 5.00, output: 15.00 },
        "gpt-5-nano": { name: "GPT-5 Nano (Mapeado)", input: 1.00, output: 3.00 },
        "gpt-4.1": { name: "GPT-4.1 (Mapeado)", input: 5.00, output: 15.00 },
        "gpt-4.1-mini": { name: "GPT-4.1 Mini (Mapeado)", input: 0.50, output: 1.50 },
        "gpt-4.1-nano": { name: "GPT-4.1 Nano (Mapeado)", input: 0.10, output: 0.30 }
    },

    // Image Models Pricing (USD per image)
    imageModels: {
        "dall-e-3": {
            "1024x1024": { standard: 0.04, hd: 0.08 },
            "1024x1792": { standard: 0.08, hd: 0.12 },
            "1792x1024": { standard: 0.08, hd: 0.12 },
            "default": 0.04
        },
        // Keeping your naming, but prices reflect the table you pasted (OpenAI GPT Image pricing)
        // If this is truly Google Imagen in your app, replace these with your Google costs.
        "google-imagen": {
            "low": 0.009,
            "medium": 0.034,
            "high": 0.133,
            "default": 0.034
        }
    }
};

/**
 * Calculate credits to charge based on USD cost.
 */
function calculateCredits(costUsd) {
    const { PROFIT_MULTIPLIER, CREDIT_USD_VALUE, MIN_CREDITS_PER_ACTION } = pricing.settings;

    // User pays PROFIT_MULTIPLIER times the real cost
    const finalChargeUsd = costUsd * PROFIT_MULTIPLIER;

    // Convert USD to credits
    const credits = Math.max(MIN_CREDITS_PER_ACTION, Math.ceil(finalChargeUsd / CREDIT_USD_VALUE));

    return {
        credits,
        finalChargeUsd
    };
}

/**
 * Calculate REAL cost for text models (USD).
 * (Profit is applied later in calculateCredits)
 */
function calculateTextCostUsd(model, inputTokens, outputTokens) {
    const config = pricing.textModels[model] || pricing.textModels["gpt-4o-mini"];

    const inputCost = (inputTokens / 1_000_000) * config.input;
    const outputCost = (outputTokens / 1_000_000) * config.output;

    return inputCost + outputCost;
}

/**
 * Calculate REAL cost for image models (USD).
 * (Profit is applied later in calculateCredits)
 */
function calculateImageCostUsd(provider, options = {}) {
    // OpenAI / DALL·E 3
    if (provider === 'openai' || provider === 'dall-e-3') {
        const quality = (options.quality || 'standard').toLowerCase(); // standard | hd
        const size = (options.size || '1024x1024').toLowerCase();      // 1024x1024 | 1024x1792 | 1792x1024

        const bySize = pricing.imageModels["dall-e-3"][size];
        if (bySize && bySize[quality] != null) return bySize[quality];

        return pricing.imageModels["dall-e-3"]["default"];
    }

    // Google (or mapped provider)
    if (provider === 'google' || provider === 'google-imagen') {
        const quality = (options.quality || 'medium').toLowerCase(); // low | medium | high
        return pricing.imageModels["google-imagen"][quality] || pricing.imageModels["google-imagen"]["default"];
    }

    // Generic fallback
    return pricing.imageModels["dall-e-3"]["default"];
}

module.exports = {
    pricing,
    calculateCredits,
    calculateTextCostUsd,
    calculateImageCostUsd
};
