/**
 * Pricing configuration for different AI models.
 * Prices are listed in USD per 1M tokens or per image.
 * 
 * Formula: credits = ceil((cost_usd * PROFIT_MULTIPLIER) / CREDIT_USD_VALUE)
 */

const pricing = {
    // Profit and Credit settings
    settings: {
        CREDIT_USD_VALUE: parseFloat(process.env.CREDIT_USD_VALUE) || 0.01,
        PROFIT_MULTIPLIER: parseFloat(process.env.PROFIT_MULTIPLIER) || 10,
        MIN_CREDITS_PER_ACTION: parseInt(process.env.MIN_CREDITS_PER_ACTION) || 1
    },

    // Models Whitelist and Pricing (USD per 1M tokens)
    textModels: {
        "gpt-4o": { name: "GPT-4o (Mais inteligente)", input: 2.50, output: 10.00 },
        "gpt-4o-mini": { name: "GPT-4o Mini (Mais rápido e barato)", input: 0.15, output: 0.60 },
        "gpt-3.5-turbo": { name: "GPT-3.5 Turbo (Legado)", input: 0.50, output: 1.50 },

        // Hypothetical models from UI (mapping to GPT-4o prices as fallback)
        "gpt-5.2": { input: 15.00, output: 45.00 },
        "gpt-5-mini": { input: 5.00, output: 15.00 },
        "gpt-5-nano": { input: 1.00, output: 3.00 },
        "gpt-4.1": { input: 5.00, output: 15.00 },
        "gpt-4.1-mini": { input: 0.50, output: 1.50 },
        "gpt-4.1-nano": { input: 0.10, output: 0.30 }
    },

    // Image Models Pricing (USD per image)
    imageModels: {
        "dall-e-3": {
            "1024x1024": { standard: 0.04, hd: 0.08 },
            "default": 0.04
        },
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
    const finalChargeUsd = costUsd * PROFIT_MULTIPLIER;
    const credits = Math.max(MIN_CREDITS_PER_ACTION, Math.ceil(finalChargeUsd / CREDIT_USD_VALUE));
    return {
        credits,
        finalChargeUsd
    };
}

/**
 * Calculate cost for text models.
 */
function calculateTextCostUsd(model, inputTokens, outputTokens) {
    const config = pricing.textModels[model] || pricing.textModels["gpt-4o-mini"];
    const inputCost = (inputTokens / 1_000_000) * config.input;
    const outputCost = (outputTokens / 1_000_000) * config.output;
    return inputCost + outputCost;
}

/**
 * Calculate cost for image models.
 */
function calculateImageCostUsd(provider, options = {}) {
    if (provider === 'openai' || provider === 'dall-e-3') {
        const quality = options.quality || 'standard';
        const size = options.size || '1024x1024';
        return pricing.imageModels["dall-e-3"][size]?.[quality] || pricing.imageModels["dall-e-3"]["default"];
    }

    if (provider === 'google') {
        const quality = options.quality || 'medium';
        return pricing.imageModels["google-imagen"][quality] || pricing.imageModels["google-imagen"]["default"];
    }

    return 0.04; // Generic fallback
}

module.exports = {
    pricing,
    calculateCredits,
    calculateTextCostUsd,
    calculateImageCostUsd
};
