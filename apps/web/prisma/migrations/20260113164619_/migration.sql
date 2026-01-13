/*
  Warnings:

  - The primary key for the `Disclosure` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `OtsReceipt` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ProofItem` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "OtsReceipt" DROP CONSTRAINT "OtsReceipt_disclosureId_fkey";

-- DropForeignKey
ALTER TABLE "ProofItem" DROP CONSTRAINT "ProofItem_disclosureId_fkey";

-- AlterTable
ALTER TABLE "Disclosure" DROP CONSTRAINT "Disclosure_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Disclosure_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "OtsReceipt" DROP CONSTRAINT "OtsReceipt_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "disclosureId" SET DATA TYPE TEXT,
ADD CONSTRAINT "OtsReceipt_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ProofItem" DROP CONSTRAINT "ProofItem_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "disclosureId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ProofItem_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "ProofItem" ADD CONSTRAINT "ProofItem_disclosureId_fkey" FOREIGN KEY ("disclosureId") REFERENCES "Disclosure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtsReceipt" ADD CONSTRAINT "OtsReceipt_disclosureId_fkey" FOREIGN KEY ("disclosureId") REFERENCES "Disclosure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
