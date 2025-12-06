/*
  Warnings:

  - A unique constraint covering the columns `[referenceId]` on the table `LoyaltyPoint` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "MagicLinkToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "reference" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MagicLinkToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "birthDate" DATETIME,
    "lastBirthdayGrantYear" INTEGER DEFAULT 0,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "vipLevel" TEXT NOT NULL DEFAULT 'SILVER',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdVia" TEXT NOT NULL DEFAULT 'MANUAL',
    "guestKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("birthDate", "createdAt", "email", "id", "loyaltyPoints", "name", "password", "phone", "role", "updatedAt", "vipLevel") SELECT "birthDate", "createdAt", "email", "id", "loyaltyPoints", "name", "password", "phone", "role", "updatedAt", "vipLevel" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_guestKey_idx" ON "User"("guestKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MagicLinkToken_tokenHash_key" ON "MagicLinkToken"("tokenHash");

-- CreateIndex
CREATE INDEX "MagicLinkToken_email_idx" ON "MagicLinkToken"("email");

-- CreateIndex
CREATE INDEX "MagicLinkToken_tokenHash_idx" ON "MagicLinkToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyPoint_referenceId_key" ON "LoyaltyPoint"("referenceId");
