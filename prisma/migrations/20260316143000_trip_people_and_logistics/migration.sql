CREATE TYPE "TripAccessRole" AS ENUM ('NONE', 'VIEW', 'EDIT');
CREATE TYPE "TripAttendanceStatus" AS ENUM ('INVITED', 'ATTENDING', 'MAYBE', 'NOT_ATTENDING');
CREATE TYPE "TripLogisticsCategory" AS ENUM ('DOCS', 'TRANSPORT', 'GEAR', 'TIME_OFF', 'LODGING', 'OTHER');
CREATE TYPE "TripLogisticsTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED');
CREATE TYPE "TripLogisticsTaskSource" AS ENUM ('MARA', 'MANUAL');

ALTER TABLE "TripCollaborator"
ADD COLUMN "accessRole" "TripAccessRole" NOT NULL DEFAULT 'EDIT';

CREATE TABLE "TripPerson" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "userId" TEXT,
  "invitedByUserId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "displayName" TEXT,
  "attendanceStatus" "TripAttendanceStatus" NOT NULL DEFAULT 'INVITED',
  "plannerAccessRole" "TripAccessRole" NOT NULL DEFAULT 'NONE',
  "inviteAcceptedAt" TIMESTAMP(3),
  "lastInvitedAt" TIMESTAMP(3),
  "lastRemindedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TripPerson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TripLogisticsTask" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "assigneePersonId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" "TripLogisticsCategory" NOT NULL,
  "status" "TripLogisticsTaskStatus" NOT NULL DEFAULT 'TODO',
  "source" "TripLogisticsTaskSource" NOT NULL DEFAULT 'MANUAL',
  "dueDate" TIMESTAMP(3),
  "note" TEXT,
  "reminderNote" TEXT,
  "lastRemindedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TripLogisticsTask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TripPerson_tripId_email_key" ON "TripPerson"("tripId", "email");
CREATE INDEX "TripPerson_userId_idx" ON "TripPerson"("userId");
CREATE INDEX "TripPerson_tripId_attendanceStatus_idx" ON "TripPerson"("tripId", "attendanceStatus");
CREATE INDEX "TripLogisticsTask_tripId_assigneePersonId_idx" ON "TripLogisticsTask"("tripId", "assigneePersonId");
CREATE INDEX "TripLogisticsTask_tripId_status_idx" ON "TripLogisticsTask"("tripId", "status");
CREATE INDEX "TripLogisticsTask_assigneePersonId_status_idx" ON "TripLogisticsTask"("assigneePersonId", "status");

ALTER TABLE "TripPerson"
ADD CONSTRAINT "TripPerson_tripId_fkey"
FOREIGN KEY ("tripId") REFERENCES "Trip"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripPerson"
ADD CONSTRAINT "TripPerson_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TripPerson"
ADD CONSTRAINT "TripPerson_invitedByUserId_fkey"
FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripLogisticsTask"
ADD CONSTRAINT "TripLogisticsTask_tripId_fkey"
FOREIGN KEY ("tripId") REFERENCES "Trip"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripLogisticsTask"
ADD CONSTRAINT "TripLogisticsTask_assigneePersonId_fkey"
FOREIGN KEY ("assigneePersonId") REFERENCES "TripPerson"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripLogisticsTask"
ADD CONSTRAINT "TripLogisticsTask_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
