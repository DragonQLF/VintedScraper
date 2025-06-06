/*
  Warnings:

  - You are about to drop the column `price` on the `Action` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Action` table. All the data in the column will be lost.
  - You are about to drop the column `matchedAt` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `Notification` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[listingId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accessCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `matchId` on table `Notification` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `accessCode` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Action` DROP FOREIGN KEY `Action_matchId_fkey`;

-- DropForeignKey
ALTER TABLE `Match` DROP FOREIGN KEY `Match_searchProfileId_fkey`;

-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_matchId_fkey`;

-- DropIndex
DROP INDEX `Match_listingId_searchProfileId_key` ON `Match`;

-- AlterTable
ALTER TABLE `Action` DROP COLUMN `price`,
    DROP COLUMN `status`;

-- AlterTable
ALTER TABLE `Match` DROP COLUMN `matchedAt`,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'NEW',
    MODIFY `likes` INTEGER NULL;

-- AlterTable
ALTER TABLE `Notification` DROP COLUMN `details`,
    MODIFY `matchId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `accessCode` VARCHAR(191) NOT NULL,
    ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `AccessCode` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `usedByAccessCode` VARCHAR(191) NULL,

    UNIQUE INDEX `AccessCode_code_key`(`code`),
    UNIQUE INDEX `AccessCode_usedByAccessCode_key`(`usedByAccessCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Match_listingId_key` ON `Match`(`listingId`);

-- CreateIndex
CREATE UNIQUE INDEX `User_accessCode_key` ON `User`(`accessCode`);

-- AddForeignKey
ALTER TABLE `AccessCode` ADD CONSTRAINT `AccessCode_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccessCode` ADD CONSTRAINT `AccessCode_usedByAccessCode_fkey` FOREIGN KEY (`usedByAccessCode`) REFERENCES `User`(`accessCode`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_searchProfileId_fkey` FOREIGN KEY (`searchProfileId`) REFERENCES `SearchProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Action` ADD CONSTRAINT `Action_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
