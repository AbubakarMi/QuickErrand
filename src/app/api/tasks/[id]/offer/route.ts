import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { TaskStatusError } from "@/lib/taskStatus";
import {
  agreeToCounterOffer,
  counterOfferAsPoster,
  declineCounterOffer,
  proposeCounterOffer,
  withdrawCounterOffer,
} from "@/lib/taskNegotiation";

type RouteParams = { params: Promise<{ id: string }> };

const priceField = z.coerce
  .number({ error: "Enter a price" })
  .int("Price must be a whole number")
  .positive("Price must be greater than zero");

const proposeSchema = z.object({ price: priceField });

const respondSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("AGREE"), expectedPrice: z.number().int() }),
  z.object({ action: z.literal("COUNTER"), price: priceField }),
  z.object({ action: z.literal("DECLINE") }),
  z.object({ action: z.literal("WITHDRAW") }),
]);

export async function POST(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const parsed = proposeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { id } = await params;
  try {
    const task = await proposeCounterOffer(id, parsed.data.price, {
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

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const parsed = respondSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid response." },
      { status: 400 },
    );
  }

  const { id } = await params;
  const actingUser = { id: session.user.id, role: session.user.role };
  try {
    const data = parsed.data;
    const task =
      data.action === "AGREE"
        ? await agreeToCounterOffer(id, actingUser, data.expectedPrice)
        : data.action === "COUNTER"
          ? await counterOfferAsPoster(id, data.price, actingUser)
          : data.action === "DECLINE"
            ? await declineCounterOffer(id, actingUser)
            : await withdrawCounterOffer(id, actingUser);
    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof TaskStatusError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
