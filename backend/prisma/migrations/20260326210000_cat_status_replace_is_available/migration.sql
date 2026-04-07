-- Cat: replace legacy is_available (boolean) with status (CatStatus enum), aligned with schema.prisma

-- CreateEnum
CREATE TYPE "CatStatus" AS ENUM ('available', 'adopted', 'unavailable');

-- AlterTable
ALTER TABLE "cats" ADD COLUMN "status" "CatStatus" NOT NULL DEFAULT 'available';

-- Backfill from boolean: true -> available, false -> unavailable
UPDATE "cats"
SET "status" = CASE
  WHEN "is_available" = true THEN 'available'::"CatStatus"
  ELSE 'unavailable'::"CatStatus"
END;

ALTER TABLE "cats" DROP COLUMN "is_available";
