// The fixed set offered at registration and reused on /forgot-password.
// Plain strings on the User row, not an enum, there's nothing to query or
// filter by, it's just a prompt.
export const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the make of your first car?",
  "What is the name of the street you grew up on?",
] as const;
