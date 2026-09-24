-- CreateEnum
CREATE TYPE "OfferSide" AS ENUM ('RUNNER', 'POSTER');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "offerBy" "OfferSide";
