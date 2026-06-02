import { useEffect, useState } from "react";
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
  AppTab,
  GeneratedCode,
  OnboardingCompletion,
  SimpleRegistrationRecord,
  SimpleRegistrationType,
  TrialApplication,
} from "./types";
import {
  getSimpleRegistrations,
  getTrialApplications,
} from "./utils/api";
import { loadFromStorage, saveToStorage } from "./utils/storage";
import { formatCurrency } from "./utils/validation";

const publicTabs: Array<{ id: AppTab; label: string }> = [
  { id: "player", label: "Player Registration" },
  { id: "onboarding", label: "Urban Warrior Onboarding" },
  { id: "general-member", label: "General Member" },
  { id: "holiday-camp", label: "Holiday Camp" },
  { id: "meet-greet", label: "Meet & Greet" },
  { id: "urban-lounge", label: "Urban Lounge Event" },
  { id: "club-event", label: "Club Event" },
  { id: "match-tickets", label: "Match Tickets" },
];

const storageKeys = {
  activeTab: "cts-active-tab",
  generatedCodes: "cts-generated-codes",
  trialApplications: "cts-trial-applications",
  simpleRegistrations: "cts-simple-registrations",
  onboardingCompletions: "cts-onboarding-completions",
};

function App() {
  const adminEnabled =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("admin") === "true";
  const tabs = adminEnabled
    ? [
        ...publicTabs.slice(0, 1),
        { id: "admin" as const, label: "Admin Codes" },
        ...publicTabs.slice(1),
      ]
    : publicTabs;
  const [activeTab, setActiveTab] = useState<AppTab>(() =>
    normalizeStoredTab(loadFromStorage(storageKeys.activeTab, "player"), adminEnabled),
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

  useEffect(() => {
    saveToStorage(storageKeys.activeTab, activeTab);
  }, [activeTab]);

  useEffect(() => {
    saveToStorage(storageKeys.generatedCodes, generatedCodes);
  }, [generatedCodes]);

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

  const addGeneratedCode = (code: GeneratedCode) => {
    setGeneratedCodes((current) => [code, ...current]);
  };

  const simulateEmailSent = (codeId: string) => {
    setGeneratedCodes((current) =>
      current.map((code) =>
        code.id === codeId ? { ...code, emailSentAt: new Date().toISOString() } : code,
      ),
    );
  };

  const addTrialApplication = (application: TrialApplication) => {
    setTrialApplications((current) => [application, ...current]);
  };

  const reviewTrialApplication = (
    applicationId: string,
    status: "successful" | "unsuccessful",
    code?: GeneratedCode,
  ) => {
    setTrialApplications((current) =>
      current.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              status,
              authorisationCode: code?.code ?? application.authorisationCode,
            }
          : application,
      ),
    );

    if (code) {
      addGeneratedCode(code);
    }
  };

  const markCodeAsUsed = (codeValue: string) => {
    setGeneratedCodes((current) =>
      current.map((code) =>
        code.code === codeValue ? { ...code, used: true } : code,
      ),
    );
  };

  const addSimpleRegistration = (record: SimpleRegistrationRecord) => {
    setSimpleRegistrations((current) => [record, ...current]);
  };

  const addOnboardingCompletion = (record: OnboardingCompletion) => {
    setOnboardingCompletions((current) => [record, ...current]);
  };

  const simpleFormConfig = isSimpleRegistrationTab(activeTab)
    ? getSimpleRegistrationForm(activeTab)
    : undefined;

  return (
    <Layout>
      <section className="flow-main">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "player" && (
          <PlayerRegistration
            onTrialApplicationSaved={addTrialApplication}
            onContinueToOnboarding={() => setActiveTab("onboarding")}
          />
        )}

        {activeTab === "admin" && adminEnabled && (
          <AdminPanel
            codes={generatedCodes}
            trialApplications={trialApplications}
            simpleRegistrations={simpleRegistrations}
            onboardingCompletions={onboardingCompletions}
            onGenerateRenewalCode={addGeneratedCode}
            onReviewTrial={reviewTrialApplication}
            onSimulateEmailSent={simulateEmailSent}
          />
        )}

        {activeTab === "onboarding" && (
          <UrbanWarriorOnboarding
            codes={generatedCodes}
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

function normalizeStoredTab(
  tab: AppTab | "general" | "trial" | "programmes",
  adminEnabled: boolean,
): AppTab {
  if (tab === "general" || tab === "trial") {
    return "player";
  }

  if (tab === "programmes") {
    return "general-member";
  }

  if (tab === "admin" && !adminEnabled) {
    return "player";
  }

  return tab;
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
