-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Draw" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "drawDate" DATETIME NOT NULL,
    "totalPool" REAL NOT NULL DEFAULT 0,
    "tier1Pool" REAL NOT NULL DEFAULT 0,
    "tier2Pool" REAL NOT NULL DEFAULT 0,
    "tier3Pool" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "drawLogic" TEXT NOT NULL DEFAULT 'RANDOM',
    "randomSeed" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Draw" ("createdAt", "drawDate", "id", "randomSeed", "status", "tier1Pool", "tier2Pool", "tier3Pool", "totalPool") SELECT "createdAt", "drawDate", "id", "randomSeed", "status", "tier1Pool", "tier2Pool", "tier3Pool", "totalPool" FROM "Draw";
DROP TABLE "Draw";
ALTER TABLE "new_Draw" RENAME TO "Draw";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
