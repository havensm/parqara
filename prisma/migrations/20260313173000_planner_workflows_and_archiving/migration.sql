-- CreateEnum
CREATE TYPE "public"."PlannerStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "public"."Trip"
  ADD COLUMN "plannerStatus" "public"."PlannerStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."PlannerVersion" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "userId" TEXT,
  "label" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PlannerVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlannerTemplate" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PlannerTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlannerExport" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "brandingMode" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PlannerExport_pkey" PRIMARY KEY ("id")
);

-- DropIndex
DROP INDEX "public"."Trip_userId_visitDate_idx";

-- CreateIndex
CREATE INDEX "Trip_userId_plannerStatus_visitDate_idx" ON "public"."Trip"("userId", "plannerStatus", "visitDate");

-- CreateIndex
CREATE INDEX "Trip_plannerStatus_updatedAt_idx" ON "public"."Trip"("plannerStatus", "updatedAt");

-- CreateIndex
CREATE INDEX "PlannerVersion_tripId_createdAt_idx" ON "public"."PlannerVersion"("tripId", "createdAt");

-- CreateIndex
CREATE INDEX "PlannerVersion_userId_createdAt_idx" ON "public"."PlannerVersion"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PlannerTemplate_userId_createdAt_idx" ON "public"."PlannerTemplate"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PlannerExport_tripId_createdAt_idx" ON "public"."PlannerExport"("tripId", "createdAt");

-- CreateIndex
CREATE INDEX "PlannerExport_userId_createdAt_idx" ON "public"."PlannerExport"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."PlannerVersion" ADD CONSTRAINT "PlannerVersion_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlannerVersion" ADD CONSTRAINT "PlannerVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlannerTemplate" ADD CONSTRAINT "PlannerTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlannerExport" ADD CONSTRAINT "PlannerExport_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlannerExport" ADD CONSTRAINT "PlannerExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
