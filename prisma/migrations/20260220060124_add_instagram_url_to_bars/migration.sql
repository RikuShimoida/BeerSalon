-- AlterTable
ALTER TABLE "bars" ADD COLUMN     "instagram_url" TEXT;

-- CreateTable
CREATE TABLE "bar_opening_hours" (
    "id" BIGSERIAL NOT NULL,
    "bar_id" BIGINT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "open_time" TIME(6) NOT NULL,
    "close_time" TIME(6) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bar_opening_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bar_opening_hours_bar_id_day_of_week_idx" ON "bar_opening_hours"("bar_id", "day_of_week");

-- AddForeignKey
ALTER TABLE "bar_opening_hours" ADD CONSTRAINT "bar_opening_hours_bar_id_fkey" FOREIGN KEY ("bar_id") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
