import type { Category, PaymentMethod, Prisma } from "@prisma/client";

// The open pool a runner browses. An errand the poster has reserved for a
// specific runner (they agreed to that runner's offer) drops out of the pool
// for everyone else, but stays visible to the runner it's reserved for so
// they can confirm it.
export function runnerPoolWhere(
  runnerId: string,
  category?: Category,
): Prisma.TaskWhereInput {
  return {
    status: "PENDING",
    ...(category ? { category } : {}),
    OR: [{ offerAgreedAt: null }, { negotiatedByRunnerId: runnerId }],
  };
}

type PoolRow = {
  id: string;
  title: string;
  category: Category;
  location: string;
  price: number;
  paymentMethod: PaymentMethod;
  poster: { name: string };
  negotiatedPrice: number | null;
  negotiatedByRunnerId: string | null;
  offerBy: "RUNNER" | "POSTER" | null;
  offerAgreedAt: Date | null;
};

export type PoolTask = Pick<
  PoolRow,
  "id" | "title" | "category" | "location" | "price" | "paymentMethod" | "poster"
> & {
  // The poster agreed to this runner's price: confirm to take it.
  agreedForMe: boolean;
  // The poster countered this runner's offer: accept it, or answer back.
  counteredForMe: boolean;
};

// An explicit whitelist rather than passing the row through: rows carry
// other runners' counter-offers (price and who made it), which are between
// that runner and the poster and must never reach this one. For a runner
// the errand is reserved for, `price` is the agreed price they'd be
// confirming.
export function presentPoolTask(row: PoolRow, runnerId: string): PoolTask {
  const agreedForMe =
    row.offerAgreedAt !== null &&
    row.negotiatedByRunnerId === runnerId &&
    row.negotiatedPrice !== null;
  const counteredForMe =
    !agreedForMe &&
    row.offerBy === "POSTER" &&
    row.negotiatedByRunnerId === runnerId &&
    row.negotiatedPrice !== null;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    location: row.location,
    price: agreedForMe || counteredForMe ? row.negotiatedPrice! : row.price,
    paymentMethod: row.paymentMethod,
    poster: { name: row.poster.name },
    agreedForMe,
    counteredForMe,
  };
}
