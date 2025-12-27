-- CreateTable
CREATE TABLE "LB_Archive" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "useCase" TEXT NOT NULL,
    "qualities" TEXT[],
    "specs" TEXT[],
    "convRate" DOUBLE PRECISION NOT NULL,
    "outliers" TEXT[],
    "rationale" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LB_Archive_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LB_Archive" ADD CONSTRAINT "LB_Archive_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "KB"("id") ON DELETE CASCADE ON UPDATE CASCADE;
