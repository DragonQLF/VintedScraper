/*
  Warnings:

  - You are about to drop the column `minRating` on the `SearchProfile` table. All the data in the column will be lost.
  - You are about to drop the column `searchType` on the `SearchProfile` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `SearchProfile` table. All the data in the column will be lost.
  - Made the column `keywords` on table `SearchProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `SearchProfile` DROP COLUMN `minRating`,
    DROP COLUMN `searchType`,
    DROP COLUMN `tags`,
    ADD COLUMN `catalog` VARCHAR(191) NULL,
    ADD COLUMN `catalogId` VARCHAR(191) NULL,
    ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `clothingSize` VARCHAR(191) NULL,
    ADD COLUMN `clothingType` VARCHAR(191) NULL,
    ADD COLUMN `color` VARCHAR(191) NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `material` VARCHAR(191) NULL,
    ADD COLUMN `pattern` VARCHAR(191) NULL,
    ADD COLUMN `season` VARCHAR(191) NULL,
    ADD COLUMN `shippingCountry` VARCHAR(191) NULL,
    ADD COLUMN `shoeSize` VARCHAR(191) NULL,
    ADD COLUMN `shoeSizeSystem` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    ADD COLUMN `style` VARCHAR(191) NULL,
    ADD COLUMN `subcategory` VARCHAR(191) NULL,
    MODIFY `keywords` VARCHAR(191) NOT NULL;
