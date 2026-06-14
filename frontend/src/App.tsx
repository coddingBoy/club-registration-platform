import { useEffect, useState } from "react";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import BackendStatus from "./components/BackendStatus";
import Layout from "./components/Layout";
import PlaceholderForm from "./components/PlaceholderForm";
import PlayerRegistration from "./components/PlayerRegistration";
import Tabs from "./components/Tabs";
import UrbanWarriorOnboarding from "./components/UrbanWarriorOnboarding";
import { getSimpleRegistrationForm } from "./data/registrationForms";
import { programmes } from "./data/programmes";
import type {
  AdminSession,
  ClubInviteApplication,
  AppTab,
  ClubInviteTrialCode,
  GeneratedCode,
  OnboardingCompletion,
  SimpleRegistrationRecord,
  SimpleRegistrationType,
  TrialApplication,
} from "./types";
import {
  getSimpleRegistrations,
  getClubInviteApplications,
  getTrialApplications,
  fetchAdminDocumentFile,
  createClubInviteTrialCode,
  getClubInviteTrialCodes,
  reviewTrialApplication,
  reviewClubInviteApplication,
  resetTestingData,
  resendCodeEmail,
  resendClubInviteTrialCodeEmail,
  resendSimpleRegistrationEmail,
} from "./utils/api";
import { loadFromStorage, saveToStorage } from "./utils/storage";
import { formatCurrency } from "./utils/validation";

const publicTabs: Array<{ id: AppTab; label: string; disabled?: boolean }> = [
  { id: "player", label: "Player Registration" },
  { id: "onboarding", label: "Urban Warrior Onboarding" },
  { id: "general-member", label: "General Member", disabled: true },
  { id: "holiday-camp", label: "Holiday Camp" },
  { id: "meet-greet", label: "Meet & Greet" },
  { id: "urban-lounge", label: "Urban Lounge Event", disabled: true },
  { id: "club-event", label: "Club Event", disabled: true },
  { id: "match-tickets", label: "Match Tickets", disabled: true },
  { id: "admin", label: "Admin" },
];

