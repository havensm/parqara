ALTER TABLE "public"."Trip"
ADD COLUMN "liveSnapshot" JSONB,
ADD COLUMN "liveSnapshotUpdatedAt" TIMESTAMP(3);

CREATE TABLE "public"."TripLiveSnapshotRevision" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "label" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TripLiveSnapshotRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TripLiveSnapshotRevision_tripId_createdAt_idx" ON "public"."TripLiveSnapshotRevision"("tripId", "createdAt");
CREATE INDEX "TripLiveSnapshotRevision_createdByUserId_createdAt_idx" ON "public"."TripLiveSnapshotRevision"("createdByUserId", "createdAt");

ALTER TABLE "public"."TripLiveSnapshotRevision"
ADD CONSTRAINT "TripLiveSnapshotRevision_tripId_fkey"
FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."TripLiveSnapshotRevision"
ADD CONSTRAINT "TripLiveSnapshotRevision_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
