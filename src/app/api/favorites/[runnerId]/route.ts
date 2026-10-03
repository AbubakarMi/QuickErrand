import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({ favorited: z.boolean() });

type RouteParams = { params: Promise<{ runnerId: string }> };

// Only a poster favorites a runner, never the other way, see the
// Favorite model's comment in schema.prisma for why. Idempotent either
// direction: favoriting twice or un-favoriting something already gone
// both succeed rather than erroring.
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "USER") {
    return NextResponse.json({ error: "Only posters have favorites." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { runnerId } = await params;
  const runner = await prisma.user.findUnique({ where: { id: runnerId }, select: { role: true } });
  if (!runner || runner.role !== "RUNNER") {
    return NextResponse.json({ error: "Runner not found." }, { status: 404 });
  }

  if (parsed.data.favorited) {
    await prisma.favorite.upsert({
      where: { posterId_runnerId: { posterId: session.user.id, runnerId } },
      create: { posterId: session.user.id, runnerId },
      update: {},
    });
  } else {
    await prisma.favorite.deleteMany({ where: { posterId: session.user.id, runnerId } });
  }

  return NextResponse.json({ ok: true });
}
