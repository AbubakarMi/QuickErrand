// No currency symbol, deliberately, the price is coordination text between
// poster and runner (see CLAUDE.md), not a real transaction amount tied to
// a specific currency system.
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US").format(price);
}
