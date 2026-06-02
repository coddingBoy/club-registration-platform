-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'SIGNED_CODE_OF_CONDUCT';
ALTER TYPE "DocumentType" ADD VALUE 'DEBIT_ORDER_AUTHORISATION';
ALTER TYPE "DocumentType" ADD VALUE 'MEDICAL_DOCUMENT';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "originalName" TEXT,
ADD COLUMN     "storagePath" TEXT,
ADD COLUMN     "storageProvider" TEXT NOT NULL DEFAULT 'local';
