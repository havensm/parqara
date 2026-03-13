CREATE TABLE "UserContact" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "contactUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TripCollaboratorInvite" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "invitedByUserId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TripCollaboratorInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserContact_ownerUserId_contactUserId_key" ON "UserContact"("ownerUserId", "contactUserId");
CREATE INDEX "UserContact_contactUserId_idx" ON "UserContact"("contactUserId");

CREATE UNIQUE INDEX "TripCollaboratorInvite_tripId_email_key" ON "TripCollaboratorInvite"("tripId", "email");
CREATE INDEX "TripCollaboratorInvite_email_idx" ON "TripCollaboratorInvite"("email");

ALTER TABLE "UserContact"
ADD CONSTRAINT "UserContact_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserContact"
ADD CONSTRAINT "UserContact_contactUserId_fkey"
FOREIGN KEY ("contactUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripCollaboratorInvite"
ADD CONSTRAINT "TripCollaboratorInvite_tripId_fkey"
FOREIGN KEY ("tripId") REFERENCES "Trip"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripCollaboratorInvite"
ADD CONSTRAINT "TripCollaboratorInvite_invitedByUserId_fkey"
FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
