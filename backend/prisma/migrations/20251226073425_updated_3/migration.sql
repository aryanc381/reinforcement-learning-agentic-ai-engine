/*
  Warnings:

  - The `specs` column on the `KB` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "KB" DROP COLUMN "specs",
ADD COLUMN     "specs" TEXT[];
