import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { awardBid, TaskStatusError } from "@/lib/taskStatus";
import { acceptCounter, counterBid } from "@/lib/taskBids";

const price = z.coerce
  .number({ error: "Enter a price" })
  .int("Price must be a whole number")
  .positive("Price must be greater than zero");

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("AWARD"), expectedPrice: z.number().int() }),
  z.object({ action: z.literal("COUNTER"), price }),
  z.object({ action: z.literal("ACCEPT_COUNTER") }),
]);

// The poster awards or counters a specific bid, or the runner accepts the
// poster's counter on their own bid.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; bidId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const { id, bidId } = await params;
  const actingUser = { id: session.user.id, role: session.user.role };
  const data = parsed.data;
  try {
    if (data.action === "AWARD") {
      await awardBid(id, bidId, actingUser, data.expectedPrice);
    } else if (data.action === "COUNTER") {
      await counterBid(id, bidId, data.price, actingUser);
    } else {
      await acceptCounter(id, actingUser);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TaskStatusError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
