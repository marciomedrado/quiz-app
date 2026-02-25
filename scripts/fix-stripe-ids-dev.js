const prisma = require('../src/db/prisma');

async function fix() {
    console.log("🛠️ Starting data fix for Stripe IDs in DEV database...");

    // 1. Fix Purchases where stripeEventId starts with 'cs_' (it was actually a sessionId)
    const badPurchases = await prisma.purchase.findMany({
        where: {
            stripeEventId: { startsWith: 'cs_' }
        }
    });

    console.log(`Found ${badPurchases.length} purchases with sessionId in stripeEventId.`);

    for (const p of badPurchases) {
        try {
            const sessionId = p.stripeEventId;

            // Check if another purchase already uses this sessionId correctly
            const exists = await prisma.purchase.findFirst({
                where: { stripeSessionId: sessionId }
            });

            if (exists) {
                console.log(`🗑️ Record ${p.id} is a duplicate of ${exists.id} (Session: ${sessionId}). Deleting.`);
                await prisma.purchase.delete({ where: { id: p.id } });
            } else {
                // Move sessionId to stripeSessionId and clear stripeEventId
                await prisma.purchase.update({
                    where: { id: p.id },
                    data: {
                        stripeSessionId: sessionId,
                        stripeEventId: null
                    }
                });
                console.log(`✅ Fixed Purchase ${p.id}`);
            }
        } catch (e) {
            console.error(`❌ Error processing Purchase ${p.id}:`, e.message);
        }
    }

    // 2. Cleanup CreditLedger duplicates
    // Find ledgers with stripeEventId null that have a sibling with same refId but non-null eventId
    const nullLedgers = await prisma.creditLedger.findMany({
        where: { stripeEventId: null, refId: { startsWith: 'cs_' } }
    });

    console.log(`Found ${nullLedgers.length} ledgers with null stripeEventId and sessionId.`);

    for (const l of nullLedgers) {
        try {
            const exists = await prisma.creditLedger.findFirst({
                where: {
                    refId: l.refId,
                    stripeEventId: { not: null }
                }
            });

            if (exists) {
                console.log(`🗑️ Ledger ${l.id} is a duplicate of ${exists.id} (Session: ${l.refId}). Deleting.`);

                // IMPORTANT: When deleting from Ledger, we should ideally revert credits from User!
                // But this is just a dev fix, so let's just clean the log. 
                // To be perfect, we should subtract the delta from the user if we want the current balance to be right.
                await prisma.$transaction([
                    prisma.user.update({
                        where: { id: l.userId },
                        data: { credits: { decrement: l.deltaCredits } }
                    }),
                    prisma.creditLedger.delete({ where: { id: l.id } })
                ]);
                console.log(`✅ Deducted ${l.deltaCredits} credits from user ${l.userId} and deleted duplicate ledger.`);
            }
        } catch (e) {
            console.error(`❌ Error processing Ledger ${l.id}:`, e.message);
        }
    }

    console.log("✨ Data fix complete.");
}

fix()
    .catch(e => {
        console.error("FATAL Error during fix:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
