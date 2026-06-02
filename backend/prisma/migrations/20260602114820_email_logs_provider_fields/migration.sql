-- AlterTable
ALTER TABLE "EmailLog" ADD COLUMN     "error" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'resend',
ADD COLUMN     "providerMessageId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';
