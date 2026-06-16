-- CreateEnum
CREATE TYPE "OfferingMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- DropIndex
DROP INDEX "OfferingMember_offeringId_role_idx";

-- AlterTable
ALTER TABLE "OfferingMember" ADD COLUMN     "status" "OfferingMemberStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "OfferingMember_offeringId_role_status_idx" ON "OfferingMember"("offeringId", "role", "status");
