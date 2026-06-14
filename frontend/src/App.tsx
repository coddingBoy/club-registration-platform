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
  AppTab,
  GeneratedCode,
  OnboardingCompletion,
  SimpleRegistrationRecord,
  SimpleRegistrationType,
  TrialApplication,
  TrialOnboardingCredentials,
} from "./types";
import {
  getSimpleRegistrations,
  getTrialApplications,
  resendCodeEmail,
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
  const [simpleRegistrations, setSimpleRegistrations] = useState<
    SimpleRegistrationRecord[]
  >([]);
  const [onboardingCompletions, setOnboardingCompletions] = useState<
    OnboardingCompletion[]
  >(() => loadFromStorage(storageKeys.onboardingCompletions, []));
  const [onboardingPrefill, setOnboardingPrefill] =
    useState<TrialOnboardingCredentials | null>(null);

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

    Promise.all([getTrialApplications(), getSimpleRegistrations()])
      .then(([trials, registrations]) => {
        if (!active) return;
        setTrialApplications(trials.map(mapDatabaseTrial));
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
    saveToStorage(storageKeys.onboardingCompletions, onboardingCompletions);
  }, [onboardingCompletions]);

  const addTrialApplication = (application: TrialApplication) => {
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
            onTrialCredentialsIssued={setOnboardingPrefill}
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
                simpleRegistrations={simpleRegistrations}
                onboardingCompletions={onboardingCompletions}
                onResendTrialEmail={resendTrialEmail}
                onResendSimpleRegistrationEmail={resendSimpleRegistrationConfirmation}
              />
            )}
          </>
        )}

        {activeTab === "onboarding" && (
          <UrbanWarriorOnboarding
            key={
              onboardingPrefill
                ? `${onboardingPrefill.authorisationCode}-${onboardingPrefill.membershipNumber}`
                : "manual-onboarding"
            }
            codes={generatedCodes}
            prefill={onboardingPrefill}
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
    guardianName: trial.guardianName,
    guardianEmail: trial.guardianEmail,
    guardianPhone: trial.guardianPhone,
    submittedAt: trial.createdAt,
    status: mapTrialStatus(trial.status),
    paymentConfirmed: trial.status !== "PAYMENT_PENDING",
    authorisationCode: trial.authorisationCode?.code,
    authorisationCodeId: trial.authorisationCode?.id,
    membershipNumber: trial.authorisationCode?.membershipNumber ?? undefined,
    emailStatus: guardianEmailLog?.status,
    emailError: guardianEmailLog?.error ?? undefined,
    emailSentAt: guardianEmailLog?.createdAt,
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
