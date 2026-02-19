const prisma = require('../db/prisma');

const spendCredits = async (userId, amount, reason) => {
    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: userId }
        });

        if (!user || user.credits < amount) {
            throw new Error('Créditos insuficientes.');
        }

        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { credits: user.credits - amount }
        });

        await tx.creditTransaction.create({
            data: {
                userId,
                delta: -amount,
                reason
            }
        });

        return updatedUser;
    });
};

const addCredits = async (identifier, amount, reason) => {
    const where = identifier.includes('@') ? { email: identifier } : { id: identifier };

    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where });

        if (!user) {
            throw new Error('Usuário não encontrado.');
        }

        const updatedUser = await tx.user.update({
            where: { id: user.id },
            data: { credits: user.credits + amount }
        });

        await tx.creditTransaction.create({
            data: {
                userId: user.id,
                delta: amount,
                reason
            }
        });

        return updatedUser;
    });
};

const subtractCredits = async (identifier, amount, reason) => {
    const where = identifier.includes('@') ? { email: identifier } : { id: identifier };

    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where });

        if (!user) {
            throw new Error('Usuário não encontrado.');
        }

        const updatedUser = await tx.user.update({
            where: { id: user.id },
            data: { credits: Math.max(0, user.credits - amount) }
        });

        await tx.creditTransaction.create({
            data: {
                userId: user.id,
                delta: -amount,
                reason
            }
        });

        return updatedUser;
    });
};

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
