-- AlterTable
ALTER TABLE "User" ADD COLUMN "student_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_student_number_key" ON "User"("student_number");
