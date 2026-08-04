CREATE TABLE `configs` (
	`key` varchar(191) NOT NULL,
	`value` text NOT NULL,
	CONSTRAINT `configs_key` PRIMARY KEY(`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`description` text NOT NULL DEFAULT (''),
	`avatar` text NOT NULL DEFAULT (''),
	`friendslink` text NOT NULL DEFAULT (''),
	`siteshot` text NOT NULL DEFAULT (''),
	`topimg` text NOT NULL DEFAULT (''),
	`feeds` text NOT NULL DEFAULT (''),
	`email` text NOT NULL DEFAULT (''),
	`type` varchar(16) NOT NULL DEFAULT 'apply',
	`original_url` text NOT NULL DEFAULT (''),
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`processing_token` varchar(64),
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
--> statement-breakpoint
CREATE INDEX `submissions_status_created_idx` ON `submissions` (`status`,`created_at`);