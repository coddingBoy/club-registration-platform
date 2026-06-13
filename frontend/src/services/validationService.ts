import type {
  OnboardingRegistration,
  SimpleRegistrationConfig,
  TrialRegistration,
} from "../types";
import { isEmail, isRequired, isTenDigitPhone } from "../utils/validation";

export function validateTrialRegistration(values: TrialRegistration) {
  const errors: Partial<Record<keyof TrialRegistration, string>> = {};

  if (!isRequired(values.playerName)) errors.playerName = "Player name is required.";
  if (!isRequired(values.playerSurname)) errors.playerSurname = "Player surname is required.";
  if (!isRequired(values.guardianName)) errors.guardianName = "Guardian name is required.";
  if (!isEmail(values.guardianEmail)) errors.guardianEmail = "Enter a valid guardian email.";
  if (!isTenDigitPhone(values.guardianPhone)) {
    errors.guardianPhone = "Enter a 10 digit guardian cell number.";
  }

  return errors;
}

export function isTrialRegistrationComplete(values: TrialRegistration) {
  return Object.keys(validateTrialRegistration(values)).length === 0;
}

export function validateRenewalUnlock(membershipNumber: string, renewalCode: string) {
  if (!isRequired(membershipNumber)) {
    return "Membership number is required.";
  }

  if (!isRequired(renewalCode)) {
    return "Renewal code is required.";
  }

  return "";
}

export function validateOnboardingStep(step: number, values: OnboardingRegistration) {
  if (step === 0) {
    if (
      !isRequired(values.authorisationCode) ||
      !isRequired(values.programmeId) ||
      !isRequired(values.playerName) ||
      !isRequired(values.playerSurname) ||
      !isRequired(values.idNumber) ||
      !isRequired(values.guardianName) ||
      !isEmail(values.guardianEmail)
    ) {
      return "Complete all required personal details.";
    }
  }

  if (step === 1 && !values.codeOfConductAccepted) {
    return "Accept the Code of Conduct before continuing.";
  }

  if (step === 2 && !values.debitOrderAccepted) {
    return "Authorise the debit order placeholder before continuing.";
  }

  if (step === 3 && !values.paymentOption) {
    return "Select a payment option.";
  }

  return "";
}

export function validateSimpleRegistration(
  config: SimpleRegistrationConfig,
  baseValues: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    parentGuardian: string;
  },
  specificValues: Record<string, string>,
) {
  const errors: Record<string, string> = {};

  if (!isRequired(baseValues.fullName)) {
    errors.fullName = "Full name is required.";
  }

  if (!isEmail(baseValues.email)) {
    errors.email = "Enter a valid email.";
  }

  if (!isTenDigitPhone(baseValues.phone)) {
    errors.phone = "Enter a 10 digit phone number.";
  }

  if (config.dateOfBirthRelevant && !isRequired(baseValues.dateOfBirth)) {
    errors.dateOfBirth = "Date of birth is required.";
  }

  if (config.parentGuardianRelevant && !isRequired(baseValues.parentGuardian)) {
    errors.parentGuardian = "Parent/guardian is required.";
  }

  config.fields.forEach((field) => {
    if (field.required && !isRequired(specificValues[field.name] ?? "")) {
      errors[field.name] = `${field.label} is required.`;
    }
  });

  return errors;
}
