export type TrialWindowCapacity = {
  ageGroup: string;
  capacity: number;
  registeredCount: number;
};

export const trialWindowCapacities: TrialWindowCapacity[] = [
  { ageGroup: "Under 18", capacity: 100, registeredCount: 42 },
  { ageGroup: "Under 16", capacity: 100, registeredCount: 57 },
  { ageGroup: "Under 14", capacity: 100, registeredCount: 64 },
  { ageGroup: "Under 12", capacity: 100, registeredCount: 51 },
  { ageGroup: "Little Warriors Programme", capacity: 80, registeredCount: 38 },
  { ageGroup: "First Touch Programme", capacity: 80, registeredCount: 44 },
];

export function getTrialWindowCapacity(ageGroup: string) {
  return trialWindowCapacities.find((window) => window.ageGroup === ageGroup);
}
