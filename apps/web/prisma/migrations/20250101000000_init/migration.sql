-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "Disclosure" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "hashes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Disclosure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "proofId" TEXT NOT NULL,
    "disclosureId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "path" TEXT,
    "mime" TEXT,
    "sizeBytes" INTEGER,
    "sha256" TEXT NOT NULL,
    "createdBeforeAi" BOOLEAN,
    "notes" TEXT,
    "gitRepo" TEXT,
    "gitCommit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProofItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtsReceipt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "disclosureId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "sha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OtsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "slug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "json" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Template_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE UNIQUE INDEX "Disclosure_slug_key" ON "Disclosure"("slug");

-- AddForeignKey
ALTER TABLE "ProofItem" ADD CONSTRAINT "ProofItem_disclosureId_fkey" FOREIGN KEY ("disclosureId") REFERENCES "Disclosure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtsReceipt" ADD CONSTRAINT "OtsReceipt_disclosureId_fkey" FOREIGN KEY ("disclosureId") REFERENCES "Disclosure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
