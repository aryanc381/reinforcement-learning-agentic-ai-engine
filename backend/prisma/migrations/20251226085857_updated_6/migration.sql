/*
  Warnings:

  - A unique constraint covering the columns `[category,useCase]` on the table `KB` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "KB_category_useCase_key" ON "KB"("category", "useCase");
