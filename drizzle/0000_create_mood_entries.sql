CREATE TYPE "public"."mood" AS ENUM('Sparkly', 'Cozy', 'Tired', 'Sad', 'Frustrated');--> statement-breakpoint
CREATE TABLE "mood_entries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mood_entries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"entry_date" date NOT NULL,
	"mood" "mood" NOT NULL,
	"energy" smallint NOT NULL,
	"nudge" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mood_entries_entry_date_unique" UNIQUE("entry_date"),
	CONSTRAINT "energy_range" CHECK ("mood_entries"."energy" BETWEEN 1 AND 5)
);
