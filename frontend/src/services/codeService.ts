import type { GeneratedCode, MockPlayer, OnboardingRegistration } from "../types";
import { generateRenewalCode, generateTrialAuthorisationCode } from "../utils/codeGenerator";

export function createRenewalCode(player: MockPlayer): GeneratedCode {
  return {
    id: crypto.randomUUID(),
    code: generateRenewalCode(),
    playerName: `${player.name} ${player.surname}`,
    playerEmail: player.guardianEmail,
    type: "renewal",
    membershipNumber: player.membershipNumber,
    used: false,
  };
}

export function createTrialAuthorisationCode(application: {
  playerName: string;
  playerSurname: string;
  guardianEmail: string;
}): GeneratedCode {
  return {
    id: crypto.randomUUID(),
    code: generateTrialAuthorisationCode(),
    playerName: `${application.playerName} ${application.playerSurname}`,
    playerEmail: application.guardianEmail,
    type: "trial-authorisation",
    used: false,
  };
}

export function findUnusedCode(codes: GeneratedCode[], codeValue: string) {
  const trimmedCode = codeValue.trim();
  return codes.find((code) => code.code === trimmedCode && !code.used);
}

export function getLocalCodeError(
  matchingCode: GeneratedCode | undefined,
  values: Pick<OnboardingRegistration, "membershipNumber">,
) {
  if (!matchingCode) {
    return "";
  }

  if (
    matchingCode.type === "renewal" &&
    matchingCode.membershipNumber !== values.membershipNumber.trim()
  ) {
    return "Membership number does not match this renewal code.";
  }

  return "";
}

export function markCodeUsed(codes: GeneratedCode[], codeValue: string) {
  return codes.map((code) =>
    code.code === codeValue.trim() ? { ...code, used: true } : code,
  );
}

export function markCodeEmailSent(codes: GeneratedCode[], codeId: string) {
  return codes.map((code) =>
    code.id === codeId ? { ...code, emailSentAt: new Date().toISOString() } : code,
  );
}
