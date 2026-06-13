import { formatCurrency } from "../utils/validation";

type OnboardingConfirmationInput = {
  guardianEmail: string;
  programmeTitle: string;
  passportNumber: string;
  amountDue: number;
  source: "local" | "backend";
};

export function buildOnboardingConfirmationMessage({
  guardianEmail,
  programmeTitle,
  passportNumber,
  amountDue,
  source,
}: OnboardingConfirmationInput) {
  const prefix =
    source === "backend"
      ? "Onboarding created in backend"
      : "Simulated payment confirmed";

  return `${prefix} for ${guardianEmail}. Programme: ${programmeTitle}. Passport number: ${passportNumber}. Amount due: ${formatCurrency(amountDue)}. Confirmation email simulated.`;
}

export function buildTrialUnsuccessfulMessage(playerName: string, playerSurname: string) {
  return `Simulated unsuccessful trial message prepared for ${playerName} ${playerSurname}.`;
}
