import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileView } from "@/components/profile-view";
import { FavoriteButton } from "@/components/favorite-button";

// A poster can open runners' profiles (to judge who they're dealing with)
// and their own.
export default async function UserAreaProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const isOwnProfile = id === session!.user.id;

  let showFavorite = false;
  let isFavorited = false;
  if (!isOwnProfile) {
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (target?.role !== "RUNNER") notFound();
    showFavorite = true;
    const favorite = await prisma.favorite.findUnique({
      where: { posterId_runnerId: { posterId: session!.user.id, runnerId: id } },
      select: { id: true },
    });
    isFavorited = !!favorite;
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {showFavorite && (
        <div className="mb-4 flex justify-end">
          <FavoriteButton runnerId={id} initialFavorited={isFavorited} />
        </div>
      )}
      <ProfileView userId={id} viewerId={session!.user.id} />
    </div>
  );
}
