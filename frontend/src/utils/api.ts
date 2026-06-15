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
      ageGroup?: string | null;
      gender?: string | null;
      guardianName: string;
      guardianSurname?: string | null;
      guardianRelation?: string | null;
      guardianEmail: string;
      guardianEmailConfirm?: string | null;
      guardianPhone: string;
      province?: string | null;
      allergiesOrConditions?: string | null;
      birthCertificateFileName?: string | null;
      birthCertificateDocumentId?: string | null;
      birthCertificateFileUrl?: string | null;
      status: "PAYMENT_PENDING" | "PAID" | "SUCCESSFUL" | "UNSUCCESSFUL";
      createdAt: string;
    };
    payment?: {
      id: string;
      status: string;
      amount: number;
    } | null;
    checkout: {
      provider: string;
      checkoutUrl: string;
      fields: Record<string, string>;
    } | null;
    membershipNumber?: string;
    emailStatus?: string;
    emailError?: string | null;
    emailSentAt?: string;
  }>;
}

export async function getClubInviteTrialLookup(membershipCode: string) {
  const response = await fetch(
    `${apiBaseUrl}/api/academy/club-invite-trials/${encodeURIComponent(
      membershipCode,
    )}`,
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Club invite lookup failed with ${response.status}`);
  }

  return response.json() as Promise<{
    playerName: string;
    email: string;
    membershipCode: string;
    inviteCode: string;
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
      ageGroup?: string | null;
      gender?: string | null;
      guardianName: string;
      guardianSurname?: string | null;
      guardianRelation?: string | null;
      guardianEmail: string;
      guardianEmailConfirm?: string | null;
      guardianPhone: string;
      province?: string | null;
      allergiesOrConditions?: string | null;
      birthCertificateFileName?: string | null;
      birthCertificateDocumentId?: string | null;
      birthCertificateFileUrl?: string | null;
      status: "PAYMENT_PENDING" | "PAID" | "SUCCESSFUL" | "UNSUCCESSFUL";
      createdAt: string;
      membershipNumber?: string | null;
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
      emailStatus?: string;
      emailError?: string | null;
      emailSentAt?: string;
      informationCheckEmailStatus?: string;
      informationCheckEmailError?: string | null;
      informationCheckEmailSentAt?: string;
      qualificationEmailStatus?: string;
      qualificationEmailError?: string | null;
      qualificationEmailSentAt?: string;
    }>
  >;
}

export async function getClubInviteApplications() {
  const response = await fetch(`${apiBaseUrl}/api/academy/club-invite-applications`);

  if (!response.ok) {
    throw new Error(`Club invite applications failed with ${response.status}`);
  }

  return response.json() as Promise<
    Array<{
      id: string;
      membershipCode?: string | null;
      inviteCode?: string | null;
      playerName: string;
      playerSurname: string;
      dateOfBirth?: string | null;
      ageGroup?: string | null;
      gender?: string | null;
      guardianName: string;
      guardianSurname?: string | null;
      guardianRelation?: string | null;
      guardianEmail: string;
      guardianEmailConfirm?: string | null;
      guardianPhone: string;
      province?: string | null;
      allergiesOrConditions?: string | null;
      birthCertificateFileName?: string | null;
      birthCertificateDocumentId?: string | null;
      birthCertificateFileUrl?: string | null;
      status: "PAYMENT_PENDING" | "PAID" | "SUCCESSFUL" | "UNSUCCESSFUL";
      createdAt: string;
      membershipNumber?: string | null;
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
      emailStatus?: string;
      emailError?: string | null;
      emailSentAt?: string;
      informationCheckEmailStatus?: string;
      informationCheckEmailError?: string | null;
      informationCheckEmailSentAt?: string;
      qualificationEmailStatus?: string;
      qualificationEmailError?: string | null;
      qualificationEmailSentAt?: string;
    }>
  >;
}

export async function uploadTrialBirthCertificate(
  trialApplicationId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("document", file);

  const response = await fetch(
    `${apiBaseUrl}/api/academy/trials/${trialApplicationId}/birth-certificate`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Birth certificate upload failed with ${response.status}`);
  }

  return response.json() as Promise<{
    id: string;
    originalName?: string | null;
    fileUrl: string;
  }>;
}

export async function fetchAdminDocumentFile(documentId: string, token: string) {
  const response = await fetch(
    `${apiBaseUrl}/api/academy/admin/documents/${documentId}/file`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Document preview failed with ${response.status}`);
  }

  return response.blob();
}

export async function getClubInviteTrialCodes(token: string) {
  const response = await fetch(`${apiBaseUrl}/api/academy/admin/club-invite-trials`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Club invite list failed with ${response.status}`);
  }

  return response.json() as Promise<
    Array<{
      id: string;
      playerName: string;
      email: string;
      emailConfirm: string;
      membershipCode: string;
      inviteCode: string;
      emailStatus?: string | null;
      emailError?: string | null;
      emailSentAt?: string | null;
      createdAt: string;
    }>
  >;
}

