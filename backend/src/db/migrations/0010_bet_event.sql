ALTER TABLE "bets" ADD COLUMN "event" text;--> statement-breakpoint
UPDATE "bets" SET "event" = '2026 FIFA World Cup';--> statement-breakpoint
UPDATE "bets" SET "previous_state" = jsonb_set("previous_state", '{event}', to_jsonb("event")) WHERE "previous_state" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "bets" ALTER COLUMN "event" SET NOT NULL;
