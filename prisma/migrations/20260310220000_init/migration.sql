-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "public"."OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."AttractionCategory" AS ENUM ('RIDE', 'SHOW', 'DINING', 'PLAY');

-- CreateEnum
CREATE TYPE "public"."AttractionOperationalStatus" AS ENUM ('OPEN', 'TEMPORARILY_CLOSED', 'WEATHER_DELAY');

-- CreateEnum
CREATE TYPE "public"."TripStatus" AS ENUM ('DRAFT', 'PLANNED', 'LIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."ThrillTolerance" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."WalkingTolerance" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."ItineraryItemType" AS ENUM ('RIDE', 'SHOW', 'DINING', 'BREAK');

-- CreateEnum
CREATE TYPE "public"."ItineraryItemStatus" AS ENUM ('PLANNED', 'COMPLETED', 'SKIPPED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "googleId" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "firstName" TEXT,
    "lastName" TEXT,
    "name" TEXT,
    "authProvider" "public"."AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "onboardingStatus" "public"."OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "onboardingCurrentStep" INTEGER NOT NULL DEFAULT 0,
    "onboardingStartedAt" TIMESTAMP(3),
    "onboardingCompletedAt" TIMESTAMP(3),
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredAdventureTypes" TEXT[],
    "typicalGroupSize" TEXT,
    "childrenAgeProfile" TEXT,
    "dietaryPreferences" TEXT[],
    "dietaryNotes" TEXT,
    "accessibilityNeeds" TEXT[],
    "accessibilityNotes" TEXT,
    "planningPriorities" TEXT[],
    "planningStyle" TEXT,
    "budgetPreference" TEXT,
    "travelDistancePreference" TEXT,
    "planningHelpLevel" TEXT,
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Park" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resort" TEXT NOT NULL,
    "description" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "opensAt" TEXT NOT NULL,
    "closesAt" TEXT NOT NULL,

    CONSTRAINT "Park_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attraction" (
    "id" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "public"."AttractionCategory" NOT NULL,
    "zone" TEXT NOT NULL,
    "description" TEXT,
    "thrillLevel" INTEGER NOT NULL,
    "minHeight" INTEGER,
    "kidFriendly" BOOLEAN NOT NULL DEFAULT false,
    "indoor" BOOLEAN NOT NULL DEFAULT false,
    "familyFriendly" BOOLEAN NOT NULL DEFAULT false,
    "durationMinutes" INTEGER NOT NULL,
    "xCoord" INTEGER NOT NULL,
    "yCoord" INTEGER NOT NULL,
    "tags" TEXT[],
    "typicalWaitProfile" JSONB NOT NULL,
    "status" "public"."AttractionOperationalStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Trip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parkId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."TripStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "simulatedTime" TIMESTAMP(3),
    "currentLocationAttractionId" TEXT,
    "latestPlanSummary" TEXT,
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PartyProfile" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL,
    "kidsAges" INTEGER[],
    "thrillTolerance" "public"."ThrillTolerance" NOT NULL,
    "walkingTolerance" "public"."WalkingTolerance" NOT NULL,
    "preferredRideTypes" TEXT[],
    "mustDoRideIds" TEXT[],
    "diningPreferences" TEXT[],
    "startTime" TEXT NOT NULL,
    "breakStart" TEXT,
    "breakEnd" TEXT,

    CONSTRAINT "PartyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TripCollaborator" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItineraryItem" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "attractionId" TEXT,
    "title" TEXT NOT NULL,
    "type" "public"."ItineraryItemType" NOT NULL,
    "order" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "arrivalWindowStart" TIMESTAMP(3) NOT NULL,
    "arrivalWindowEnd" TIMESTAMP(3) NOT NULL,
    "predictedWaitMinutes" INTEGER NOT NULL,
    "walkingMinutes" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "status" "public"."ItineraryItemStatus" NOT NULL DEFAULT 'PLANNED',
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "ItineraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ParkStateSnapshot" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "parkId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTime" TIMESTAMP(3) NOT NULL,
    "weather" JSONB NOT NULL,
    "alerts" JSONB NOT NULL,
    "waitTimes" JSONB NOT NULL,
    "scenarioKey" TEXT,

    CONSTRAINT "ParkStateSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "public"."User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "public"."UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_email_key" ON "public"."EmailVerificationToken"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "public"."EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "public"."EmailVerificationToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "public"."Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Park_slug_key" ON "public"."Park"("slug");

-- CreateIndex
CREATE INDEX "Attraction_parkId_category_idx" ON "public"."Attraction"("parkId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Attraction_parkId_slug_key" ON "public"."Attraction"("parkId", "slug");

-- CreateIndex
CREATE INDEX "Trip_userId_visitDate_idx" ON "public"."Trip"("userId", "visitDate");

-- CreateIndex
CREATE INDEX "Trip_parkId_status_idx" ON "public"."Trip"("parkId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PartyProfile_tripId_key" ON "public"."PartyProfile"("tripId");

-- CreateIndex
CREATE INDEX "TripCollaborator_userId_idx" ON "public"."TripCollaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TripCollaborator_tripId_userId_key" ON "public"."TripCollaborator"("tripId", "userId");

-- CreateIndex
CREATE INDEX "ItineraryItem_tripId_status_idx" ON "public"."ItineraryItem"("tripId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryItem_tripId_order_key" ON "public"."ItineraryItem"("tripId", "order");

-- CreateIndex
CREATE INDEX "ParkStateSnapshot_tripId_effectiveTime_idx" ON "public"."ParkStateSnapshot"("tripId", "effectiveTime");

-- CreateIndex
CREATE INDEX "ParkStateSnapshot_parkId_effectiveTime_idx" ON "public"."ParkStateSnapshot"("parkId", "effectiveTime");

-- AddForeignKey
ALTER TABLE "public"."UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attraction" ADD CONSTRAINT "Attraction_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "public"."Park"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trip" ADD CONSTRAINT "Trip_currentLocationAttractionId_fkey" FOREIGN KEY ("currentLocationAttractionId") REFERENCES "public"."Attraction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trip" ADD CONSTRAINT "Trip_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "public"."Park"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartyProfile" ADD CONSTRAINT "PartyProfile_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TripCollaborator" ADD CONSTRAINT "TripCollaborator_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TripCollaborator" ADD CONSTRAINT "TripCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItineraryItem" ADD CONSTRAINT "ItineraryItem_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "public"."Attraction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItineraryItem" ADD CONSTRAINT "ItineraryItem_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParkStateSnapshot" ADD CONSTRAINT "ParkStateSnapshot_parkId_fkey" FOREIGN KEY ("parkId") REFERENCES "public"."Park"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParkStateSnapshot" ADD CONSTRAINT "ParkStateSnapshot_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

