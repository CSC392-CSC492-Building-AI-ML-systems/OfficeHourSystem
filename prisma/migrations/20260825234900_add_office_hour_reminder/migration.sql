-- CreateTable
CREATE TABLE "OfficeHourReminder" (
    "id" SERIAL NOT NULL,
    "interestId" INTEGER NOT NULL,
    "minutesBefore" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficeHourReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfficeHourReminder_interestId_minutesBefore_key" ON "OfficeHourReminder"("interestId", "minutesBefore");

-- AddForeignKey
ALTER TABLE "OfficeHourReminder" ADD CONSTRAINT "OfficeHourReminder_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "OfficeHourInterest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
