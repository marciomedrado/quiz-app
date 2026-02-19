const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSQLite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const fs = require('fs');

// 1. Resolve DB Path carefully
const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
let dbPath = '';

if (dbUrl.startsWith('file:')) {
    const rawPath = dbUrl.replace('file:', '');

    // Fix: Prisma CLI resolves relative to schema.prisma (usually in ./prisma/)
    // Runtime resolves relative to CWD. We must align them.
    // If rawPath starts with ./ and we are at root, we might need to look into prisma folder
    // But simplest is to strictly respect the env var, just handling the file: prefix.

    // However, the common issue is:
    // Migration: file:./dev.db -> <project>/prisma/dev.db
    // Runtime:   file:./dev.db -> <project>/dev.db

    // Let's check potential locations if it's relative
    if (rawPath === './dev.db' && !fs.existsSync(path.resolve(process.cwd(), 'dev.db'))) {
        // Fallback to prisma/dev.db if root dev.db doesn't exist but prisma/dev.db does
        const prismaDbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
        if (fs.existsSync(prismaDbPath)) {
            console.log(`⚠️ "dev.db" not found in root. Using "${prismaDbPath}" (standard Prisma location).`);
            dbPath = prismaDbPath;
        } else {
            dbPath = rawPath;
        }
    } else {
        dbPath = rawPath;
    }
} else {
    dbPath = dbUrl;
}

// Ensure directory exists if we are creating one
const resolvedPath = path.resolve(process.cwd(), dbPath);
const dbDir = path.dirname(resolvedPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

console.log('================================================');
console.log('🔌 Database Connection');
console.log(`   URL: ${dbUrl}`);
console.log(`   Resolved Path: ${resolvedPath}`);
console.log(`   Exists: ${fs.existsSync(resolvedPath)}`);
if (fs.existsSync(resolvedPath)) {
    console.log(`   Size: ${fs.statSync(resolvedPath).size} bytes`);
}
console.log('================================================');

const adapter = new PrismaBetterSQLite3({ url: `file:${resolvedPath}` });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
