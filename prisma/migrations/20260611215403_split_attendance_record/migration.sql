/*
  Warnings:

  - The values [COMPLETED,NO_SHOW,CANCELLED] on the enum `AttendanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `checkedOutAt` on the `OfficeHourAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `helpEndedAt` on the `OfficeHourAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `OfficeHourAttendance` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AttendanceOutcome" AS ENUM ('COMPLETED', 'NO_SHOW', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "AttendanceStatus_new" AS ENUM ('WAITING', 'IN_HELP');
ALTER TABLE "public"."OfficeHourAttendance" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "OfficeHourAttendance" ALTER COLUMN "status" TYPE "AttendanceStatus_new" USING ("status"::text::"AttendanceStatus_new");
ALTER TYPE "AttendanceStatus" RENAME TO "AttendanceStatus_old";
ALTER TYPE "AttendanceStatus_new" RENAME TO "AttendanceStatus";
DROP TYPE "public"."AttendanceStatus_old";
ALTER TABLE "OfficeHourAttendance" ALTER COLUMN "status" SET DEFAULT 'WAITING';
COMMIT;

-- AlterTable
ALTER TABLE "OfficeHourAttendance" DROP COLUMN "checkedOutAt",
DROP COLUMN "helpEndedAt",
DROP COLUMN "note";

-- CreateTable
CREATE TABLE "OfficeHourAttendanceRecord" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "helpedByHostId" INTEGER,
    "checkedInAt" TIMESTAMP(3) NOT NULL,
    "helpStartedAt" TIMESTAMP(3),
    "helpEndedAt" TIMESTAMP(3),
    "outcome" "AttendanceOutcome" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficeHourAttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfficeHourAttendanceRecord_publicId_key" ON "OfficeHourAttendanceRecord"("publicId");

-- CreateIndex
CREATE INDEX "OfficeHourAttendanceRecord_sessionId_outcome_idx" ON "OfficeHourAttendanceRecord"("sessionId", "outcome");

-- CreateIndex
CREATE INDEX "OfficeHourAttendanceRecord_studentId_idx" ON "OfficeHourAttendanceRecord"("studentId");

-- CreateIndex
CREATE INDEX "OfficeHourAttendanceRecord_helpedByHostId_idx" ON "OfficeHourAttendanceRecord"("helpedByHostId");

-- AddForeignKey
ALTER TABLE "OfficeHourAttendanceRecord" ADD CONSTRAINT "OfficeHourAttendanceRecord_helpedByHostId_fkey" FOREIGN KEY ("helpedByHostId") REFERENCES "OfficeHourSessionHost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeHourAttendanceRecord" ADD CONSTRAINT "OfficeHourAttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OfficeHourSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeHourAttendanceRecord" ADD CONSTRAINT "OfficeHourAttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
