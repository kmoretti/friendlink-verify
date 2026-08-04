CREATE TABLE `configs` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`avatar` text DEFAULT '' NOT NULL,
	`friendslink` text DEFAULT '' NOT NULL,
	`siteshot` text DEFAULT '' NOT NULL,
	`topimg` text DEFAULT '' NOT NULL,
	`feeds` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`type` text DEFAULT 'apply' NOT NULL,
	`original_url` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`processing_token` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `submissions_status_created_idx` ON `submissions` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `submissions_name_idx` ON `submissions` (`name`);