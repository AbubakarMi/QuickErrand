import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { TaskStatusError } from "@/lib/taskStatus";
import { placeBid, withdrawBid } from "@/lib/taskBids";

type RouteParams = { params: Promise<{ id: string }> };

const schema = z.object({
  price: z.coerce
    .number({ error: "Enter a price" })
    .int("Price must be a whole number")
    .positive("Price must be greater than zero"),
});

async function run(action: () => Promise<unknown>, status = 200) {
  try {
    return NextResponse.json({ ok: true, result: await action() }, { status });
  } catch (error) {
    if (error instanceof TaskStatusError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}

// Place or change your bid.
export async function POST(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid price." },
      { status: 400 },
    );
  }
  const { id } = await params;
  return run(() =>
    placeBid(id, parsed.data.price, { id: session.user.id, role: session.user.role }),
  );
}

// Withdraw your bid.
export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { id } = await params;
  return run(() =>
    withdrawBid(id, { id: session.user.id, role: session.user.role }),
  );
}
