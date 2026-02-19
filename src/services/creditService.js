const prisma = require('../db/prisma');

/**
 * Deduz créditos do usuário e registra no ledger.
 */
const spendCredits = async (userId, amount, reason, refId = null) => {
    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true, credits: true }
        });

        if (!user || user.credits < amount) {
            throw new Error('Créditos insuficientes.');
        }

        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { credits: { decrement: amount } }
        });

        await tx.creditLedger.create({
            data: {
                userId,
                deltaCredits: -amount,
                reason: reason || 'USAGE',
                refId
            }
        });

        return updatedUser;
    });
};

/**
 * Adiciona créditos ao usuário (Compra ou Admin) e registra no ledger.
 */
const addCredits = async (identifier, amount, reason, refId = null) => {
    const where = identifier.includes('@') ? { email: identifier } : { id: identifier };

    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where, select: { id: true } });

        if (!user) {
            throw new Error('Usuário não encontrado.');
        }

        const updatedUser = await tx.user.update({
            where: { id: user.id },
            data: { credits: { increment: amount } }
        });

        await tx.creditLedger.create({
            data: {
                userId: user.id,
                deltaCredits: amount,
                reason: reason || 'PURCHASE',
                refId
            }
        });

        return updatedUser;
    });
};

/**
 * Subtrai créditos (Admin) e registra no ledger.
 */
const subtractCredits = async (identifier, amount, reason, refId = null) => {
    const where = identifier.includes('@') ? { email: identifier } : { id: identifier };

    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where, select: { id: true, credits: true } });

        if (!user) {
            throw new Error('Usuário não encontrado.');
        }

        const finalAmount = Math.min(user.credits, amount);

        const updatedUser = await tx.user.update({
            where: { id: user.id },
            data: { credits: { decrement: finalAmount } }
        });

        await tx.creditLedger.create({
            data: {
                userId: user.id,
                deltaCredits: -finalAmount,
                reason: reason || 'ADMIN_ADJUSTMENT',
                refId
            }
        });

        return updatedUser;
    });
};

/**
 * Log de uso de tokens/imagens para auditoria.
 */
const logUsage = async (usageData) => {
    const {
        userId,
        model,
        inputTokens,
        outputTokens,
        imagesCount,
        costUsd,
        finalChargeUsd,
        creditsCharged,
        referenceAction
    } = usageData;

    return await prisma.usageEvent.create({
        data: {
            userId,
            model,
            inputTokens,
            outputTokens,
            imagesCount,
            costUsd,
            finalChargeUsd,
            creditsCharged,
            referenceAction
        }
    });
};

module.exports = {
    spendCredits,
    addCredits,
    subtractCredits,
    logUsage
};
