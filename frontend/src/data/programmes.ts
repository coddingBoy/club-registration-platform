import type { Programme } from "../types";

export const programmes: Programme[] = [
  {
    id: "first-touch",
    title: "First Touch",
    category: "programme",
    registrationFee: 2600,
    monthlyFee: 950,
    description:
      "Entry-level academy programme for the youngest Urban Warriors.",
    requiresAuthorisation: true,
    capacity: 100,
    registeredCount: 64,
  },
  {
    id: "little-warriors",
    title: "Little Warriors",
    category: "programme",
    registrationFee: 2700,
    monthlyFee: 1050,
    description: "Junior academy programme with registration and monthly tuition.",
    requiresAuthorisation: true,
    capacity: 80,
    registeredCount: 38,
  },
  {
    id: "ads",
    title: "ADS",
    category: "programme",
    registrationFee: 4850,
    monthlyFee: 1450,
    description: "Advanced Development Squad onboarding programme.",
    requiresAuthorisation: true,
    capacity: 72,
    registeredCount: 49,
  },
  {
    id: "hpds",
    title: "HPDS",
    category: "programme",
    registrationFee: 6250,
    monthlyFee: 1950,
    description: "High Performance Development Squad onboarding programme.",
    requiresAuthorisation: true,
    capacity: 48,
    registeredCount: 31,
  },
];
