import { CheckCircle2, Hammer, ShoppingBag, Sparkles, Truck, Wrench } from "lucide-react";

const ITEMS = [
  { icon: ShoppingBag, text: "Grocery runs" },
  { icon: Wrench, text: "Plumbing fixes" },
  { icon: Truck, text: "Package delivery" },
  { icon: Sparkles, text: "Home cleaning" },
  { icon: Hammer, text: "Furniture assembly" },
  { icon: CheckCircle2, text: "Rated runners" },
];

// Pure CSS marquee (see .marquee-track in globals.css) rather than a JS
// scroll loop, so it costs nothing on the main thread. The track content
// is duplicated once so a -50% translate loops seamlessly.
export function MarqueeTicker() {
  return (
    <div className="overflow-hidden border-y border-border bg-secondary py-3">
      <div className="marquee-track flex w-max gap-10">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-10" aria-hidden={copy === 1}>
            {ITEMS.map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
              >
                <Icon className="size-4 text-primary" />
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
