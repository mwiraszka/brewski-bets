ALTER TYPE "public"."bet_status" RENAME VALUE 'pending' TO 'inactive';--> statement-breakpoint
ALTER TYPE "public"."bet_status" RENAME VALUE 'complete' TO 'settled';--> statement-breakpoint
ALTER TABLE "bets" ALTER COLUMN "status" SET DEFAULT 'inactive';--> statement-breakpoint
ALTER TABLE "bets" ADD COLUMN "settlement_proposed" boolean DEFAULT false NOT NULL;
