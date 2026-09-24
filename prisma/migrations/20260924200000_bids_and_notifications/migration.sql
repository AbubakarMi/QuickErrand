-- Multi-runner bidding replaces the single back-and-forth offer on a task,
-- and notifications become stored events.

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('OPEN', 'AWARDED', 'NOT_AWARDED');

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "counterPrice" INTEGER,
    "status" "BidStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taskId" TEXT NOT NULL,
    "runnerId" TEXT NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bid_taskId_idx" ON "Bid"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_taskId_runnerId_key" ON "Bid"("taskId", "runnerId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_runnerId_fkey" FOREIGN KEY ("runnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Carry over any live offer on an open errand as that runner's bid, so
-- nothing already in flight is lost when the old columns go.
INSERT INTO "Bid" ("id", "price", "status", "createdAt", "updatedAt", "taskId", "runnerId")
SELECT 'c' || substr(md5(random()::text || "id"), 1, 24),
       "negotiatedPrice", 'OPEN', "updatedAt", "updatedAt", "id", "negotiatedByRunnerId"
FROM "Task"
WHERE "status" = 'PENDING'
  AND "negotiatedPrice" IS NOT NULL
  AND "negotiatedByRunnerId" IS NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "negotiatedPrice",
DROP COLUMN "negotiatedByRunnerId",
DROP COLUMN "offerBy",
DROP COLUMN "offerAgreedAt";

-- DropEnum
DROP TYPE "OfferSide";
