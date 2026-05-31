ALTER TABLE "bets" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bets" ADD COLUMN "previous_state" jsonb;--> statement-breakpoint
UPDATE "bets" SET "description" = NULL WHERE "description" = '-';