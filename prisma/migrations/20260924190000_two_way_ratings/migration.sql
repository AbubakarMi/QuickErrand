-- One errand can now carry two ratings, one from each side, so the
-- one-rating-per-task index becomes one-per-rater-per-task.

-- DropIndex
DROP INDEX "Rating_taskId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Rating_taskId_ratedById_key" ON "Rating"("taskId", "ratedById");

-- CreateIndex
CREATE INDEX "Rating_ratedUserId_idx" ON "Rating"("ratedUserId");