const storageKeys = {
  activeTab: "cts-active-tab",
  adminSession: "cts-admin-session",
  generatedCodes: "cts-generated-codes",
  trialApplications: "cts-trial-applications",
  simpleRegistrations: "cts-simple-registrations",
  onboardingCompletions: "cts-onboarding-completions",
};

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(() =>
    normalizeStoredTab(loadFromStorage(storageKeys.activeTab, "player")),
  );
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() =>
    loadFromStorage<AdminSession | null>(storageKeys.adminSession, null),
  );
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>(() =>
    loadFromStorage(storageKeys.generatedCodes, []),
  );
  const [trialApplications, setTrialApplications] = useState<TrialApplication[]>([]);
  const [clubInviteApplications, setClubInviteApplications] = useState<
    ClubInviteApplication[]
  >([]);
  const [clubInviteTrialCodes, setClubInviteTrialCodes] = useState<
    ClubInviteTrialCode[]
  >([]);
  const [simpleRegistrations, setSimpleRegistrations] = useState<
    SimpleRegistrationRecord[]
  >([]);
  const [onboardingCompletions, setOnboardingCompletions] = useState<
    OnboardingCompletion[]
  >(() => loadFromStorage(storageKeys.onboardingCompletions, []));
  useEffect(() => {
    saveToStorage(storageKeys.activeTab, activeTab);
  }, [activeTab]);

  useEffect(() => {
    saveToStorage(storageKeys.generatedCodes, generatedCodes);
  }, [generatedCodes]);

  useEffect(() => {
    saveToStorage(storageKeys.adminSession, adminSession);
  }, [adminSession]);

  useEffect(() => {
    let active = true;

    Promise.all([
      getTrialApplications(),
      getClubInviteApplications(),
      getSimpleRegistrations(),
    ])
      .then(([trials, clubInvites, registrations]) => {
        if (!active) return;
        setTrialApplications(trials.map(mapDatabaseTrial));
        setClubInviteApplications(clubInvites.map(mapDatabaseClubInviteApplication));
        setSimpleRegistrations(registrations.map(mapDatabaseSimpleRegistration));
      })
      .catch((error) => {
        console.error("Failed to load database state", error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!adminSession) {
      return;
    }

    let active = true;

    getClubInviteTrialCodes(adminSession.token)
      .then((invites) => {
        if (!active) return;
        setClubInviteTrialCodes(invites.map(mapClubInviteTrialCode));
      })
      .catch((error) => {
        console.error("Failed to load club invite trial codes", error);
      });

    return () => {
      active = false;
    };
  }, [adminSession]);

  useEffect(() => {
    saveToStorage(storageKeys.onboardingCompletions, onboardingCompletions);
  }, [onboardingCompletions]);

  const addTrialApplication = (application: TrialApplication) => {
    if (application.clubInviteCode) {
      setClubInviteApplications((current) => [application, ...current]);
      return;
    }

    setTrialApplications((current) => [application, ...current]);
  };

  const markCodeAsUsed = (codeValue: string) => {
    setGeneratedCodes((current) =>
      current.map((code) =>
        code.code === codeValue ? { ...code, used: true } : code,
      ),
    );
  };

  const addSimpleRegistration = (record: SimpleRegistrationRecord) => {
    setSimpleRegistrations((current) => {
      const existing = current.some((registration) => registration.id === record.id);

      if (existing) {
        return current.map((registration) =>
          registration.id === record.id ? record : registration,
        );
      }

      return [record, ...current];
    });
  };

  const addOnboardingCompletion = (record: OnboardingCompletion) => {
    setOnboardingCompletions((current) => [record, ...current]);
  };

  const resendTrialEmail = async (codeId: string) => {
    if (!adminSession) {
      throw new Error("Admin session expired. Please sign in again.");
    }

    const emailLog = await resendCodeEmail(codeId, adminSession.token);

    setTrialApplications((current) =>
      current.map((application) =>
        application.authorisationCodeId === codeId
          ? {
              ...application,
              emailStatus: emailLog.status,
              emailError: emailLog.error ?? undefined,
              emailSentAt: emailLog.createdAt,
            }
          : application,
      ),
    );
  };

  const reviewTrial = async (
    trialApplicationId: string,
    status: "SUCCESSFUL" | "UNSUCCESSFUL",
  ) => {
    if (!adminSession) {
      throw new Error("Admin session expired. Please sign in again.");
    }

    const result = await reviewTrialApplication(
      trialApplicationId,
      status,
      adminSession.token,
    );

    setTrialApplications((current) =>
      current.map((application) =>
        application.id === trialApplicationId
          ? {
              ...application,
              status: status === "SUCCESSFUL" ? "successful" : "unsuccessful",
              authorisationCode: result.code?.code ?? application.authorisationCode,
              authorisationCodeId: result.code?.id ?? application.authorisationCodeId,
              membershipNumber:
                result.code?.membershipNumber ??
                application.membershipNumber,
              emailStatus: result.emailLog?.status,
              emailError: result.emailLog?.error ?? undefined,
              emailSentAt: result.emailLog?.createdAt,
            }
          : application,
      ),
    );
  };

  const reviewClubInvite = async (
    applicationId: string,
    status: "SUCCESSFUL" | "UNSUCCESSFUL",
  ) => {
    if (!adminSession) {
      throw new Error("Admin session expired. Please sign in again.");
    }

    const result = await reviewClubInviteApplication(
      applicationId,
      status,
      adminSession.token,
    );

    setClubInviteApplications((current) =>
      current.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              status: status === "SUCCESSFUL" ? "successful" : "unsuccessful",
              authorisationCode: result.code?.code ?? application.authorisationCode,
              authorisationCodeId: result.code?.id ?? application.authorisationCodeId,
              membershipNumber:
                result.code?.membershipNumber ??
                application.membershipNumber,
              emailStatus: result.emailLog?.status,
              emailError: result.emailLog?.error ?? undefined,
              emailSentAt: result.emailLog?.createdAt,
            }
          : application,
      ),
    );
  };

  const resendSimpleRegistrationConfirmation = async (registrationId: string) => {
    if (!adminSession) {
      throw new Error("Admin session expired. Please sign in again.");
    }

    const emailLog = await resendSimpleRegistrationEmail(
      registrationId,
      adminSession.token,
    );

    setSimpleRegistrations((current) =>
      current.map((registration) =>
        registration.id === registrationId
          ? {
              ...registration,
              emailStatus: emailLog.status,
              emailError: emailLog.error ?? undefined,
              emailSentAt: emailLog.createdAt,
            }
          : registration,
      ),
    );
  };

  const previewTrialBirthCertificate = async (documentId: string) => {
    if (!adminSession) {
      throw new Error("Admin session expired. Please sign in again.");
    }

    const blob = await fetchAdminDocumentFile(documentId, adminSession.token);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const generateClubInviteTrialCode = async (payload: {
    playerName: string;
    email: string;
    emailConfirm: string;
  }) => {
    if (!adminSession) {
      throw new Error("Admin session expired. Please sign in again.");
    }

    const invite = await createClubInviteTrialCode(payload, adminSession.token);
    setClubInviteTrialCodes((current) => [
      mapClubInviteTrialCode(invite),
      ...current,
    ]);
  };

  const resendClubInviteTrialCode = async (inviteId: string) => {
    if (!adminSession) {
      throw new Error("Admin session expired. Please sign in again.");
    }

    const invite = await resendClubInviteTrialCodeEmail(inviteId, adminSession.token);

    setClubInviteTrialCodes((current) =>
      current.map((currentInvite) =>
        currentInvite.id === inviteId ? mapClubInviteTrialCode(invite) : currentInvite,
      ),
    );
  };

  const resetAdminTestingData = async () => {
    if (!adminSession) {
      throw new Error("Admin session expired. Please sign in again.");
    }

    await resetTestingData(adminSession.token);
    setTrialApplications([]);
    setClubInviteApplications([]);
    setClubInviteTrialCodes([]);
    setSimpleRegistrations([]);
    setGeneratedCodes([]);
    setOnboardingCompletions([]);
  };

  const simpleFormConfig = isSimpleRegistrationTab(activeTab)
    ? getSimpleRegistrationForm(activeTab)
    : undefined;

  const logoutAdmin = () => {
    setAdminSession(null);
  };

  return (
    <Layout>
      <section className="flow-main">
        <Tabs tabs={publicTabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "player" && (
          <PlayerRegistration
            onTrialApplicationSaved={addTrialApplication}
            onContinueToOnboarding={() => setActiveTab("onboarding")}
          />
        )}

        {activeTab === "admin" && (
          <>
            {!adminSession && <AdminLogin onLogin={setAdminSession} />}
            {adminSession && (
              <section className="admin-session-bar">
                <div>
                  <span>Signed in as</span>
                  <strong>{adminSession.admin.email}</strong>
                  <small>{adminSession.admin.role}</small>
                </div>
                <button className="secondary-button" type="button" onClick={logoutAdmin}>
                  Sign Out
                </button>
              </section>
            )}
            {adminSession && (
              <AdminPanel
                trialApplications={trialApplications}
                clubInviteApplications={clubInviteApplications}
                clubInviteTrialCodes={clubInviteTrialCodes}
                simpleRegistrations={simpleRegistrations}
                onboardingCompletions={onboardingCompletions}
                onGenerateClubInviteTrialCode={generateClubInviteTrialCode}
                onResendClubInviteTrialCode={resendClubInviteTrialCode}
                onResendTrialEmail={resendTrialEmail}
                onReviewTrial={reviewTrial}
                onReviewClubInviteApplication={reviewClubInvite}
                onPreviewTrialBirthCertificate={previewTrialBirthCertificate}
                onResendSimpleRegistrationEmail={resendSimpleRegistrationConfirmation}
                onResetTestingData={resetAdminTestingData}
              />
            )}
          </>
        )}

        {activeTab === "onboarding" && (
          <UrbanWarriorOnboarding
            key="manual-onboarding"
            codes={generatedCodes}
            prefill={null}
            onUseCode={markCodeAsUsed}
            onComplete={addOnboardingCompletion}
          />
        )}

        {simpleFormConfig && (
          <PlaceholderForm
            config={simpleFormConfig}
            onSubmitRegistration={addSimpleRegistration}
          />
        )}
      </section>

      <aside className="summary-column">
        <section className="product-card">
          <div className="product-image-placeholder">
            <span>Foundation</span>
          </div>
          <div className="product-body">
            {import.meta.env.DEV && <BackendStatus />}
            <p className="product-label">Academy Registration</p>
            <h2>Urban Warrior Programmes</h2>
            <p className="product-price">Apply Online</p>
            <div className="product-divider" />
            <ul className="summary-list">
              {programmes.map((programme) => (
                <li key={programme.id}>
                  {programme.title}: {formatCurrency(programme.registrationFee)} then{" "}
                  {formatCurrency(programme.monthlyFee)} monthly
                </li>
              ))}
              <li>New players start with the Trial pathway</li>
              <li>Existing players continue through Renewal</li>
              <li>Successful trialists receive a R500 credit on onboarding</li>
              <li>Programme onboarding includes code of conduct and debit order steps</li>
              <li>General registrations, camps, events, and ticket requests are available</li>
            </ul>
          </div>
        </section>
      </aside>
    </Layout>
  );
}

