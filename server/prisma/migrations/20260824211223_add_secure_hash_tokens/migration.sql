/*
  Warnings:

  - A unique constraint covering the columns `[responseTokenId]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "responseTokenHash" TEXT,
ADD COLUMN     "responseTokenId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Participant_responseTokenId_key" ON "Participant"("responseTokenId");
