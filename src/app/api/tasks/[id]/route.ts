import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { TaskStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTaskStatus, TaskStatusError } from "@/lib/taskStatus";
import { getUserRating } from "@/lib/userRating";
import { getBidsForPoster } from "@/lib/bids";

const patchSchema = z.object({ status: z.enum(TaskStatus) });

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const me = session.user.id;

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
      ratings: {
        select: { score: true, comment: true, ratedById: true, ratedUserId: true },
      },
      bids: { where: { runnerId: me }, select: { id: true, price: true, counterPrice: true, status: true } },
      _count: { select: { bids: { where: { status: "OPEN" } } } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  // Who may open an errand: its poster, the runner it went to, any runner
  // while it's still open (that's what browsing and bidding is), and a
  // runner who bid on it, so one who lost still gets to see how it ended.
  const isPoster = task.posterId === me;
  const isAssigned = task.runnerId === me;
  const isPreviewableByRunner = session.user.role === "RUNNER" && task.status === "PENDING";
  const myBid = task.bids[0] ?? null;
  if (!isPoster && !isAssigned && !isPreviewableByRunner && !myBid) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // Contact details only go to the two people actually doing the errand,
  // and to neither once it's cancelled. A runner who backed out is still
  // "assigned" by id, so this can't lean on that alone.
  const isCancelled = task.status === "CANCELLED";
  const showPosterPhone = (isPoster || isAssigned) && !(isCancelled && !isPoster);

  const [runnerRating, posterRating, bids] = await Promise.all([
    task.runnerId ? getUserRating(task.runnerId) : null,
    getUserRating(task.posterId),
    isPoster && task.status === "PENDING" ? getBidsForPoster(task.id) : [],
  ]);

  // The two ratings on a finished errand, from this requester's side: the
  // one they gave and the one they got. The raw list isn't sent.
  // `bids` (just this user's own row) and `_count` are query plumbing, not
  // part of the response shape, so they're pulled off here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ratings, bids: _ownBidRows, _count, ...fields } = task;
  const pick = (r: (typeof ratings)[number] | undefined) =>
    r ? { score: r.score, comment: r.comment } : null;

  return NextResponse.json({
    task: {
      ...fields,
      poster: showPosterPhone ? task.poster : { ...task.poster, phone: null },
      runner:
        task.runner && isCancelled
          ? { ...task.runner, phone: null, bankAccountNumber: null, bankName: null }
          : task.runner,
      runnerRating,
      posterRating,
      myRating: pick(ratings.find((r) => r.ratedById === me)),
      ratingReceived: pick(ratings.find((r) => r.ratedUserId === me)),
      bids,
      bidCount: _count.bids,
      myBid: isPoster ? null : myBid,
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
    });
    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof TaskStatusError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
