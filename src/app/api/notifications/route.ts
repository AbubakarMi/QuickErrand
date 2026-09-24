import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/formatPrice";

// Not stored anywhere: a notification here is just "something is waiting
// on you" read straight off the negotiation state, so it can't go stale,
// can't pile up, and disappears the moment the person answers it. The id
// includes the price so a fresh counter on the same errand is a new one.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (session.user.role === "USER") {
    const tasks = await prisma.task.findMany({
      where: {
        posterId: session.user.id,
        status: "PENDING",
        offerBy: "RUNNER",
        offerAgreedAt: null,
        negotiatedPrice: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      include: { negotiatedByRunner: { select: { name: true } } },
    });
    return NextResponse.json({
      items: tasks.map((t) => ({
        id: `${t.id}:offer:${t.negotiatedPrice}`,
        message: `${t.negotiatedByRunner?.name ?? "A runner"} offered ${formatPrice(t.negotiatedPrice!)} for "${t.title}"`,
        href: `/user/tasks/${t.id}`,
      })),
    });
  }

  if (session.user.role === "RUNNER") {
    const tasks = await prisma.task.findMany({
      where: {
        negotiatedByRunnerId: session.user.id,
        status: "PENDING",
        negotiatedPrice: { not: null },
        OR: [{ offerBy: "POSTER" }, { offerAgreedAt: { not: null } }],
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({
      items: tasks.map((t) => ({
        id: `${t.id}:${t.offerAgreedAt ? "agreed" : "counter"}:${t.negotiatedPrice}`,
        message: t.offerAgreedAt
          ? `Price agreed at ${formatPrice(t.negotiatedPrice!)} for "${t.title}". Confirm to take it`
          : `The poster countered ${formatPrice(t.negotiatedPrice!)} on "${t.title}"`,
        href: `/runner/tasks/${t.id}`,
      })),
    });
  }

  return NextResponse.json({ items: [] });
}
