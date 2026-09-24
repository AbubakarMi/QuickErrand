// "just now", "5 min ago", "2 hours ago", "3 days ago", then a plain date
// once it's more than a couple of weeks old. Pure, so it runs on the
// server and in client components alike.
export function timeAgo(date: Date | string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(date).toLocaleDateString();
}
