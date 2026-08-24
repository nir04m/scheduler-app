/*
  Warnings:

  - A unique constraint covering the columns `[organizerToken]` on the table `Poll` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "organizerToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Poll_organizerToken_key" ON "Poll"("organizerToken");
