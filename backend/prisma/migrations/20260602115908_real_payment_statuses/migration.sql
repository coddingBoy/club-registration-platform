-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('PAYMENT_PENDING', 'COMPLETE', 'PAYMENT_FAILED');

-- AlterEnum
ALTER TYPE "TrialStatus" ADD VALUE 'PAYMENT_PENDING';

-- AlterTable
ALTER TABLE "OnboardingRecord" ADD COLUMN     "status" "OnboardingStatus" NOT NULL DEFAULT 'PAYMENT_PENDING';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "checkoutUrl" TEXT;
