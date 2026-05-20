ALTER TABLE "bets" DROP COLUMN IF EXISTS "image_slug";--> statement-breakpoint
ALTER TABLE "bets" ADD COLUMN "icon_slug" text;--> statement-breakpoint
ALTER TABLE "bets" ADD COLUMN "icon_color" text;
