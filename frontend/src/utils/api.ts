export const apiBaseUrl = import.meta.env.VITE_API_URL || "";

export async function loginAdmin(payload: { email: string; password: string }) {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Admin login failed with ${response.status}`);
  }

  return response.json() as Promise<{
    token: string;
    admin: {
      id?: string;
      email: string;
      role: string;
    };
  }>;
}

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
    onboardingCredentials?: {
      authorisationCode: string;
      authorisationCodeId?: string;
      membershipNumber: string;
      playerName?: string;
      playerSurname?: string;
      guardianName?: string;
      guardianEmail?: string;
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
      authorisationCode?: {
        id: string;
        code: string;
        membershipNumber?: string | null;
        emailLogs?: Array<{
          id: string;
          to: string;
          subject: string;
          status: string;
          error?: string | null;
          createdAt: string;
        }>;
      } | null;
    }>
  >;
}

export async function resendCodeEmail(codeId: string, token: string) {
  const response = await fetch(`${apiBaseUrl}/api/academy/admin/codes/${codeId}/send-email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Email resend failed with ${response.status}`);
  }

  return response.json() as Promise<{
    id: string;
    to: string;
    subject: string;
    status: string;
    error?: string | null;
    createdAt: string;
  }>;
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
    membershipCode?: string;
    paymentStatus?: "PENDING" | "PAID";
    paymentCompletedAt?: string;
    emailStatus?: string;
    emailError?: string | null;
    emailSentAt?: string;
    submittedAt: string;
    emailSimulatedAt: string;
  }>;
}

export async function simulateSimpleRegistrationPayment(registrationId: string) {
  const response = await fetch(
    `${apiBaseUrl}/api/academy/simple-registrations/${registrationId}/simulate-payment`,
    {
      method: "PATCH",
    },
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Payment simulation failed with ${response.status}`);
  }

  return response.json() as Promise<{
    id: string;
    referenceNumber: string;
    membershipCode?: string;
    paymentStatus?: "PENDING" | "PAID";
    paymentCompletedAt?: string;
    submittedAt: string;
    emailSimulatedAt: string;
    specificFields?: Record<string, string>;
  }>;
}

export async function resendSimpleRegistrationEmail(registrationId: string, token: string) {
  const response = await fetch(
    `${apiBaseUrl}/api/academy/admin/simple-registrations/${registrationId}/send-email`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Email resend failed with ${response.status}`);
  }

  return response.json() as Promise<{
    id: string;
    to: string;
    subject: string;
    status: string;
    error?: string | null;
    createdAt: string;
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
      membershipCode?: string;
      paymentStatus?: "PENDING" | "PAID";
      paymentCompletedAt?: string;
      emailStatus?: string;
      emailError?: string | null;
      emailSentAt?: string;
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
