-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "postcode" TEXT NOT NULL,
    "locality" TEXT,
    "companyNumber" TEXT,
    "sicCodes" TEXT NOT NULL DEFAULT '',
    "sectorId" TEXT,
    "incorporated" DATETIME,
    "note" TEXT NOT NULL DEFAULT '',
    "signals" TEXT NOT NULL DEFAULT '',
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'new',
    "reviewedAt" DATETIME,
    "companyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Candidate_status_score_idx" ON "Candidate"("status", "score");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_source_sourceRef_key" ON "Candidate"("source", "sourceRef");
