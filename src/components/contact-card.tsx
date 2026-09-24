import Link from "next/link";
import { Building2, Phone, User as UserIcon } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import type { UserRating } from "@/lib/userRating";

// Shown on a task's detail page once there's a counterpart to introduce,
// the runner sees the poster's contact, the poster sees the runner's.
// Bank details are optional and only ever passed for a runner being shown
// to a poster on a BANK_TRANSFER task, a poster never has payout details
// of their own since money only flows one direction in this app.
export function ContactCard({
  label,
  name,
  phone,
  bankAccountNumber,
  bankName,
  rating,
  profileHref,
}: {
  label: string;
  name: string;
  phone: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  rating?: UserRating | null;
  // Where this person's profile (overall rating and feedback) lives.
  profileHref?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <UserIcon className="size-4 text-muted-foreground" />
        {profileHref ? (
          <Link href={profileHref} className="-my-1.5 inline-block py-1.5 text-sm font-medium hover:underline">
            {name}
          </Link>
        ) : (
          <span className="text-sm font-medium">{name}</span>
        )}
      </div>
      {rating && (
        <div className="mt-1.5">
          <StarRating value={rating.average} count={rating.count} />
        </div>
      )}
      {phone && (
        <div className="mt-1 flex items-center gap-2">
          <Phone className="size-4 text-muted-foreground" />
          <span className="text-sm">{phone}</span>
        </div>
      )}
      {(bankAccountNumber || bankName) && (
        <div className="mt-1 flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" />
          <span className="text-sm">
            {bankName ?? "Bank"} · {bankAccountNumber ?? "no account on file"}
          </span>
        </div>
      )}
    </div>
  );
}
