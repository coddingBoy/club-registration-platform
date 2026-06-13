import { useMemo, useState } from "react";
import { mockPlayers } from "../data/mockPlayers";
import { programmes } from "../data/programmes";
import {
  buildRegistrationsCsv,
  filterCurrentPlayers,
  getProgrammeTitle,
} from "../services/adminService";
import {
  createRenewalCode as createRenewalCodeForPlayer,
  createTrialAuthorisationCode,
} from "../services/codeService";
import { buildTrialUnsuccessfulMessage } from "../services/emailService";
import type {
  GeneratedCode,
  OnboardingCompletion,
  SimpleRegistrationRecord,
  TrialApplication,
} from "../types";

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
  const [adminMessage, setAdminMessage] = useState("");

  const filteredPlayers = useMemo(
    () =>
      filterCurrentPlayers(mockPlayers, {
        searchTerm,
        programmeFilter,
        ageGroupFilter,
      }),
    [ageGroupFilter, programmeFilter, searchTerm],
  );
  const selectedPlayer =
    filteredPlayers.find((player) => player.id === selectedPlayerId) ?? filteredPlayers[0];
  const ageGroups = Array.from(new Set(mockPlayers.map((player) => player.ageGroup)));

  const createRenewalCode = (player: (typeof mockPlayers)[number]) => {
    onGenerateRenewalCode(createRenewalCodeForPlayer(player));
    setAdminMessage(`Renewal code generated for ${player.name} ${player.surname}.`);
  };

  const generateCode = () => {
    if (!selectedPlayer) return;
    createRenewalCode(selectedPlayer);
  };

  const bulkGenerateRenewalCodes = () => {
    filteredPlayers.forEach(createRenewalCode);
    setAdminMessage(`Generated ${filteredPlayers.length} renewal code(s).`);
  };

  const markTrialSuccessful = (application: TrialApplication) => {
    const code: GeneratedCode = createTrialAuthorisationCode(application);

    onReviewTrial(application.id, "successful", code);
    setAdminMessage(`Trial marked successful. Code generated for ${application.playerName}.`);
  };

  const markTrialUnsuccessful = (application: TrialApplication) => {
    onReviewTrial(application.id, "unsuccessful");
    setAdminMessage(
      buildTrialUnsuccessfulMessage(application.playerName, application.playerSurname),
    );
  };

  const exportCsv = () => {
    const csv = buildRegistrationsCsv(
      trialApplications,
      simpleRegistrations,
      onboardingCompletions,
    );
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
          Review trial applications, manage renewal codes, and monitor registration
          activity.
        </p>
      </div>
      <div className="checkout-panel">
        {adminMessage && <p className="success-message">{adminMessage}</p>}

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
                    onClick={() => markTrialUnsuccessful(application)}
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
              return (
                <article className="status-card" key={player.id}>
                  <span>{player.ageGroup}</span>
                  <strong>
                    {player.name} {player.surname}
                  </strong>
                  <p>Membership: {player.membershipNumber}</p>
                  <p>Programme: {getProgrammeTitle(player.programmeId)}</p>
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
            value={selectedPlayer?.id ?? ""}
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