export async function createClubInviteTrialCode(
  payload: { playerName: string; email: string; emailConfirm: string; emailBody?: string },
  token: string,
) {
  const response = await fetch(`${apiBaseUrl}/api/academy/admin/club-invite-trials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Club invite generation failed with ${response.status}`);
  }

  return response.json() as Promise<{
    id: string;
    playerName: string;
    email: string;
    emailConfirm: string;
    membershipCode: string;
    inviteCode: string;
    emailStatus?: string | null;
    emailError?: string | null;
    emailSentAt?: string | null;
    createdAt: string;
  }>;
}

export async function resendClubInviteTrialCodeEmail(
  inviteId: string,
  token: string,
  emailBody?: string,
) {
  const response = await fetch(
    `${apiBaseUrl}/api/academy/admin/club-invite-trials/${inviteId}/send-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ emailBody }),
    },
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Club invite resend failed with ${response.status}`);
  }

  return response.json() as Promise<{
    id: string;
    playerName: string;
    email: string;
    emailConfirm: string;
    membershipCode: string;
    inviteCode: string;
    emailStatus?: string | null;
    emailError?: string | null;
    emailSentAt?: string | null;
    createdAt: string;
  }>;
}

export async function resetTestingData(token: string) {
  const response = await fetch(`${apiBaseUrl}/api/academy/admin/testing/reset-data`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Testing data reset failed with ${response.status}`);
  }

  return response.json() as Promise<{ resetAt: string }>;
}

export async function reviewTrialApplication(
  trialApplicationId: string,
  status: "SUCCESSFUL" | "UNSUCCESSFUL",
  token: string,
  emailBody?: string,
) {
  const response = await fetch(
    `${apiBaseUrl}/api/academy/admin/trials/${trialApplicationId}/review`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, emailBody }),
    },
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Trial review failed with ${response.status}`);
  }

  return response.json() as Promise<{
    trialApplication: {
      id: string;
      status: "SUCCESSFUL" | "UNSUCCESSFUL";
    };
    code?: {
      id: string;
      code: string;
      membershipNumber?: string | null;
    } | null;
    emailLog?: {
      id: string;
      status: string;
      error?: string | null;
      createdAt: string;
    };
  }>;
}

export async function sendTrialInformationCheckEmail(
  trialApplicationId: string,
  status: "SUCCESSFUL" | "UNSUCCESSFUL",
  token: string,
  emailBody?: string,
) {
  const response = await fetch(
    `${apiBaseUrl}/api/academy/admin/trials/${trialApplicationId}/information-check-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, emailBody }),
    },
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Information check email failed with ${response.status}`);
  }

  return response.json() as Promise<{
    id: string;
    status: string;
    error?: string | null;
    createdAt: string;
  }>;
}

export async function resendTrialReviewEmail(
  trialApplicationId: string,
  status: "SUCCESSFUL" | "UNSUCCESSFUL",
  token: string,
  emailBody?: string,
) {
  const response = await fetch(
    `${apiBaseUrl}/api/academy/admin/trials/${trialApplicationId}/review-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, emailBody }),
    },
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Review email resend failed with ${response.status}`);
  }

  return response.json() as Promise<{
    id: string;
    status: string;
    error?: string | null;
    createdAt: string;
  }>;
}

export async function reviewClubInviteApplication(
  applicationId: string,
  status: "SUCCESSFUL" | "UNSUCCESSFUL",
  token: string,
  emailBody?: string,
) {
  const response = await fetch(
    `${apiBaseUrl}/api/academy/admin/club-invite-applications/${applicationId}/review`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, emailBody }),
    },
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Club invite review failed with ${response.status}`);
  }

  return response.json() as Promise<{
    clubInviteApplication: {
      id: string;
      status: "SUCCESSFUL" | "UNSUCCESSFUL";
    };
    code?: {
      id: string;
      code: string;
      membershipNumber?: string | null;
    } | null;
    emailLog?: {
      id: string;
      status: string;
      error?: string | null;
      createdAt: string;
    };
  }>;
}

export async function sendClubInviteInformationCheckEmail(
  applicationId: string,
  status: "SUCCESSFUL" | "UNSUCCESSFUL",
  token: string,
  emailBody?: string,
) {
  const response = await fetch(
    `${apiBaseUrl}/api/academy/admin/club-invite-applications/${applicationId}/information-check-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, emailBody }),
    },
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Information check email failed with ${response.status}`);
  }

  return response.json() as Promise<{
    id: string;
    status: string;
    error?: string | null;
    createdAt: string;
  }>;
}

export async function resendClubInviteReviewEmail(
  applicationId: string,
  status: "SUCCESSFUL" | "UNSUCCESSFUL",
  token: string,
  emailBody?: string,
) {
  const response = await fetch(
    `${apiBaseUrl}/api/academy/admin/club-invite-applications/${applicationId}/review-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, emailBody }),
    },
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message || `Review email resend failed with ${response.status}`);
  }

  return response.json() as Promise<{
    id: string;
    status: string;
    error?: string | null;
    createdAt: string;
  }>;
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

export async function resendSimpleRegistrationEmail(
  registrationId: string,
  token: string,
  emailBody?: string,
) {
  const response = await fetch(
    `${apiBaseUrl}/api/academy/admin/simple-registrations/${registrationId}/send-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ emailBody }),
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
