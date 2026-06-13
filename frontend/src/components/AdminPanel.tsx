import type {
  OnboardingCompletion,
  SimpleRegistrationRecord,
  TrialApplication,
} from "../types";

type AdminPanelProps = {
  trialApplications: TrialApplication[];
  simpleRegistrations: SimpleRegistrationRecord[];
  onboardingCompletions: OnboardingCompletion[];
};

function AdminPanel({
  trialApplications,
  simpleRegistrations,
  onboardingCompletions,
}: AdminPanelProps) {
  const exportCsv = () => {
    const rows = [
      ["type", "name", "email", "reference", "status", "programmeOrMembership", "submittedOrCompletedAt"],
      ...trialApplications.map((application) => [
        "trial",
        `${application.playerName} ${application.playerSurname}`,
        application.guardianEmail,
        application.authorisationCode ?? "",
        getTrialStatusLabel(application.status),
        application.membershipNumber ?? "",
        application.submittedAt,
      ]),
      ...simpleRegistrations.map((registration) => [
        registration.type,
        registration.fullName,
        registration.email,
        registration.referenceNumber,
        "Submitted",
        "",
        registration.submittedAt,
      ]),
      ...onboardingCompletions.map((completion) => [
        "onboarding",
        `${completion.playerName} ${completion.playerSurname}`,
        completion.guardianEmail,
        completion.passportNumber,
        "Completed",
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
          New Trial applications now automatically create a membership number and
          onboarding authorisation code. Use this dashboard to review submitted data
          and completion progress.
        </p>
      </div>

      <div className="checkout-panel">
        <div className="admin-summary-grid">
          <article className="status-card">
            <span>Trial Applications</span>
            <strong>{trialApplications.length}</strong>
            <p>New Trial submissions saved in the backend.</p>
          </article>
          <article className="status-card">
            <span>Onboarding Issued</span>
            <strong>
              {trialApplications.filter((application) => application.authorisationCode).length}
            </strong>
            <p>Applications with generated authorisation codes.</p>
          </article>
          <article className="status-card">
            <span>Onboarding Complete</span>
            <strong>{onboardingCompletions.length}</strong>
            <p>Completed Urban Warrior onboarding records.</p>
          </article>
          <article className="status-card">
            <span>Other Registrations</span>
            <strong>{simpleRegistrations.length}</strong>
            <p>General member, event, camp, and ticket submissions.</p>
          </article>
        </div>

        <div className="admin-toolbar clean-toolbar">
          <button className="secondary-button" type="button" onClick={exportCsv}>
            Export CSV
          </button>
        </div>

        <div className="code-list">
          <h2>New Trial Applications</h2>
          {trialApplications.length === 0 && <p>No New Trial applications yet.</p>}
          {trialApplications.map((application) => (
            <article className="status-card review-card" key={application.id}>
              <span>{getTrialStatusLabel(application.status)}</span>
              <strong>
                {application.playerName} {application.playerSurname}
              </strong>
              <p>Guardian email: {application.guardianEmail}</p>
              <p>Guardian phone: {application.guardianPhone}</p>
              <p>Submitted: {new Date(application.submittedAt).toLocaleString()}</p>
              {application.authorisationCode ? (
                <p>Authorisation code: {application.authorisationCode}</p>
              ) : (
                <p>Authorisation code: not issued</p>
              )}
              {application.membershipNumber && (
                <p>Membership number: {application.membershipNumber}</p>
              )}
            </article>
          ))}
        </div>

        <div className="product-divider" />

        <div className="code-list">
          <h2>Onboarding Completion Status</h2>
          {onboardingCompletions.length === 0 && <p>No completed onboarding records.</p>}
          {onboardingCompletions.map((completion) => (
            <article className="status-card" key={completion.id}>
              <span>{getCodeTypeLabel(completion.codeType)}</span>
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

        <div className="product-divider" />

        <div className="code-list">
          <h2>Other Registration Submissions</h2>
          {simpleRegistrations.length === 0 && <p>No other registration submissions.</p>}
          {simpleRegistrations.map((registration) => (
            <article className="status-card" key={registration.id}>
              <span>{registration.type}</span>
              <strong>{registration.fullName}</strong>
              <p>{registration.email}</p>
              <p>Phone: {registration.phone}</p>
              <p>Reference: {registration.referenceNumber}</p>
              <p>Submitted: {new Date(registration.submittedAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function getTrialStatusLabel(status: TrialApplication["status"]) {
  if (status === "successful") return "Onboarding Issued";
  if (status === "unsuccessful") return "Not Approved";
  if (status === "paid") return "Legacy: Awaiting Review";
  return "Legacy: Payment Pending";
}

function getCodeTypeLabel(type: OnboardingCompletion["codeType"]) {
  return type === "trial-authorisation" ? "New Trial" : "Renewal";
}

export default AdminPanel;
