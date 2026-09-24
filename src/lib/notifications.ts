import { prisma } from "@/lib/prisma";

// Something the user should hear about. Stored, not derived, because "you
// weren't awarded" is an event: there's no state left to read it off once
// the errand moves on. Read by the header bell (GET /api/notifications).
export async function notify(userId: string, message: string, href: string) {
  await prisma.notification.create({ data: { userId, message, href } });
}

export async function notifyMany(userIds: string[], message: string, href: string) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, message, href })),
  });
}
