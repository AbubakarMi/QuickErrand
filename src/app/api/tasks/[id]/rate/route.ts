import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { TaskStatusError } from "@/lib/taskStatus";
import { rateCounterpart } from "@/lib/taskRating";

const schema = z.object({
  score: z
    .number({ error: "Choose a rating from 1 to 5" })
    .int()
    .min(1, "Choose a rating from 1 to 5")
    .max(5, "Choose a rating from 1 to 5"),
  comment: z.string().trim().max(500, "Keep the comment under 500 characters").optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid rating." },
      { status: 400 },
    );
  }

  const { id } = await params;
  try {
    const rating = await rateCounterpart(id, parsed.data, {
      id: session.user.id,
      role: session.user.role,
    });
    return NextResponse.json({ rating }, { status: 201 });
  } catch (error) {
    if (error instanceof TaskStatusError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
