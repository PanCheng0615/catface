/*
  Warnings:

  - The values [unavailable] on the enum `CatStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `gender` column on the `cats` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `adoption_swipes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[face_code]` on the table `cats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `clinic_health_reports` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `report_type` on the `clinic_health_reports` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `record_type` on the `owner_health_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CatGender" AS ENUM ('male', 'female', 'unknown');

-- CreateEnum
CREATE TYPE "HealthRecordType" AS ENUM ('vaccine', 'deworming', 'checkup', 'treatment', 'surgery', 'other');

-- CreateEnum
CREATE TYPE "ClinicReportType" AS ENUM ('vaccination', 'deworming', 'checkup', 'blood_test', 'treatment', 'surgery', 'other');

-- AlterEnum
BEGIN;
CREATE TYPE "CatStatus_new" AS ENUM ('available', 'adopted', 'fostered', 'deceased');
ALTER TABLE "cats" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "cats" ALTER COLUMN "status" TYPE "CatStatus_new" USING ("status"::text::"CatStatus_new");
ALTER TYPE "CatStatus" RENAME TO "CatStatus_old";
ALTER TYPE "CatStatus_new" RENAME TO "CatStatus";
DROP TYPE "CatStatus_old";
ALTER TABLE "cats" ALTER COLUMN "status" SET DEFAULT 'available';
COMMIT;

-- DropForeignKey
ALTER TABLE "adoption_swipes" DROP CONSTRAINT "adoption_swipes_cat_id_fkey";

-- DropForeignKey
ALTER TABLE "adoption_swipes" DROP CONSTRAINT "adoption_swipes_user_id_fkey";

-- AlterTable
ALTER TABLE "adopter_preferences" ADD COLUMN     "accept_special_need" BOOLEAN,
ADD COLUMN     "has_children" BOOLEAN,
ADD COLUMN     "has_other_pets" BOOLEAN,
ADD COLUMN     "home_type" TEXT;

-- AlterTable
ALTER TABLE "adoption_applications" ADD COLUMN     "event_id" TEXT,
ADD COLUMN     "reject_note" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by" TEXT;

-- AlterTable
ALTER TABLE "cats" ADD COLUMN     "event_id" TEXT,
ADD COLUMN     "face_code" TEXT,
ADD COLUMN     "found_location" TEXT,
ADD COLUMN     "intake_date" TIMESTAMP(3),
ADD COLUMN     "is_dewormed" BOOLEAN,
ADD COLUMN     "is_neutered" BOOLEAN,
ADD COLUMN     "is_vaccinated" BOOLEAN,
DROP COLUMN "gender",
ADD COLUMN     "gender" "CatGender";

-- AlterTable
ALTER TABLE "clinic_health_reports" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "report_type",
ADD COLUMN     "report_type" "ClinicReportType" NOT NULL;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "license_number" TEXT;

-- AlterTable
ALTER TABLE "owner_health_records" ADD COLUMN     "clinic_name" TEXT,
ADD COLUMN     "next_due_date" TIMESTAMP(3),
ADD COLUMN     "vet_name" TEXT,
ADD COLUMN     "weight_kg" DOUBLE PRECISION,
DROP COLUMN "record_type",
ADD COLUMN     "record_type" "HealthRecordType" NOT NULL;

-- DropTable
DROP TABLE "adoption_swipes";

-- CreateTable
CREATE TABLE "adoption_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "edition" INTEGER,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "location" TEXT,
    "description" TEXT,
    "org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adoption_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_face_embeddings" (
    "id" TEXT NOT NULL,
    "cat_id" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "model_version" TEXT NOT NULL DEFAULT 'v1.0',
    "source_image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cat_face_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cat_face_embeddings_cat_id_key" ON "cat_face_embeddings"("cat_id");

-- CreateIndex
CREATE UNIQUE INDEX "cats_face_code_key" ON "cats"("face_code");

-- AddForeignKey
ALTER TABLE "adoption_events" ADD CONSTRAINT "adoption_events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cats" ADD CONSTRAINT "cats_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "adoption_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_face_embeddings" ADD CONSTRAINT "cat_face_embeddings_cat_id_fkey" FOREIGN KEY ("cat_id") REFERENCES "cats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_applications" ADD CONSTRAINT "adoption_applications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "adoption_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_applications" ADD CONSTRAINT "adoption_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
