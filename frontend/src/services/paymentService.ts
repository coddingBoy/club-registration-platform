import { fees } from "../data/fees";
import { programmes } from "../data/programmes";
import type { GeneratedCode, Programme } from "../types";

export const trialFeeAmount =
  fees.find((fee) => fee.id === "trial")?.amount ??
  fees.find((fee) => fee.id === "trial-credit")?.amount ??
  500;

export function getProgramme(programmeId: string): Programme {
  return programmes.find((programme) => programme.id === programmeId) ?? programmes[0];
}

export function getTrialCredit(codeType: GeneratedCode["type"] | "") {
  return codeType === "trial-authorisation" ? trialFeeAmount : 0;
}

export function calculateOnboardingAmount(programmeId: string, codeType: GeneratedCode["type"] | "") {
  const programme = getProgramme(programmeId);
  const trialCredit = getTrialCredit(codeType);

  return {
    programme,
    trialCredit,
    amountDue: Math.max(programme.registrationFee - trialCredit, 0),
  };
}
