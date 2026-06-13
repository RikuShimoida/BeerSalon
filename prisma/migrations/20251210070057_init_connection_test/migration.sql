-- CreateTable
CREATE TABLE "connection_test" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connection_test_pkey" PRIMARY KEY ("id")
);
