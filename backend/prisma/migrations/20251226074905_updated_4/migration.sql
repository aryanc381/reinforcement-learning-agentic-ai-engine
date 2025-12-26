/*
  Warnings:

  - Changed the type of `vec_id` on the `KB` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "KB" DROP COLUMN "vec_id",
ADD COLUMN     "vec_id" INTEGER NOT NULL;
