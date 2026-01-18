/*
  Warnings:

  - You are about to drop the column `origin` on the `beers` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `breweries` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `breweries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "beers" DROP COLUMN "origin",
ADD COLUMN     "region_id" BIGINT;

-- AlterTable
ALTER TABLE "breweries" DROP COLUMN "country",
DROP COLUMN "region",
ADD COLUMN     "region_id" BIGINT;

-- CreateTable
CREATE TABLE "countries" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "country_id" BIGINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_likes" (
    "id" BIGSERIAL NOT NULL,
    "article_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "regions_country_id_name_key" ON "regions"("country_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "article_likes_article_id_user_id_key" ON "article_likes"("article_id", "user_id");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breweries" ADD CONSTRAINT "breweries_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beers" ADD CONSTRAINT "beers_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_likes" ADD CONSTRAINT "article_likes_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_likes" ADD CONSTRAINT "article_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
