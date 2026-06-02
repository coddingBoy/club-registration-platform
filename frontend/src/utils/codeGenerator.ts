export function generateCode(prefix: string) {
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomPart}`;
}

export function generateTrialAuthorisationCode() {
  return generateCode("TRIAL-AUTH");
}

export function generateRenewalCode() {
  return generateCode("RENEW");
}

export function generatePassportNumber() {
  return generateCode("CTS-UW");
}

export function generateReferenceNumber(prefix: string) {
  return generateCode(prefix);
}
