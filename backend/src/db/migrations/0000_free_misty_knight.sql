CREATE TYPE "public"."bet_outcome" AS ENUM('user1_win', 'user2_win', 'draw', 'open', 'void');--> statement-breakpoint
CREATE TYPE "public"."bet_status" AS ENUM('pending', 'active', 'complete');--> statement-breakpoint
CREATE TABLE "bets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"user1_id" uuid NOT NULL,
	"user2_id" uuid NOT NULL,
	"user1_wager_brewskis" integer NOT NULL,
	"user1_wager_brewski_type" text NOT NULL,
	"user2_wager_brewskis" integer NOT NULL,
	"user2_wager_brewski_type" text NOT NULL,
	"status" "bet_status" DEFAULT 'pending' NOT NULL,
	"outcome" "bet_outcome" DEFAULT 'open' NOT NULL,
	"created_date" timestamp with time zone DEFAULT now() NOT NULL,
	"last_modified_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"last_modified_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"avatar_original_url" text,
	"created_date" timestamp with time zone DEFAULT now() NOT NULL,
	"last_modified_date" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_user1_id_users_id_fk" FOREIGN KEY ("user1_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_user2_id_users_id_fk" FOREIGN KEY ("user2_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;