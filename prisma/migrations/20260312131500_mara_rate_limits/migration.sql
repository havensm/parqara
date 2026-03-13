CREATE TABLE "MaraRequestLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MaraRequestLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MaraRequestLog_userId_createdAt_idx" ON "MaraRequestLog"("userId", "createdAt");

ALTER TABLE "MaraRequestLog"
ADD CONSTRAINT "MaraRequestLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
