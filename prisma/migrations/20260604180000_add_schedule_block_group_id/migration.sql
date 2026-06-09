-- AlterTable
ALTER TABLE "OfficeHourSchedule" ADD COLUMN "blockGroupId" TEXT;

-- CreateIndex
CREATE INDEX "OfficeHourSchedule_offeringId_blockGroupId_idx" ON "OfficeHourSchedule"("offeringId", "blockGroupId");