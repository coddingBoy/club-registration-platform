export type AppTab =
  | "player"
  | "admin"
  | "onboarding"
  | "general-member"
  | "holiday-camp"
  | "meet-greet"
  | "urban-lounge"
  | "club-event"
  | "match-tickets";

export type ProgrammeCategory =
  | "programme"
  | "event"
  | "camp"
  | "meet-greet"
  | "ticket";

export type Programme = {
  id: string;
  title: string;
  category: ProgrammeCategory;
  registrationFee: number;
  monthlyFee: number;
  description: string;
  requiresAuthorisation: boolean;
  capacity: number;
  registeredCount: number;
};

export type Fee = {
  id: string;
  label: string;
  amount: number;
  note: string;
};

export type AdminSession = {
  token: string;
  admin: {
    id?: string;
    email: string;
    role: string;
  };
};

export type MockPlayer = {
  id: string;
  membershipNumber: string;
  passportNumber: string;
  name: string;
  surname: string;
  ageGroup: string;
  programmeId: string;
  status: "current" | "trial-success" | "trial-pending";
  guardianEmail: string;
};

export type PlayerRegistration = {
  path: "renewal" | "trial";
  renewalCode?: string;
};

export type TrialRegistration = {
  membershipCode?: string;
  clubInviteCode?: string;
  playerName: string;
  playerSurname: string;
  dateOfBirth: string;
  ageGroup: string;
  gender: string;
  guardianName: string;
  guardianSurname: string;
  guardianRelation: string;
  guardianEmail: string;
  guardianEmailConfirm: string;
  guardianPhone: string;
  province: string;
  allergiesOrConditions: string;
  birthCertificateFileName: string;
  birthCertificateDocumentId?: string;
  birthCertificateFileUrl?: string;
};

export type TrialApplicationStatus =
  | "payment-pending"
  | "paid"
  | "successful"
  | "unsuccessful";

export type TrialApplication = TrialRegistration & {
  id: string;
  submittedAt: string;
  status: TrialApplicationStatus;
  paymentConfirmed: boolean;
  authorisationCode?: string;
  authorisationCodeId?: string;
  membershipNumber?: string;
  emailStatus?: string;
  emailError?: string;
  emailSentAt?: string;
  informationCheckEmailStatus?: string;
  informationCheckEmailError?: string;
  informationCheckEmailSentAt?: string;
  qualificationEmailStatus?: string;
  qualificationEmailError?: string;
  qualificationEmailSentAt?: string;
};

export type ClubInviteApplication = TrialRegistration & {
  id: string;
  submittedAt: string;
  status: TrialApplicationStatus;
  paymentConfirmed: boolean;
  authorisationCode?: string;
  authorisationCodeId?: string;
  membershipNumber?: string;
  emailStatus?: string;
  emailError?: string;
  emailSentAt?: string;
  informationCheckEmailStatus?: string;
  informationCheckEmailError?: string;
  informationCheckEmailSentAt?: string;
  qualificationEmailStatus?: string;
  qualificationEmailError?: string;
  qualificationEmailSentAt?: string;
};

export type TrialOnboardingCredentials = {
  authorisationCode: string;
  authorisationCodeId?: string;
  membershipNumber: string;
  playerName?: string;
  playerSurname?: string;
  guardianName?: string;
  guardianEmail?: string;
};

export type GeneratedCode = {
  id: string;
  code: string;
  playerName: string;
  playerEmail: string;
  type: "trial-authorisation" | "renewal";
  membershipNumber?: string;
  used: boolean;
  emailSentAt?: string;
};

export type OnboardingRegistration = {
  authorisationCode: string;
  membershipNumber: string;
  programmeId: string;
  playerName: string;
  playerSurname: string;
  idNumber: string;
  guardianName: string;
  guardianEmail: string;
  debitOrderAccepted: boolean;
  codeOfConductAccepted: boolean;
  paymentOption: "monthly-debit-order" | "annual-upfront";
};

export type OnboardingCompletion = {
  id: string;
  completedAt: string;
  passportNumber: string;
  programmeId: string;
  programmeTitle: string;
  playerName: string;
  playerSurname: string;
  guardianEmail: string;
  codeUsed: string;
  codeType: "trial-authorisation" | "renewal";
  trialCredit: number;
  amountPaid: number;
  paymentOption: "monthly-debit-order" | "annual-upfront";
  confirmationEmail: string;
};

export type SimpleRegistrationType =
  | "general-member"
  | "holiday-camp"
  | "meet-greet"
  | "urban-lounge"
  | "club-event"
  | "match-tickets";

export type SimpleRegistrationField = {
  name: string;
  label: string;
  type: "text" | "date" | "number" | "select" | "textarea";
  required?: boolean;
  options?: string[];
};

export type SimpleRegistrationConfig = {
  type: SimpleRegistrationType;
  title: string;
  intro: string;
  referencePrefix: string;
  dateOfBirthRelevant: boolean;
  parentGuardianRelevant: boolean;
  fields: SimpleRegistrationField[];
};

export type SimpleRegistrationRecord = {
  id: string;
  type: SimpleRegistrationType;
  referenceNumber: string;
  membershipCode?: string;
  paymentStatus?: "PENDING" | "PAID";
  paymentCompletedAt?: string;
  emailStatus?: string;
  emailError?: string;
  emailSentAt?: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  parentGuardian?: string;
  specificFields: Record<string, string>;
  submittedAt: string;
  emailSimulatedAt: string;
};

export type ClubInviteTrialCode = {
  id: string;
  playerName: string;
  email: string;
  emailConfirm: string;
  membershipCode: string;
  inviteCode: string;
  emailStatus?: string;
  emailError?: string;
  emailSentAt?: string;
  createdAt: string;
};
