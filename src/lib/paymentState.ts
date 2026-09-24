export type PaymentState = "UNPAID" | "PAID" | "CONFIRMED";

// Where a COMPLETED errand is in the mark-paid / confirm-received record.
export function paymentState(task: {
  paidAt: Date | null;
  paymentConfirmedAt: Date | null;
}): PaymentState {
  if (task.paymentConfirmedAt) return "CONFIRMED";
  if (task.paidAt) return "PAID";
  return "UNPAID";
}
