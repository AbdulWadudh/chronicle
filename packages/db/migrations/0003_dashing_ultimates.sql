CREATE TABLE `theme_palettes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`blurb` text NOT NULL,
	`overrides_json` text NOT NULL,
	`built_in` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'user' NOT NULL;