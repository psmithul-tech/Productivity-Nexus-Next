CREATE TABLE "diet_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"target_calories" integer DEFAULT 2000 NOT NULL,
	"target_protein" integer DEFAULT 150 NOT NULL,
	"target_carbs" integer DEFAULT 200 NOT NULL,
	"target_fat" integer DEFAULT 65 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"meal_type" text NOT NULL,
	"food_items" text,
	"calories" integer DEFAULT 0 NOT NULL,
	"protein" integer DEFAULT 0 NOT NULL,
	"carbs" integer DEFAULT 0 NOT NULL,
	"fat" integer DEFAULT 0 NOT NULL,
	"image_url" text,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);