-- CreateEnum
CREATE TYPE "OfficeHourSessionStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'DELAYED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('WAITING', 'IN_HELP', 'COMPLETED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CourseRole" AS ENUM ('STUDENT', 'TA', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "OfficeHourType" AS ENUM ('REGULAR', 'GROUP', 'DEBUGGING');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "utorid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOffering" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,
    "termCode" TEXT NOT NULL,
    "sectionCode" TEXT NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingMember" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "offeringId" INTEGER NOT NULL,
    "role" "CourseRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferingMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeHourSchedule" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "offeringId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "OfficeHourType" NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "location" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeHourSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeHourScheduleHost" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "CourseRole" NOT NULL,

    CONSTRAINT "OfficeHourScheduleHost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeHourSession" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "offeringId" INTEGER NOT NULL,
    "scheduleId" INTEGER,
    "title" TEXT NOT NULL,
    "type" "OfficeHourType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "status" "OfficeHourSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeHourSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeHourSessionHost" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "CourseRole" NOT NULL,

    CONSTRAINT "OfficeHourSessionHost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeHourInterest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficeHourInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeHourAttendance" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "helpedByHostId" INTEGER,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "helpStartedAt" TIMESTAMP(3),
    "helpEndedAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "note" TEXT,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'WAITING',

    CONSTRAINT "OfficeHourAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_publicId_key" ON "User"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "User_utorid_key" ON "User"("utorid");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CourseOffering_publicId_key" ON "CourseOffering"("publicId");

-- CreateIndex
CREATE INDEX "CourseOffering_termCode_idx" ON "CourseOffering"("termCode");

-- CreateIndex
CREATE UNIQUE INDEX "CourseOffering_courseId_termCode_sectionCode_key" ON "CourseOffering"("courseId", "termCode", "sectionCode");

-- CreateIndex
CREATE INDEX "OfferingMember_offeringId_role_idx" ON "OfferingMember"("offeringId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "OfferingMember_userId_offeringId_key" ON "OfferingMember"("userId", "offeringId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficeHourSchedule_publicId_key" ON "OfficeHourSchedule"("publicId");

-- CreateIndex
CREATE INDEX "OfficeHourSchedule_offeringId_isActive_idx" ON "OfficeHourSchedule"("offeringId", "isActive");

-- CreateIndex
CREATE INDEX "OfficeHourScheduleHost_userId_idx" ON "OfficeHourScheduleHost"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficeHourScheduleHost_scheduleId_userId_key" ON "OfficeHourScheduleHost"("scheduleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficeHourSession_publicId_key" ON "OfficeHourSession"("publicId");

-- CreateIndex
CREATE INDEX "OfficeHourSession_offeringId_startsAt_idx" ON "OfficeHourSession"("offeringId", "startsAt");

-- CreateIndex
CREATE INDEX "OfficeHourSession_status_idx" ON "OfficeHourSession"("status");

-- CreateIndex
CREATE INDEX "OfficeHourSessionHost_userId_idx" ON "OfficeHourSessionHost"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficeHourSessionHost_sessionId_userId_key" ON "OfficeHourSessionHost"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "OfficeHourInterest_sessionId_idx" ON "OfficeHourInterest"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficeHourInterest_userId_sessionId_key" ON "OfficeHourInterest"("userId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficeHourAttendance_publicId_key" ON "OfficeHourAttendance"("publicId");

-- CreateIndex
CREATE INDEX "OfficeHourAttendance_sessionId_status_checkedInAt_idx" ON "OfficeHourAttendance"("sessionId", "status", "checkedInAt");

-- CreateIndex
CREATE INDEX "OfficeHourAttendance_studentId_idx" ON "OfficeHourAttendance"("studentId");

-- CreateIndex
CREATE INDEX "OfficeHourAttendance_helpedByHostId_idx" ON "OfficeHourAttendance"("helpedByHostId");

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingMember" ADD CONSTRAINT "OfferingMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingMember" ADD CONSTRAINT "OfferingMember_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeHourSchedule" ADD CONSTRAINT "OfficeHourSchedule_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeHourScheduleHost" ADD CONSTRAINT "OfficeHourScheduleHost_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "OfficeHourSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeHourScheduleHost" ADD CONSTRAINT "OfficeHourScheduleHost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeHourSession" ADD CONSTRAINT "OfficeHourSession_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeHourSession" ADD CONSTRAINT "OfficeHourSession_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "OfficeHourSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeHourSessionHost" ADD CONSTRAINT "OfficeHourSessionHost_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OfficeHourSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeHourSessionHost" ADD CONSTRAINT "OfficeHourSessionHost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeHourInterest" ADD CONSTRAINT "OfficeHourInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeHourInterest" ADD CONSTRAINT "OfficeHourInterest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OfficeHourSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeHourAttendance" ADD CONSTRAINT "OfficeHourAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OfficeHourSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeHourAttendance" ADD CONSTRAINT "OfficeHourAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeHourAttendance" ADD CONSTRAINT "OfficeHourAttendance_helpedByHostId_fkey" FOREIGN KEY ("helpedByHostId") REFERENCES "OfficeHourSessionHost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
