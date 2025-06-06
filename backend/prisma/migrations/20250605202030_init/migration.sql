/*
  Warnings:

  - You are about to drop the column `accessCode` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AccessCode` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[listingId,searchProfileId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `status` to the `Action` table without a default value. This is not possible if the table is not empty.
  - Made the column `likes` on table `Match` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `AccessCode` DROP FOREIGN KEY `AccessCode_createdBy_fkey`;

-- DropForeignKey
ALTER TABLE `AccessCode` DROP FOREIGN KEY `AccessCode_usedByAccessCode_fkey`;

-- DropForeignKey
ALTER TABLE `Action` DROP FOREIGN KEY `Action_matchId_fkey`;

-- DropForeignKey
ALTER TABLE `Match` DROP FOREIGN KEY `Match_searchProfileId_fkey`;

-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_matchId_fkey`;

-- DropIndex
DROP INDEX `Match_listingId_key` ON `Match`;

-- DropIndex
DROP INDEX `User_accessCode_key` ON `User`;

-- AlterTable
ALTER TABLE `Action` ADD COLUMN `price` DOUBLE NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Match` ADD COLUMN `matchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'available',
    MODIFY `likes` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `details` VARCHAR(191) NULL,
    MODIFY `matchId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `accessCode`,
    DROP COLUMN `isAdmin`;

-- DropTable
DROP TABLE `AccessCode`;

-- CreateIndex
CREATE UNIQUE INDEX `Match_listingId_searchProfileId_key` ON `Match`(`listingId`, `searchProfileId`);

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_searchProfileId_fkey` FOREIGN KEY (`searchProfileId`) REFERENCES `SearchProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Action` ADD CONSTRAINT `Action_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
