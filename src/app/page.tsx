import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandingContent } from "./landing-content";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/70 px-6 py-5 backdrop-blur-md sm:px-10">
        <span className="font-heading text-lg font-semibold tracking-tight">
          Quick<span className="text-primary">Errand</span>
        </span>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" render={<Link href="/login" />}>
            Log in
          </Button>
          <Button render={<Link href="/register" />}>Get started</Button>
        </nav>
      </header>

      <LandingContent />
    </div>
  );
}
