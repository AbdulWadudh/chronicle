CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by` text
);
