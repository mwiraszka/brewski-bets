ALTER TABLE "bets" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bets" ADD COLUMN IF NOT EXISTS "previous_state" jsonb;