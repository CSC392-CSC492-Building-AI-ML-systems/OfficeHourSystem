/*
  Warnings:

  - You are about to drop the column `name` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `sectionCode` on the `CourseOffering` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[courseId,termCode]` on the table `CourseOffering` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CourseOffering_courseId_termCode_sectionCode_key";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "name";

-- AlterTable
ALTER TABLE "CourseOffering" DROP COLUMN "sectionCode";

-- CreateIndex
CREATE UNIQUE INDEX "CourseOffering_courseId_termCode_key" ON "CourseOffering"("courseId", "termCode");
