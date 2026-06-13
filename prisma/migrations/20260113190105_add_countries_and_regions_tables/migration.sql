-- Drop old foreign keys from beers table if they exist
ALTER TABLE "beers" DROP CONSTRAINT IF EXISTS "beers_origin_id_fkey";

-- Drop the origins table (rename to regions)
DROP TABLE IF EXISTS "origins" CASCADE;

-- Create countries table
CREATE TABLE IF NOT EXISTS "countries" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "countries_name_key" ON "countries"("name");

-- Create regions table
CREATE TABLE IF NOT EXISTS "regions" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "country_id" BIGINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "regions_country_id_name_key" ON "regions"("country_id", "name");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
