import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Joins class names and resolves Tailwind conflicts, so a className passed
// to a component reliably overrides the component's own defaults (the last
// bg-* or text-* color wins). Without the merge, both classes ship and
// whichever is later in the stylesheet wins, which is not the one you wrote.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
