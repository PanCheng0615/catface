-- Align adopter_preferences with schema: preferred_color (used by POST /api/adoption/preferences)
ALTER TABLE "adopter_preferences" ADD COLUMN "preferred_color" TEXT;
