/*
  Warnings:

  - A unique constraint covering the columns `[barcodeNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "barcodeNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_barcodeNumber_key" ON "User"("barcodeNumber");
