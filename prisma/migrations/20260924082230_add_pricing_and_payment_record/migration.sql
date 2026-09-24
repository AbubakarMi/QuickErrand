/*
  Warnings:

  - Added the required column `paymentMethod` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "negotiatedByRunnerId" TEXT,
ADD COLUMN     "negotiatedPrice" INTEGER,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL,
ADD COLUMN     "price" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_negotiatedByRunnerId_fkey" FOREIGN KEY ("negotiatedByRunnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
