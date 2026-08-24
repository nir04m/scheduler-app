/*
  Warnings:

  - You are about to drop the column `responseToken` on the `Participant` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Participant_responseToken_key";

-- AlterTable
ALTER TABLE "Participant" DROP COLUMN "responseToken";
