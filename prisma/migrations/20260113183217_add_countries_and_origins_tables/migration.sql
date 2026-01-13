-- CreateTable: countries
CREATE TABLE "countries" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable: origins
CREATE TABLE "origins" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "country_id" BIGINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "origins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "origins_country_id_name_key" ON "origins"("country_id", "name");

-- AddForeignKey
ALTER TABLE "origins" ADD CONSTRAINT "origins_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate existing data from beers.origin to countries and origins tables
-- Step 1: Extract unique countries from beers.origin
INSERT INTO "countries" ("name")
SELECT DISTINCT
    CASE
        WHEN "origin" LIKE '%/%' THEN split_part("origin", '/', 1)
        ELSE "origin"
    END as country_name
FROM "beers"
WHERE "origin" IS NOT NULL
ON CONFLICT ("name") DO NOTHING;

-- Step 2: Extract unique origins (country + region combinations)
INSERT INTO "origins" ("name", "country_id")
SELECT DISTINCT
    CASE
        WHEN "origin" LIKE '%/%' THEN split_part("origin", '/', 2)
        ELSE ''
    END as region_name,
    c.id as country_id
FROM "beers" b
INNER JOIN "countries" c ON (
    CASE
        WHEN b."origin" LIKE '%/%' THEN split_part(b."origin", '/', 1)
        ELSE b."origin"
    END = c."name"
)
WHERE b."origin" IS NOT NULL
    AND CASE
        WHEN b."origin" LIKE '%/%' THEN split_part(b."origin", '/', 2)
        ELSE ''
    END != ''
ON CONFLICT ("country_id", "name") DO NOTHING;

-- Step 3: Add origin_id column to beers table
ALTER TABLE "beers" ADD COLUMN "origin_id" BIGINT;

-- Step 4: Update beers.origin_id based on beers.origin
UPDATE "beers" b
SET "origin_id" = o.id
FROM "origins" o
INNER JOIN "countries" c ON o."country_id" = c.id
WHERE b."origin" IS NOT NULL
    AND b."origin" LIKE '%/%'
    AND split_part(b."origin", '/', 1) = c."name"
    AND split_part(b."origin", '/', 2) = o."name";

-- Step 5: Drop the old origin column
ALTER TABLE "beers" DROP COLUMN "origin";

-- AddForeignKey
ALTER TABLE "beers" ADD CONSTRAINT "beers_origin_id_fkey" FOREIGN KEY ("origin_id") REFERENCES "origins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
