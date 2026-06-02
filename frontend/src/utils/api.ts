export const apiBaseUrl = import.meta.env.VITE_API_URL || "";

export async function getBackendHealth() {
  const response = await fetch(`${apiBaseUrl}/api/health`);

  if (!response.ok) {
    throw new Error(`Backend health check failed with ${response.status}`);
  }

  return response.json() as Promise<{ status: string }>;
}

export async function postTrialApplication(payload: {
  playerName: string;
  playerSurname: string;
  dateOfBirth: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
}) {
  const response = await fetch(`${apiBaseUrl}/api/academy/trials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Trial application failed with ${response.status}`);
  }

  return response.json() as Promise<{
    trialApplication: {
      id: string;
      playerName: string;
      playerSurname: string;
      dateOfBirth?: string | null;
      guardianName: string;
      guardianEmail: string;
      guardianPhone: string;
      status: "PAYMENT_PENDING" | "PAID" | "SUCCESSFUL" | "UNSUCCESSFUL";
      createdAt: string;
    };
    payment: {
      id: string;
      status: string;
      amount: number;
    };
    checkout: {
      provider: string;
      checkoutUrl: string;
      fields: Record<string, string>;
    };
  }>;
}

export async function getTrialApplications() {
  const response = await fetch(`${apiBaseUrl}/api/academy/trials`);

  if (!response.ok) {
    throw new Error(`Trial applications failed with ${response.status}`);
  }

  return response.json() as Promise<
    Array<{
      id: string;
      playerName: string;
      playerSurname: string;
      dateOfBirth?: string | null;
      guardianName: string;
      guardianEmail: string;
      guardianPhone: string;
      status: "PAYMENT_PENDING" | "PAID" | "SUCCESSFUL" | "UNSUCCESSFUL";
      createdAt: string;
      authorisationCode?: { code: string } | null;
    }>
  >;
}

export async function postSimpleRegistration(payload: {
  type: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  parentGuardian?: string;
  specificFields: Record<string, string>;
}) {
  const response = await fetch(`${apiBaseUrl}/api/academy/simple-registrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Registration failed with ${response.status}`);
  }

  return response.json() as Promise<{
    id: string;
    referenceNumber: string;
    submittedAt: string;
    emailSimulatedAt: string;
  }>;
}

export async function getSimpleRegistrations() {
  const response = await fetch(`${apiBaseUrl}/api/academy/simple-registrations`);

  if (!response.ok) {
    throw new Error(`Simple registrations failed with ${response.status}`);
  }

  return response.json() as Promise<
    Array<{
      id: string;
      type: string;
      referenceNumber: string;
      fullName: string;
      email: string;
      phone: string;
      dateOfBirth?: string | null;
      parentGuardian?: string | null;
      specificFields?: Record<string, string> | null;
      emailSimulatedAt?: string | null;
      createdAt: string;
    }>
  >;
}

export async function validateCode(payload: {
  code: string;
  membershipNumber?: string;
}) {
  const response = await fetch(`${apiBaseUrl}/api/academy/codes/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Code validation failed with ${response.status}`);
  }

  return response.json() as Promise<{
    valid: true;
    type: "TRIAL_AUTHORISATION" | "RENEWAL";
    membershipNumber?: string | null;
  }>;
}

export async function postOnboarding(payload: {
  code: string;
  membershipNumber?: string;
  programmeId: string;
  playerName: string;
  playerSurname: string;
  idNumber: string;
  guardianName: string;
  guardianEmail: string;
  debitOrderAccepted: boolean;
  codeOfConductAccepted: boolean;
  paymentOption: "monthly-debit-order" | "annual-upfront";
}) {
  const response = await fetch(`${apiBaseUrl}/api/academy/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Onboarding failed with ${response.status}`);
  }

  return response.json() as Promise<{
    onboardingRecord: {
      id: string;
      programmeId: string;
      programmeTitle: string;
      playerName: string;
      playerSurname: string;
      guardianEmail: string;
      passportNumber: string;
      trialCreditAmount: number;
      amountDue: number;
      paymentOption: "monthly-debit-order" | "annual-upfront";
      createdAt: string;
    };
    payment: {
      id: string;
      status: string;
      amount: number;
    };
    checkout: {
      provider: string;
      checkoutUrl: string;
      fields: Record<string, string>;
    };
  }>;
}
