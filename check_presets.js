const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const presets = await prisma.stylePreset.findMany();
        console.log('Total presets:', presets.length);
        console.log(JSON.stringify(presets, null, 2));
    } catch (error) {
        console.error('Error fetching presets:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
