-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('AUTHENTICATED', 'PRIVATE');

-- CreateTable
CREATE TABLE "file" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "visibility" "FileVisibility" NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_storageKey_key" ON "file"("storageKey");

-- Clear stale test rows from item_image and claim_document before migrating to fileId
DELETE FROM "item_image";
DELETE FROM "claim_document";

-- AlterTable item_image
ALTER TABLE "item_image" DROP COLUMN "url",
ADD COLUMN     "fileId" TEXT NOT NULL;

-- AlterTable claim_document
ALTER TABLE "claim_document" DROP COLUMN "url",
ADD COLUMN     "fileId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "item_image" ADD CONSTRAINT "item_image_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_document" ADD CONSTRAINT "claim_document_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
