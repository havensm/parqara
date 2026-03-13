ALTER TABLE "User" ADD COLUMN "isFirstTime" BOOLEAN;

UPDATE "User"
SET "isFirstTime" = false
WHERE "isFirstTime" IS NULL;

ALTER TABLE "User" ALTER COLUMN "isFirstTime" SET DEFAULT true;
ALTER TABLE "User" ALTER COLUMN "isFirstTime" SET NOT NULL;
