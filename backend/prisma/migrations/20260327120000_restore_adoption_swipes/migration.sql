-- Restore adoption_swipes for Member 2 swipe/feed (removed in 20260326152118_latest_migration_main)

CREATE TABLE "adoption_swipes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cat_id" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adoption_swipes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "adoption_swipes_user_id_cat_id_key" ON "adoption_swipes"("user_id", "cat_id");

ALTER TABLE "adoption_swipes" ADD CONSTRAINT "adoption_swipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "adoption_swipes" ADD CONSTRAINT "adoption_swipes_cat_id_fkey" FOREIGN KEY ("cat_id") REFERENCES "cats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
