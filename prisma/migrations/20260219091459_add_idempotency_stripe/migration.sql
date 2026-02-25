/*
  Warnings:

  - A unique constraint covering the columns `[stripeEventId]` on the table `CreditLedger` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CreditLedger" ADD COLUMN "stripeEventId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stripeEventId" TEXT,
    "stripeSessionId" TEXT,
    "type" TEXT NOT NULL,
    "amountUsd" REAL NOT NULL,
    "creditsAdded" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Purchase" ("amountUsd", "createdAt", "creditsAdded", "id", "stripeEventId", "type", "userId") SELECT "amountUsd", "createdAt", "creditsAdded", "id", "stripeEventId", "type", "userId" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
CREATE UNIQUE INDEX "Purchase_stripeEventId_key" ON "Purchase"("stripeEventId");
CREATE UNIQUE INDEX "Purchase_stripeSessionId_key" ON "Purchase"("stripeSessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CreditLedger_stripeEventId_key" ON "CreditLedger"("stripeEventId");
