/*
  Warnings:

  - A unique constraint covering the columns `[finalTimeOptionId]` on the table `Poll` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "finalTimeOptionId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Poll_finalTimeOptionId_key" ON "Poll"("finalTimeOptionId");

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_finalTimeOptionId_fkey" FOREIGN KEY ("finalTimeOptionId") REFERENCES "TimeOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
