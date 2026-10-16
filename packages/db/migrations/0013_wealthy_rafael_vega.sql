ALTER TABLE `characters` ADD `likes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `characters` ADD `dislikes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `characters` ADD `response_style` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `characters` ADD `eagerness` integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `characters` ADD `voice_id` text;--> statement-breakpoint
ALTER TABLE `turns` ADD `cast_json` text;--> statement-breakpoint
ALTER TABLE `worlds` ADD `narrator_prompt` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `worlds` ADD `narrator_voice_id` text;--> statement-breakpoint
ALTER TABLE `worlds` ADD `ensemble_enabled` integer DEFAULT false NOT NULL;