function mapDatabaseTrial(trial: Awaited<ReturnType<typeof getTrialApplications>>[number]): TrialApplication {
  const guardianEmailLog = trial.authorisationCode?.emailLogs?.find(
    (log) => log.to === trial.guardianEmail,
  );

  return {
    id: trial.id,
    playerName: trial.playerName,
    playerSurname: trial.playerSurname,
    dateOfBirth: trial.dateOfBirth?.slice(0, 10) ?? "",
    ageGroup: trial.ageGroup ?? "",
    gender: trial.gender ?? "",
    guardianName: trial.guardianName,
    guardianSurname: trial.guardianSurname ?? "",
    guardianRelation: trial.guardianRelation ?? "",
    guardianEmail: trial.guardianEmail,
    guardianEmailConfirm: trial.guardianEmailConfirm ?? trial.guardianEmail,
    guardianPhone: trial.guardianPhone,
    province: trial.province ?? "",
    allergiesOrConditions: trial.allergiesOrConditions ?? "",
    birthCertificateFileName: trial.birthCertificateFileName ?? "",
    birthCertificateDocumentId: trial.birthCertificateDocumentId ?? undefined,
    birthCertificateFileUrl: trial.birthCertificateFileUrl ?? undefined,
    submittedAt: trial.createdAt,
    status: mapTrialStatus(trial.status),
    paymentConfirmed: trial.status !== "PAYMENT_PENDING",
    authorisationCode: trial.authorisationCode?.code,
    authorisationCodeId: trial.authorisationCode?.id,
    membershipNumber:
      trial.membershipNumber ??
      trial.authorisationCode?.membershipNumber ??
      undefined,
    emailStatus: guardianEmailLog?.status ?? trial.emailStatus,
    emailError: guardianEmailLog?.error ?? trial.emailError ?? undefined,
    emailSentAt: guardianEmailLog?.createdAt ?? trial.emailSentAt,
  };
}

