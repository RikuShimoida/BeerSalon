-- Drop old foreign keys from beers table if they exist
ALTER TABLE "beers" DROP CONSTRAINT IF EXISTS "beers_origin_id_fkey";

-- Drop the origins table (rename to regions)
DROP TABLE IF EXISTS "origins" CASCADE;

-- Regions table already exists from previous attempt, so we don't recreate it
-- Countries table already exists from previous attempt

-- Drop region_id column from beers if it exists (from previous failed migration)
ALTER TABLE "beers" DROP COLUMN IF EXISTS "region_id";

-- Add region_id column to beers table
ALTER TABLE "beers" ADD COLUMN "region_id" BIGINT;

-- AddForeignKey
ALTER TABLE "beers" ADD CONSTRAINT "beers_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Modify breweries table: drop country and region columns if they exist, add region_id
ALTER TABLE "breweries" DROP COLUMN IF EXISTS "country";
ALTER TABLE "breweries" DROP COLUMN IF EXISTS "region";
ALTER TABLE "breweries" DROP COLUMN IF EXISTS "region_id";
ALTER TABLE "breweries" ADD COLUMN "region_id" BIGINT;

-- AddForeignKey
ALTER TABLE "breweries" ADD CONSTRAINT "breweries_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
