/*
  Warnings:

  - The `vec_id` column on the `KB` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "KB" DROP COLUMN "vec_id",
ADD COLUMN     "vec_id" INTEGER[];
