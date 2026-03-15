-- Add a saved starting location so the planner can render a trip origin map.
ALTER TABLE "Trip"
ADD COLUMN "startingLocation" TEXT;
