const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSQLite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';

if (!dbUrl.startsWith('file:')) {
    throw new Error('DATABASE_URL must start with "file:" for this SQLite configuration.');
}

// Remove 'file:' prefix. usage of decodeURIComponent is good practice if path has spaces, 
// though usually not needed for simple './prisma/dev.db'
const filePart = decodeURIComponent(dbUrl.slice('file:'.length));
const resolvedPath = path.resolve(process.cwd(), filePart);

console.log('================================================');
console.log('🔌 Database Connection Init');
console.log(`   CWD: ${process.cwd()}`);
console.log(`   DB URL: ${dbUrl}`);
console.log(`   Resolved Path: ${resolvedPath}`);
console.log(`   File Exists Before Open: ${fs.existsSync(resolvedPath)}`);

// Ensure directory exists
const dbDir = path.dirname(resolvedPath);
if (!fs.existsSync(dbDir)) {
    console.log(`   Creating directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
}
console.log('================================================');

// Pass the absolute resolved path back to the adapter
const adapter = new PrismaBetterSQLite3({ url: `file:${resolvedPath}` });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
