-- AlterTable
ALTER TABLE `SearchProfile` ADD COLUMN `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM';

-- RenameIndex
ALTER TABLE `SearchProfile` RENAME INDEX `SearchProfile_brandId_fkey` TO `SearchProfile_brandId_idx`;

-- RenameIndex
ALTER TABLE `SearchProfile` RENAME INDEX `SearchProfile_userId_fkey` TO `SearchProfile_userId_idx`;
