-- AlterTable
ALTER TABLE "Company" ADD COLUMN "geocodedAt" DATETIME;
ALTER TABLE "Company" ADD COLUMN "logoUrl" TEXT;

-- CreateTable
CREATE TABLE "CompanySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "takenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "headcountNum" INTEGER NOT NULL,
    "openRoles" INTEGER NOT NULL,
    "raisedGbp" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "claimed" BOOLEAN NOT NULL,
    CONSTRAINT "CompanySnapshot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CompanySnapshot_companyId_takenAt_idx" ON "CompanySnapshot"("companyId", "takenAt");
