/*
  Warnings:

  - A unique constraint covering the columns `[difficulty,order]` on the table `Challenge` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order` to the `Challenge` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `difficulty` on the `Challenge` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('IN_PROGRESS', 'SOLVED', 'SKIPPED');

-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "order" INTEGER NOT NULL,
DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "Difficulty" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "attemptsLeft" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ALTER COLUMN "xp" SET DEFAULT 3000;

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Progress_userId_challengeId_key" ON "Progress"("userId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_difficulty_order_key" ON "Challenge"("difficulty", "order");

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
