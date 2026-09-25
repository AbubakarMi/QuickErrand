import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LandingContent } from "./landing-content";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/70 px-6 py-5 backdrop-blur-md sm:px-10">
        <span className="font-heading text-lg font-semibold tracking-tight whitespace-nowrap">
          Quick<span className="text-primary">Errand</span>
        </span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Log in
          </Link>
          <Link href="/register" className={buttonVariants()}>Get started</Link>
        </nav>
      </header>

      <LandingContent />
    </div>
  );
}
