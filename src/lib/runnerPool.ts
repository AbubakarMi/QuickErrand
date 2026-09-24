import type { Category, PaymentMethod, Prisma } from "@prisma/client";

// The open pool a runner browses: every PENDING errand, and for each the
// runner's own bid on it, if any, plus how many bids it has in total.
export function runnerPoolWhere(category?: Category): Prisma.TaskWhereInput {
  return { status: "PENDING", ...(category ? { category } : {}) };
}

export function runnerPoolInclude(runnerId: string) {
  return {
    poster: { select: { name: true } },
    bids: { where: { runnerId }, select: { price: true, counterPrice: true } },
    _count: { select: { bids: { where: { status: "OPEN" as const } } } },
  } satisfies Prisma.TaskInclude;
}

type PoolRow = {
  id: string;
  title: string;
  category: Category;
  location: string;
  price: number;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  poster: { name: string };
  bids: { price: number; counterPrice: number | null }[];
  _count: { bids: number };
};

export type PoolTask = {
  id: string;
  title: string;
  category: Category;
  location: string;
  price: number;
  paymentMethod: PaymentMethod;
  createdAt: Date | string;
  poster: { name: string };
  bidCount: number;
  myBid: { price: number; counterPrice: number | null } | null;
};

// An explicit whitelist rather than passing the row through, so nothing
// about other runners' bids can reach this one. All they get is a count.
export function presentPoolTask(row: PoolRow): PoolTask {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    location: row.location,
    price: row.price,
    paymentMethod: row.paymentMethod,
    createdAt: row.createdAt,
    poster: { name: row.poster.name },
    bidCount: row._count.bids,
    myBid: row.bids[0] ?? null,
  };
}
