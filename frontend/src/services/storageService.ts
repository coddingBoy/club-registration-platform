import type { AdminSession, AppTab, GeneratedCode, OnboardingCompletion } from "../types";
import { loadFromStorage, saveToStorage } from "../utils/storage";

export const storageKeys = {
  activeTab: "cts-active-tab",
  adminSession: "cts-admin-session",
  generatedCodes: "cts-generated-codes",
  onboardingCompletions: "cts-onboarding-completions",
};

export function loadActiveTab() {
  return normalizeStoredTab(loadFromStorage(storageKeys.activeTab, "player"));
}

export function saveActiveTab(tab: AppTab) {
  saveToStorage(storageKeys.activeTab, tab);
}

export function loadAdminSession() {
  return loadFromStorage<AdminSession | null>(storageKeys.adminSession, null);
}

export function saveAdminSession(session: AdminSession | null) {
  saveToStorage(storageKeys.adminSession, session);
}

export function loadGeneratedCodes() {
  return loadFromStorage<GeneratedCode[]>(storageKeys.generatedCodes, []);
}

export function saveGeneratedCodes(codes: GeneratedCode[]) {
  saveToStorage(storageKeys.generatedCodes, codes);
}

export function loadOnboardingCompletions() {
  return loadFromStorage<OnboardingCompletion[]>(storageKeys.onboardingCompletions, []);
}

export function saveOnboardingCompletions(records: OnboardingCompletion[]) {
  saveToStorage(storageKeys.onboardingCompletions, records);
}

function normalizeStoredTab(tab: AppTab | "general" | "trial" | "programmes"): AppTab {
  if (tab === "general" || tab === "trial") {
    return "player";
  }

  if (tab === "programmes") {
    return "general-member";
  }

  return tab;
}
