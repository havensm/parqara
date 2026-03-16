CREATE TABLE "UserContactInvite" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserContactInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserContactInvite_ownerUserId_email_key" ON "UserContactInvite"("ownerUserId", "email");
CREATE INDEX "UserContactInvite_email_idx" ON "UserContactInvite"("email");

ALTER TABLE "UserContactInvite"
ADD CONSTRAINT "UserContactInvite_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
