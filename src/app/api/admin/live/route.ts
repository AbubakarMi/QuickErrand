import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LIMIT = 50;

// Polled by the admin live view: every errand that isn't finished yet,
// posted, being negotiated over, awarded, or actually running. Read-only,
// same as the rest of the admin area.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const tasks = await prisma.task.findMany({
    where: { status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS"] } },
    orderBy: { updatedAt: "desc" },
    take: LIMIT,
    include: {
      poster: { select: { name: true } },
      runner: { select: { name: true } },
      _count: { select: { bids: { where: { status: "OPEN" } } } },
    },
  });

  return NextResponse.json({
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      price: t.price,
      status: t.status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      poster: t.poster,
      runner: t.runner,
      bidCount: t._count.bids,
    })),
  });
}
