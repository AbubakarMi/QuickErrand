import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { Category, PaymentMethod } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { presentPoolTask, runnerPoolWhere } from "@/lib/runnerPool";

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().min(1, "Description is required").max(2000),
  category: z.enum(Category),
  location: z.string().trim().min(1, "Location is required").max(200),
  // Coordination only, not a transaction, see CLAUDE.md and TASKS.md 3.6.
  price: z.coerce
    .number({ error: "Enter a price" })
    .int("Price must be a whole number")
    .positive("Price must be greater than zero"),
  paymentMethod: z.enum(PaymentMethod),
});

// What GET returns depends on who's asking, not on a query param, since
// the two roles want fundamentally different views: a requester wants
// their own tasks in any status, a runner wants the open pool. There's no
// third caller yet, so a role branch is simpler than a generic query API
// nobody's using the flexibility of.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (session.user.role === "USER") {
    const tasks = await prisma.task.findMany({
      where: { posterId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { runner: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ tasks });
  }

  if (session.user.role === "RUNNER") {
    const categoryParam = request.nextUrl.searchParams.get("category");
    const category =
      categoryParam && categoryParam in Category
        ? (categoryParam as Category)
        : undefined;

    const rows = await prisma.task.findMany({
      where: runnerPoolWhere(session.user.id, category),
      orderBy: { createdAt: "desc" },
      include: { poster: { select: { name: true } } },
    });
    return NextResponse.json({
      tasks: rows.map((row) => presentPoolTask(row, session.user.id)),
    });
  }

  return NextResponse.json(
    { error: "Admin task listing isn't built yet." },
    { status: 403 },
  );
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (session.user.role !== "USER") {
    return NextResponse.json(
      { error: "Only requesters can post errands." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const task = await prisma.task.create({
    data: { ...parsed.data, posterId: session.user.id },
  });

  return NextResponse.json({ task }, { status: 201 });
}
