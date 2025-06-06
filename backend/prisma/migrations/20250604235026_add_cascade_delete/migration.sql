-- DropForeignKey
ALTER TABLE `Action` DROP FOREIGN KEY `Action_matchId_fkey`;

-- DropForeignKey
ALTER TABLE `AutoAction` DROP FOREIGN KEY `AutoAction_searchProfileId_fkey`;

-- DropForeignKey
ALTER TABLE `Match` DROP FOREIGN KEY `Match_searchProfileId_fkey`;

-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_matchId_fkey`;

-- AddForeignKey
ALTER TABLE `AutoAction` ADD CONSTRAINT `AutoAction_searchProfileId_fkey` FOREIGN KEY (`searchProfileId`) REFERENCES `SearchProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_searchProfileId_fkey` FOREIGN KEY (`searchProfileId`) REFERENCES `SearchProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Action` ADD CONSTRAINT `Action_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
