-- Friendships
CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted');--> statement-breakpoint

CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"addressee_id" uuid NOT NULL,
	"status" "friendship_status" DEFAULT 'pending' NOT NULL,
	"created_date" timestamp with time zone DEFAULT now() NOT NULL,
	"last_modified_date" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friendships_requester_id_addressee_id_unique" UNIQUE("requester_id","addressee_id")
);--> statement-breakpoint

ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;--> statement-breakpoint

-- Bets: new enums
CREATE TYPE "public"."bet_action" AS ENUM('user1', 'user2');--> statement-breakpoint

-- Bets: add new columns
ALTER TABLE "bets" ADD COLUMN "image_slug" text;--> statement-breakpoint
ALTER TABLE "bets" ADD COLUMN "results" jsonb NOT NULL DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "bets" ADD COLUMN "selected_result_index" integer;--> statement-breakpoint
ALTER TABLE "bets" ADD COLUMN "pending_action" "bet_action";--> statement-breakpoint

-- Bets: drop old wager columns
ALTER TABLE "bets" DROP COLUMN IF EXISTS "user1_wager_brewskis";--> statement-breakpoint
ALTER TABLE "bets" DROP COLUMN IF EXISTS "user1_wager_brewski_type";--> statement-breakpoint
ALTER TABLE "bets" DROP COLUMN IF EXISTS "user2_wager_brewskis";--> statement-breakpoint
ALTER TABLE "bets" DROP COLUMN IF EXISTS "user2_wager_brewski_type";--> statement-breakpoint

-- Bets: update outcome enum values
ALTER TABLE "bets" ALTER COLUMN "outcome" DROP DEFAULT;--> statement-breakpoint
ALTER TYPE "public"."bet_outcome" RENAME TO "bet_outcome_old";--> statement-breakpoint
CREATE TYPE "public"."bet_outcome" AS ENUM('open', 'resolved', 'void');--> statement-breakpoint
ALTER TABLE "bets" ALTER COLUMN "outcome" TYPE "public"."bet_outcome" USING (CASE "outcome"::text WHEN 'open' THEN 'open' WHEN 'void' THEN 'void' ELSE 'resolved' END)::"public"."bet_outcome";--> statement-breakpoint
DROP TYPE "public"."bet_outcome_old";--> statement-breakpoint
ALTER TABLE "bets" ALTER COLUMN "outcome" SET DEFAULT 'open';
