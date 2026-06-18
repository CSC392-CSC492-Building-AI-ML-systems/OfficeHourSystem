/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,studentId]` on the table `OfficeHourAttendance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OfficeHourAttendance_sessionId_studentId_key" ON "OfficeHourAttendance"("sessionId", "studentId");
