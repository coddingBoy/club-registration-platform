import { programmes } from "../data/programmes";
import type { MockPlayer, OnboardingCompletion, SimpleRegistrationRecord, TrialApplication } from "../types";

export type PlayerFilters = {
  searchTerm: string;
  programmeFilter: string;
  ageGroupFilter: string;
};

export function filterCurrentPlayers(players: MockPlayer[], filters: PlayerFilters) {
  return players
    .filter((player) => player.status === "current")
    .filter((player) => {
      const searchable =
        `${player.name} ${player.surname} ${player.membershipNumber} ${player.guardianEmail}`.toLowerCase();
      return searchable.includes(filters.searchTerm.toLowerCase());
    })
    .filter((player) =>
      filters.programmeFilter === "all" ? true : player.programmeId === filters.programmeFilter,
    )
    .filter((player) =>
      filters.ageGroupFilter === "all" ? true : player.ageGroup === filters.ageGroupFilter,
    );
}

export function getProgrammeTitle(programmeId: string) {
  return programmes.find((programme) => programme.id === programmeId)?.title ?? "Unknown";
}

export function buildRegistrationsCsv(
  trialApplications: TrialApplication[],
  simpleRegistrations: SimpleRegistrationRecord[],
  onboardingCompletions: OnboardingCompletion[],
) {
  const rows = [
    ["type", "name", "email", "reference", "status", "programme", "submittedOrCompletedAt"],
    ...trialApplications.map((application) => [
      "trial",
      `${application.playerName} ${application.playerSurname}`,
      application.guardianEmail,
      application.authorisationCode ?? "",
      application.status,
      "",
      application.submittedAt,
    ]),
    ...simpleRegistrations.map((registration) => [
      registration.type,
      registration.fullName,
      registration.email,
      registration.referenceNumber,
      "submitted",
      "",
      registration.submittedAt,
    ]),
    ...onboardingCompletions.map((completion) => [
      "onboarding",
      `${completion.playerName} ${completion.playerSurname}`,
      completion.guardianEmail,
      completion.passportNumber,
      "completed",
      completion.programmeTitle,
      completion.completedAt,
    ]),
  ];

  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
