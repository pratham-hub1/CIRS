-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'FACULTY', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('LOST', 'FOUND');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('ELECTRONICS', 'WALLETS', 'DOCUMENTS', 'BAGS', 'CLOTHING', 'ACCESSORIES', 'STATIONERY', 'KEYS', 'OTHERS');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('LOST_REPORTED', 'FOUND', 'READY_FOR_COLLECTION', 'RETURNED', 'ARCHIVED', 'UNCLAIMED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'INFO_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "StorageLocationName" AS ENUM ('SECURITY_OFFICE', 'LIBRARY', 'LABORATORY', 'DEPARTMENT_OFFICE', 'RECEPTION');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REPORT_SUBMITTED', 'POSSIBLE_MATCH', 'NEW_CLAIM', 'MORE_INFO_NEEDED', 'CLAIM_APPROVED', 'CLAIM_REJECTED', 'READY_FOR_COLLECTION', 'ITEM_RETURNED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SUGGESTED', 'CONFIRMED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('AUTO', 'MANUAL');

-- CreateTable
CREATE TABLE "campus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "campusId" TEXT NOT NULL,
    "departmentId" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "replacedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_location" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "name" "StorageLocationName" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "reporterId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "departmentId" TEXT,
    "itemName" TEXT NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "colour" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "identifyingMarks" TEXT NOT NULL,
    "serialNumber" TEXT,
    "status" "ItemStatus" NOT NULL,
    "dateLost" TIMESTAMP(3),
    "lastKnownLocation" TEXT,
    "dateFound" TIMESTAMP(3),
    "foundLocation" TEXT,
    "storageLocationId" TEXT,
    "duplicateOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_image" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL DEFAULT 'FOUND',
    "claimantId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateLost" TIMESTAMP(3) NOT NULL,
    "placeLost" TEXT NOT NULL,
    "identifyingMarks" TEXT NOT NULL,
    "verificationLevel" "VerificationLevel" NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionReason" TEXT,
    "handoverAt" TIMESTAMP(3),
    "receiptConfirmedAt" TIMESTAMP(3),
    "postReturnFeedback" TEXT,
    "handoverOverrideBy" TEXT,
    "handoverOverrideReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_document" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_question" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "source" "QuestionSource" NOT NULL DEFAULT 'AUTO',
    "answerText" TEXT,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "claim_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match" (
    "id" TEXT NOT NULL,
    "lostItemId" TEXT NOT NULL,
    "foundItemId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SUGGESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "channel" "Channel" NOT NULL DEFAULT 'IN_APP',
    "eventKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preference" (
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "digestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "saved_search" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_token" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appeal" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "appellantId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'PENDING',
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_message" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visibleToStaff" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- Unique & Indexes
CREATE UNIQUE INDEX "campus_code_key" ON "campus"("code");
CREATE UNIQUE INDEX "department_campusId_code_key" ON "department"("campusId", "code");
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "refresh_token_replacedById_key" ON "refresh_token"("replacedById");
CREATE INDEX "refresh_token_familyId_idx" ON "refresh_token"("familyId");
CREATE UNIQUE INDEX "storage_location_campusId_name_key" ON "storage_location"("campusId", "name");

-- INV-DM-1: Case IDs unique & immutable
CREATE UNIQUE INDEX "item_caseId_key" ON "item"("caseId");
CREATE UNIQUE INDEX "item_id_type_key" ON "item"("id", "type");
CREATE INDEX "item_campusId_status_idx" ON "item"("campusId", "status");
CREATE INDEX "item_category_status_idx" ON "item"("category", "status");

-- INV-DM-4: At most one APPROVED claim per found item
CREATE UNIQUE INDEX "claim_item_id_approved_key" ON "claim"("itemId") WHERE "status" = 'APPROVED';
CREATE INDEX "claim_itemId_status_idx" ON "claim"("itemId", "status");

-- INV-DM-9: Match unique pair
CREATE UNIQUE INDEX "match_lostItemId_foundItemId_key" ON "match"("lostItemId", "foundItemId");

CREATE UNIQUE INDEX "notification_eventKey_key" ON "notification"("eventKey");
CREATE INDEX "notification_userId_readAt_idx" ON "notification"("userId", "readAt");
CREATE INDEX "saved_search_userId_active_idx" ON "saved_search"("userId", "active");

-- INV-DM-5: Collection token unique code
CREATE UNIQUE INDEX "collection_token_claimId_key" ON "collection_token"("claimId");
CREATE UNIQUE INDEX "collection_token_code_key" ON "collection_token"("code");

CREATE INDEX "case_message_itemId_createdAt_idx" ON "case_message"("itemId", "createdAt");
CREATE INDEX "audit_log_targetType_targetId_idx" ON "audit_log"("targetType", "targetId");

-- Foreign Keys
ALTER TABLE "department" ADD CONSTRAINT "department_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user" ADD CONSTRAINT "user_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user" ADD CONSTRAINT "user_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "refresh_token"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "storage_location" ADD CONSTRAINT "storage_location_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "item" ADD CONSTRAINT "item_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "item" ADD CONSTRAINT "item_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "item" ADD CONSTRAINT "item_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "item" ADD CONSTRAINT "item_storageLocationId_fkey" FOREIGN KEY ("storageLocationId") REFERENCES "storage_location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "item" ADD CONSTRAINT "item_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "item_image" ADD CONSTRAINT "item_image_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- INV-DM-2: A claim is always for a FOUND item
ALTER TABLE "claim" ADD CONSTRAINT "claim_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "claim" ADD CONSTRAINT "chk_claim_item_type" CHECK ("itemType" = 'FOUND');

ALTER TABLE "claim" ADD CONSTRAINT "claim_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "claim" ADD CONSTRAINT "claim_decidedBy_fkey" FOREIGN KEY ("decidedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "claim" ADD CONSTRAINT "claim_handoverOverrideBy_fkey" FOREIGN KEY ("handoverOverrideBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "claim_document" ADD CONSTRAINT "claim_document_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "claim_question" ADD CONSTRAINT "claim_question_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "match" ADD CONSTRAINT "match_lostItemId_fkey" FOREIGN KEY ("lostItemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "match" ADD CONSTRAINT "match_foundItemId_fkey" FOREIGN KEY ("foundItemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_search" ADD CONSTRAINT "saved_search_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collection_token" ADD CONSTRAINT "collection_token_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appeal" ADD CONSTRAINT "appeal_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appeal" ADD CONSTRAINT "appeal_appellantId_fkey" FOREIGN KEY ("appellantId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appeal" ADD CONSTRAINT "appeal_decidedBy_fkey" FOREIGN KEY ("decidedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "case_message" ADD CONSTRAINT "case_message_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "case_message" ADD CONSTRAINT "case_message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- INV-DM-6: Type-specific fields always present for its type
ALTER TABLE "item" ADD CONSTRAINT "chk_item_type_fields" CHECK (
    ("type" = 'LOST' AND "dateLost" IS NOT NULL) OR 
    ("type" = 'FOUND' AND "dateFound" IS NOT NULL AND "storageLocationId" IS NOT NULL)
);

-- INV-DM-10: Duplicate pointer never forms a self-loop
ALTER TABLE "item" ADD CONSTRAINT "chk_item_duplicate_no_self" CHECK (
    "duplicateOfId" IS NULL OR "duplicateOfId" <> "id"
);
