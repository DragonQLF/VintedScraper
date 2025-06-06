/*
  Warnings:

  - You are about to drop the column `brand` on the `SearchProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `SearchProfile` DROP COLUMN `brand`,
    ADD COLUMN `brandId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Brand` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SearchProfile` ADD CONSTRAINT `SearchProfile_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
