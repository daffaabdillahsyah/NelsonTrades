-- CreateTable
CREATE TABLE "FundedAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "broker" TEXT NOT NULL DEFAULT '',
    "accountSize" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "maxDrawdownPct" REAL NOT NULL,
    "profitTargetPct" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FundedAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fundedAccountId" TEXT,
    "pair" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "entryPrice" REAL NOT NULL,
    "exitPrice" REAL NOT NULL,
    "stopLoss" REAL NOT NULL,
    "takeProfit" REAL NOT NULL,
    "result" TEXT NOT NULL,
    "pnl" REAL NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "images" TEXT NOT NULL DEFAULT '[]',
    "tradeDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JournalEntry_fundedAccountId_fkey" FOREIGN KEY ("fundedAccountId") REFERENCES "FundedAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_JournalEntry" ("createdAt", "direction", "entryPrice", "exitPrice", "id", "images", "notes", "pair", "pnl", "result", "stopLoss", "takeProfit", "tradeDate", "userId") SELECT "createdAt", "direction", "entryPrice", "exitPrice", "id", "images", "notes", "pair", "pnl", "result", "stopLoss", "takeProfit", "tradeDate", "userId" FROM "JournalEntry";
DROP TABLE "JournalEntry";
ALTER TABLE "new_JournalEntry" RENAME TO "JournalEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
