import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { TaskStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTaskStatus, TaskStatusError } from "@/lib/taskStatus";

const patchSchema = z.object({
  status: z.enum(TaskStatus),
  // The price the client was showing, checked on ACCEPTED so terms that
  // changed since page load fail loudly instead of silently applying.
  expectedPrice: z.number().int().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      poster: { select: { id: true, name: true, phone: true } },
      runner: {
        select: {
          id: true,
          name: true,
          phone: true,
          bankAccountNumber: true,
          bankName: true,
        },
      },
      negotiatedByRunner: { select: { id: true, name: true } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  // The poster and the assigned runner can always see the detail. A
  // runner who hasn't accepted it yet can still see it while it's
  // PENDING, that's what they're previewing before deciding to accept,
  // same rule the runner detail page itself enforces.
  const isInvolved =
    task.posterId === session.user.id || task.runnerId === session.user.id;
  // An errand reserved for a specific runner is not open for anyone else
  // to browse into by URL either.
  const isPreviewableByRunner =
    session.user.role === "RUNNER" &&
    task.status === "PENDING" &&
    (!task.offerAgreedAt || task.negotiatedByRunnerId === session.user.id);
  if (!isInvolved && !isPreviewableByRunner) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // The poster's phone only goes to someone actually involved in the
  // task, not to a runner merely previewing an unclaimed one. (There's no
  // equivalent runner-phone leak to guard: task.runner is only non-null
  // once the task is past PENDING, at which point the preview path is no
  // longer available and `isInvolved` is required to get here at all.)
  //
  // A counter-offer is between the poster and the runner who made it.
  // Other runners previewing the errand don't get to see it.
  const canSeeOffer =
    task.posterId === session.user.id ||
    task.negotiatedByRunnerId === session.user.id;

  // Once an errand is cancelled (poster cancelled it, or the runner backed
  // out) the two sides have no reason to keep each other's contact or
  // payout details. A runner who backed out is still "involved" by id, so
  // this can't lean on isInvolved alone.
  const isCancelled = task.status === "CANCELLED";
  const isPoster = task.posterId === session.user.id;
  const showPosterContact = isInvolved && !(isCancelled && !isPoster);

  return NextResponse.json({
    task: {
      ...task,
      poster: showPosterContact ? task.poster : { ...task.poster, phone: null },
      runner:
        task.runner && isCancelled
          ? { ...task.runner, phone: null, bankAccountNumber: null, bankName: null }
          : task.runner,
      negotiatedPrice: canSeeOffer ? task.negotiatedPrice : null,
      negotiatedByRunnerId: canSeeOffer ? task.negotiatedByRunnerId : null,
      negotiatedByRunner: canSeeOffer ? task.negotiatedByRunner : null,
      offerAgreedAt: canSeeOffer ? task.offerAgreedAt : null,
      offerBy: canSeeOffer ? task.offerBy : null,
    },
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const { id } = await params;
  try {
    const task = await updateTaskStatus(id, parsed.data.status, {
      id: session.user.id,
      role: session.user.role,
    }, { expectedPrice: parsed.data.expectedPrice });
    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof TaskStatusError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
