import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { TaskStatusError } from "@/lib/taskStatus";
import { confirmPaymentReceived, markTaskPaid } from "@/lib/taskPayment";

const schema = z.object({ action: z.enum(["MARK_PAID", "CONFIRM_RECEIVED"]) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const { id } = await params;
  const actingUser = { id: session.user.id, role: session.user.role };
  try {
    const task =
      parsed.data.action === "MARK_PAID"
        ? await markTaskPaid(id, actingUser)
        : await confirmPaymentReceived(id, actingUser);
    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof TaskStatusError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