function mapDatabaseClubInviteApplication(
  application: Awaited<ReturnType<typeof getClubInviteApplications>>[number],
): ClubInviteApplication {
  const guardianEmailLog = application.authorisationCode?.emailLogs?.find(
    (log) => log.to === application.guardianEmail,
  );

  return {
    id: application.id,
    membershipCode: application.membershipCode ?? application.membershipNumber ?? "",
    clubInviteCode: application.inviteCode ?? "",
    playerName: application.playerName,
    playerSurname: application.playerSurname,
    dateOfBirth: application.dateOfBirth?.slice(0, 10) ?? "",
    ageGroup: application.ageGroup ?? "",
    gender: application.gender ?? "",
    guardianName: application.guardianName,
    guardianSurname: application.guardianSurname ?? "",
    guardianRelation: application.guardianRelation ?? "",
    guardianEmail: application.guardianEmail,
    guardianEmailConfirm: application.guardianEmailConfirm ?? application.guardianEmail,
    guardianPhone: application.guardianPhone,
    province: application.province ?? "",
    allergiesOrConditions: application.allergiesOrConditions ?? "",
    birthCertificateFileName: application.birthCertificateFileName ?? "",
    birthCertificateDocumentId: application.birthCertificateDocumentId ?? undefined,
    birthCertificateFileUrl: application.birthCertificateFileUrl ?? undefined,
    submittedAt: application.createdAt,
    status: mapTrialStatus(application.status),
    paymentConfirmed: application.status !== "PAYMENT_PENDING",
    authorisationCode: application.authorisationCode?.code,
    authorisationCodeId: application.authorisationCode?.id,
    membershipNumber: application.membershipNumber ?? application.membershipCode ?? undefined,
    emailStatus: guardianEmailLog?.status ?? application.emailStatus,
    emailError: guardianEmailLog?.error ?? application.emailError ?? undefined,
    emailSentAt: guardianEmailLog?.createdAt ?? application.emailSentAt,
  };
}

