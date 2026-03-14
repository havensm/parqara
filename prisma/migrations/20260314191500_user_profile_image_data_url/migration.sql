-- AlterTable
ALTER TABLE "public"."User"
  ADD COLUMN IF NOT EXISTS "profileImageDataUrl" TEXT;
