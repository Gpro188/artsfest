/*
  Warnings:

  - You are about to drop the column `category` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Program` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Candidate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProgramAssignment" ADD COLUMN "scheduledTime" DATETIME;
ALTER TABLE "ProgramAssignment" ADD COLUMN "slotNumber" INTEGER;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN "flagColor" TEXT DEFAULT '#4F46E5';
ALTER TABLE "Team" ADD COLUMN "leaderName" TEXT;
ALTER TABLE "Team" ADD COLUMN "leaderPhoto" TEXT;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "chestNumberOffset" INTEGER NOT NULL DEFAULT 0,
    "eventId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Category_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GlobalSetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "festName" TEXT NOT NULL DEFAULT 'Arts Fest',
    "festMoto" TEXT NOT NULL DEFAULT 'Celebrating Creativity',
    "festLogo" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Candidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "chestNumber" TEXT,
    "categoryId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Candidate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Candidate_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Candidate" ("chestNumber", "createdAt", "id", "isApproved", "name", "teamId", "updatedAt") SELECT "chestNumber", "createdAt", "id", "isApproved", "name", "teamId", "updatedAt" FROM "Candidate";
DROP TABLE "Candidate";
ALTER TABLE "new_Candidate" RENAME TO "Candidate";
CREATE UNIQUE INDEX "Candidate_chestNumber_key" ON "Candidate"("chestNumber");
CREATE TABLE "new_PointMatrix" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT,
    "eventId" TEXT,
    "individualPoints" TEXT,
    "groupPoints" TEXT,
    "generalPoints" TEXT,
    "maxIndividualPrograms" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PointMatrix_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PointMatrix_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PointMatrix" ("createdAt", "eventId", "generalPoints", "groupPoints", "id", "individualPoints", "maxIndividualPrograms", "updatedAt") SELECT "createdAt", "eventId", "generalPoints", "groupPoints", "id", "individualPoints", "maxIndividualPrograms", "updatedAt" FROM "PointMatrix";
DROP TABLE "PointMatrix";
ALTER TABLE "new_PointMatrix" RENAME TO "PointMatrix";
CREATE UNIQUE INDEX "PointMatrix_categoryId_key" ON "PointMatrix"("categoryId");
CREATE UNIQUE INDEX "PointMatrix_eventId_key" ON "PointMatrix"("eventId");
CREATE TABLE "new_Program" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "categoryId" TEXT,
    "eventId" TEXT NOT NULL,
    "venue" TEXT,
    "startTime" DATETIME,
    "duration" INTEGER NOT NULL DEFAULT 10,
    "stageType" TEXT NOT NULL DEFAULT 'ON_STAGE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Program_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Program_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Program" ("createdAt", "eventId", "id", "name", "type", "updatedAt") SELECT "createdAt", "eventId", "id", "name", "type", "updatedAt" FROM "Program";
DROP TABLE "Program";
ALTER TABLE "new_Program" RENAME TO "Program";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
