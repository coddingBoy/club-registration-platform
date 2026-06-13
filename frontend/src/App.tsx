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
import { markCodeEmailSent, markCodeUsed } from "./services/codeService";
import {
  isSimpleRegistrationType,
  mapDatabaseSimpleRegistration,
} from "./services/registrationService";
import {
  loadActiveTab,
  loadAdminSession,
  loadGeneratedCodes,
  loadOnboardingCompletions,
  saveActiveTab,
  saveAdminSession,
  saveGeneratedCodes,
  saveOnboardingCompletions,
} from "./services/storageService";
import { mapDatabaseTrial } from "./services/trialService";
import type {
  AdminSession,
  AppTab,
  GeneratedCode,
  OnboardingCompletion,
  SimpleRegistrationRecord,
  TrialApplication,
} from "./types";
import { getSimpleRegistrations, getTrialApplications } from "./utils/api";
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
  { id: "admin", label: "Admin" },
];

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(loadActiveTab);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(loadAdminSession);
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>(loadGeneratedCodes);
  const [trialApplications, setTrialApplications] = useState<TrialApplication[]>([]);
  const [simpleRegistrations, setSimpleRegistrations] = useState<
    SimpleRegistrationRecord[]
  >([]);
  const [onboardingCompletions, setOnboardingCompletions] = useState<
    OnboardingCompletion[]
  >(loadOnboardingCompletions);

  useEffect(() => {
    saveActiveTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    saveGeneratedCodes(generatedCodes);
  }, [generatedCodes]);

  useEffect(() => {
    saveAdminSession(adminSession);
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
    saveOnboardingCompletions(onboardingCompletions);
  }, [onboardingCompletions]);

  const addGeneratedCode = (code: GeneratedCode) => {
    setGeneratedCodes((current) => [code, ...current]);
  };

  const simulateEmailSent = (codeId: string) => {
    setGeneratedCodes((current) => markCodeEmailSent(current, codeId));
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
    setGeneratedCodes((current) => markCodeUsed(current, codeValue));
  };

  const addSimpleRegistration = (record: SimpleRegistrationRecord) => {
    setSimpleRegistrations((current) => [record, ...current]);
  };

  const addOnboardingCompletion = (record: OnboardingCompletion) => {
    setOnboardingCompletions((current) => [record, ...current]);
  };

  const simpleFormConfig = isSimpleRegistrationType(activeTab)
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
            codes={generatedCodes}
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
                codes={generatedCodes}
                trialApplications={trialApplications}
                simpleRegistrations={simpleRegistrations}
                onboardingCompletions={onboardingCompletions}
                onGenerateRenewalCode={addGeneratedCode}
                onReviewTrial={reviewTrialApplication}
                onSimulateEmailSent={simulateEmailSent}
              />
            )}
          </>
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

export default App;
