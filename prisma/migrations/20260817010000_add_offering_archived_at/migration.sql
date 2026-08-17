-- AlterTable
ALTER TABLE "CourseOffering" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "CourseOffering_archivedAt_idx" ON "CourseOffering"("archivedAt");
