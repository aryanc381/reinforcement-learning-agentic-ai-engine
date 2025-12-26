-- CreateTable
CREATE TABLE "KB" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "useCase" TEXT NOT NULL,
    "qualities" TEXT NOT NULL,
    "specs" TEXT NOT NULL,
    "convRate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "KB_pkey" PRIMARY KEY ("id")
);
