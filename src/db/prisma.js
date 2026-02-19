const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Identify DB type for logging
const dbUrl = process.env.DATABASE_URL || '';
const dbType = dbUrl.startsWith('file:') ? 'SQLite' : 'PostgreSQL';
console.log(`🔌 Prisma Client initialized using ${dbType}`);

module.exports = prisma;