function mapTrialStatus(status: string): TrialApplication["status"] {
  if (status === "PAYMENT_PENDING") return "payment-pending";
  if (status === "SUCCESSFUL") return "successful";
  if (status === "UNSUCCESSFUL") return "unsuccessful";
  return "paid";
}

function mapDatabaseSimpleRegistration(
  registration: Awaited<ReturnType<typeof getSimpleRegistrations>>[number],
): SimpleRegistrationRecord {
  return {
    id: registration.id,
    type: registration.type as SimpleRegistrationType,
    referenceNumber: registration.referenceNumber,
    membershipCode: registration.specificFields?.membershipCode,
    paymentStatus: registration.specificFields?.paymentStatus as
      | SimpleRegistrationRecord["paymentStatus"]
      | undefined,
    paymentCompletedAt: registration.specificFields?.paymentCompletedAt,
    emailStatus: registration.emailStatus,
    emailError: registration.emailError ?? undefined,
    emailSentAt: registration.emailSentAt,
    fullName: registration.fullName,
    email: registration.email,
    phone: registration.phone,
    dateOfBirth: registration.dateOfBirth?.slice(0, 10),
    parentGuardian: registration.parentGuardian ?? undefined,
    specificFields: registration.specificFields ?? {},
    submittedAt: registration.createdAt,
    emailSimulatedAt: registration.emailSimulatedAt ?? registration.createdAt,
  };
}

function mapClubInviteTrialCode(
  invite: Awaited<ReturnType<typeof getClubInviteTrialCodes>>[number],
): ClubInviteTrialCode {
  return {
    id: invite.id,
    playerName: invite.playerName,
    email: invite.email,
    emailConfirm: invite.emailConfirm,
    membershipCode: invite.membershipCode,
    inviteCode: invite.inviteCode,
    emailStatus: invite.emailStatus ?? undefined,
    emailError: invite.emailError ?? undefined,
    emailSentAt: invite.emailSentAt ?? undefined,
    createdAt: invite.createdAt,
  };
}

function normalizeStoredTab(tab: AppTab | "general" | "trial" | "programmes"): AppTab {
  if (tab === "general" || tab === "trial") {
    return "player";
  }

  if (tab === "programmes") {
    return "player";
  }

  if (isDisabledTab(tab)) {
    return "player";
  }

  return tab;
}

function isDisabledTab(tab: AppTab) {
  return publicTabs.some((item) => item.id === tab && item.disabled);
}

function isSimpleRegistrationTab(tab: AppTab): tab is SimpleRegistrationType {
  return [
    "general-member",
    "holiday-camp",
    "meet-greet",
    "urban-lounge",
    "club-event",
    "match-tickets",
  ].includes(tab);
}

export default App;
