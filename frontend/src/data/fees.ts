import type { Fee } from "../types";

export const fees: Fee[] = [
  {
    id: "trial",
    label: "Trial Fee",
    amount: 500,
    note: "Paid by new players before admin evaluation.",
  },
  {
    id: "trial-credit",
    label: "Successful Trial Credit",
    amount: 500,
    note: "Credited against onboarding payment for successful trialists.",
  },
  {
    id: "first-touch-registration",
    label: "First Touch Registration plus First Month",
    amount: 2600,
    note: "Initial First Touch onboarding payment.",
  },
];
