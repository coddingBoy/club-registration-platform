import { useMemo, useState } from "react";
import { mockPlayers } from "../data/mockPlayers";
import { programmes } from "../data/programmes";
import type {
  GeneratedCode,
  OnboardingCompletion,
  SimpleRegistrationRecord,
  TrialApplication,
} from "../types";
import { generateRenewalCode, generateTrialAuthorisationCode } from "../utils/codeGenerator";

type AdminPanelProps = {
  codes: GeneratedCode[];
  trialApplications: TrialApplication[];
  simpleRegistrations: SimpleRegistrationRecord[];
  onboardingCompletions: OnboardingCompletion[];
  onGenerateRenewalCode: (code: GeneratedCode) => void;
  onReviewTrial: (
    applicationId: string,
    status: "successful" | "unsuccessful",
    code?: GeneratedCode,
  ) => void;
  onSimulateEmailSent: (codeId: string) => void;
};

function AdminPanel({
  codes,
  trialApplications,
  simpleRegistrations,
  onboardingCompletions,
  onGenerateRenewalCode,
  onReviewTrial,
  onSimulateEmailSent,
}: AdminPanelProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(mockPlayers[0]?.id ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const [programmeFilter, setProgrammeFilter] = useState("all");
  const [ageGroupFilter, setAgeGroupFilter] = useState("all");

  const filteredPlayers = useMemo(
    () =>
      mockPlayers
        .filter((player) => player.status === "current")
        .filter((player) => {
          const searchable = `${player.name} ${player.surname} ${player.membershipNumber} ${player.guardianEmail}`.toLowerCase();
          return searchable.includes(searchTerm.toLowerCase());
        })
        .filter((player) =>
          programmeFilter === "all" ? true : player.programmeId === programmeFilter,
        )
        .filter((player) =>
          ageGroupFilter === "all" ? true : player.ageGroup === ageGroupFilter,
        ),
    [ageGroupFilter, programmeFilter, searchTerm],
  );
  const selectedPlayer = mockPlayers.find((player) => player.id === selectedPlayerId);
  const ageGroups = Array.from(new Set(mockPlayers.map((player) => player.ageGroup)));

  const createRenewalCode = (player: (typeof mockPlayers)[number]) => {
    onGenerateRenewalCode({
      id: crypto.randomUUID(),
      code: generateRenewalCode(),
      playerName: `${player.name} ${player.surname}`,
      playerEmail: player.guardianEmail,
      type: "renewal",
      membershipNumber: player.membershipNumber,
      used: false,
    });
  };

  const generateCode = () => {
    if (!selectedPlayer) return;
    createRenewalCode(selectedPlayer);
  };

  const bulkGenerateRenewalCodes = () => {
    filteredPlayers.forEach(createRenewalCode);
  };

  const markTrialSuccessful = (application: TrialApplication) => {
    const code: GeneratedCode = {
      id: crypto.randomUUID(),
      code: generateTrialAuthorisationCode(),
      playerName: `${application.playerName} ${application.playerSurname}`,
      playerEmail: application.guardianEmail,
      type: "trial-authorisation",
      used: false,
    };

    onReviewTrial(application.id, "successful", code);
  };

  const exportCsv = () => {
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

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cape-town-spurs-registrations.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="form-card">
      <div className="intro-panel">
        <p>
          Admin tools are still running on localStorage. This is now complex enough
          that backend planning should start for database, auth, email, payments,
          document storage, and audit logs.
        </p>
      </div>
      <div className="checkout-panel">
        <div className="backend-note">
          <strong>Backend planning checkpoint</strong>
          <p>
            LocalStorage is useful for this MVP, but admin search, bulk actions,
            code usage, exports, and completion status should move to a backend.
          </p>
        </div>

        <div className="admin-toolbar">
          <input
            aria-label="Search players"
            placeholder="Search players, membership, email"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            aria-label="Filter by programme"
            value={programmeFilter}
            onChange={(event) => setProgrammeFilter(event.target.value)}
          >
            <option value="all">All programmes</option>
            {programmes.map((programme) => (
              <option key={programme.id} value={programme.id}>
                {programme.title}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by age group"
            value={ageGroupFilter}
            onChange={(event) => setAgeGroupFilter(event.target.value)}
          >
            <option value="all">All age groups</option>
            {ageGroups.map((ageGroup) => (
              <option key={ageGroup} value={ageGroup}>
                {ageGroup}
              </option>
            ))}
          </select>
          <button className="secondary-button" type="button" onClick={exportCsv}>
            Export CSV
          </button>
        </div>

        <div className="code-list">
          <h2>Trial Applications</h2>
          {trialApplications.length === 0 && (
            <p>No paid trial applications waiting for review.</p>
          )}
          {trialApplications.map((application) => (
            <article className="status-card review-card" key={application.id}>
              <span>{application.status}</span>
              <strong>
                {application.playerName} {application.playerSurname}
              </strong>
              <p>
                {application.guardianEmail} - submitted{" "}
                {new Date(application.submittedAt).toLocaleDateString()}
              </p>
              {application.authorisationCode && (
                <p>Authorisation code: {application.authorisationCode}</p>
              )}
              {application.status === "paid" && (
                <div className="review-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => onReviewTrial(application.id, "unsuccessful")}
                  >
                    Mark Unsuccessful
                  </button>
                  <button
                    className="submit-button inline-submit"
                    type="button"
                    onClick={() => markTrialSuccessful(application)}
                  >
                    Mark Successful
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="product-divider" />

        <div className="code-list">
          <h2>Current Players</h2>
          <div className="programme-grid admin-player-grid">
            {filteredPlayers.map((player) => {
              const programme = programmes.find((item) => item.id === player.programmeId);
              return (
                <article className="status-card" key={player.id}>
                  <span>{player.ageGroup}</span>
                  <strong>
                    {player.name} {player.surname}
                  </strong>
                  <p>Membership: {player.membershipNumber}</p>
                  <p>Programme: {programme?.title ?? "Unknown"}</p>
                  <p>{player.guardianEmail}</p>
                </article>
              );
            })}
          </div>
          <label className="field-label" htmlFor="currentPlayer">
            Existing Player
          </label>
          <select
            id="currentPlayer"
            value={selectedPlayerId}
            onChange={(event) => setSelectedPlayerId(event.target.value)}
          >
            {filteredPlayers.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name} {player.surname} - {player.membershipNumber}
              </option>
            ))}
          </select>
          <div className="review-actions">
            <button className="submit-button inline-submit" type="button" onClick={generateCode}>
              Generate Renewal Code
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={bulkGenerateRenewalCodes}
            >
              Bulk Generate for Filtered
            </button>
          </div>
        </div>

        <div className="code-list">
          <h2>Generated Codes</h2>
          {codes.length === 0 && <p>No temporary codes generated yet.</p>}
          {codes.map((code) => (
            <article className="status-card" key={code.id}>
              <span>{code.used ? "used" : "unused"} - {code.type}</span>
              <strong>{code.code}</strong>
              <p>
                {code.playerName} - {code.playerEmail}
              </p>
              {code.membershipNumber && <p>Membership: {code.membershipNumber}</p>}
              <p>
                Email:{" "}
                {code.emailSentAt
                  ? `sent ${new Date(code.emailSentAt).toLocaleString()}`
                  : "not sent"}
              </p>
              {!code.emailSentAt && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => onSimulateEmailSent(code.id)}
                >
                  Simulate Sending Email
                </button>
              )}
            </article>
          ))}
        </div>

        <div className="code-list">
          <h2>Onboarding Completion Status</h2>
          {onboardingCompletions.length === 0 && <p>No completed onboarding records.</p>}
          {onboardingCompletions.map((completion) => (
            <article className="status-card" key={completion.id}>
              <span>{completion.codeType}</span>
              <strong>
                {completion.playerName} {completion.playerSurname}
              </strong>
              <p>Programme: {completion.programmeTitle}</p>
              <p>Passport: {completion.passportNumber}</p>
              <p>Paid: R {completion.amountPaid.toLocaleString("en-ZA")}</p>
              <p>Completed: {new Date(completion.completedAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AdminPanel;
