import { useState, type ReactNode } from "react";
import type {
  OnboardingCompletion,
  SimpleRegistrationRecord,
  SimpleRegistrationType,
  TrialApplication,
} from "../types";

type AdminPanelProps = {
  trialApplications: TrialApplication[];
  simpleRegistrations: SimpleRegistrationRecord[];
  onboardingCompletions: OnboardingCompletion[];
  onResendTrialEmail: (codeId: string) => Promise<void>;
  onResendSimpleRegistrationEmail: (registrationId: string) => Promise<void>;
};

const simpleRegistrationLabels: Record<SimpleRegistrationType, string> = {
  "general-member": "General Member",
  "holiday-camp": "Holiday Camp",
  "meet-greet": "Meet & Greet",
  "urban-lounge": "Urban Lounge Event",
  "club-event": "Club Event",
  "match-tickets": "Match Tickets",
};

function AdminPanel({
  trialApplications,
  simpleRegistrations,
  onboardingCompletions,
  onResendTrialEmail,
  onResendSimpleRegistrationEmail,
}: AdminPanelProps) {
  const [resendingCodeId, setResendingCodeId] = useState("");
  const [resendingRegistrationId, setResendingRegistrationId] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  const resendTrialEmail = async (application: TrialApplication) => {
    if (!application.authorisationCodeId) return;

    setResendingCodeId(application.authorisationCodeId);
    setResendMessage("");

    try {
      await onResendTrialEmail(application.authorisationCodeId);
      setResendMessage(
        `Resent email to ${application.guardianEmail}. Check the Email Status column for delivery result.`,
      );
    } catch (error) {
      setResendMessage(
        error instanceof Error ? error.message : "Email resend failed. Please try again.",
      );
    } finally {
      setResendingCodeId("");
    }
  };

  const resendSimpleRegistrationEmail = async (
    registration: SimpleRegistrationRecord,
  ) => {
    setResendingRegistrationId(registration.id);
    setResendMessage("");

    try {
      await onResendSimpleRegistrationEmail(registration.id);
      setResendMessage(
        `Resent email to ${registration.email}. Check the Email Status column for delivery result.`,
      );
    } catch (error) {
      setResendMessage(
        error instanceof Error ? error.message : "Email resend failed. Please try again.",
      );
    } finally {
      setResendingRegistrationId("");
    }
  };

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
          New Trial applications automatically create a membership number and
          onboarding authorisation code. Records are grouped below by registration
          type.
        </p>
      </div>

      <div className="checkout-panel admin-panel">
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
        {resendMessage && <p className="admin-action-message">{resendMessage}</p>}

        <AdminTableSection title="New Trial Applications">
          {trialApplications.length === 0 ? (
            <EmptyTableMessage message="No New Trial applications yet." />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Guardian</th>
                  <th>Phone</th>
                  <th>Membership</th>
                  <th>Authorisation Code</th>
                  <th>Email Status</th>
                  <th>Resend</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {trialApplications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <strong>
                        {application.playerName} {application.playerSurname}
                      </strong>
                    </td>
                    <td>{application.guardianEmail}</td>
                    <td>{application.guardianPhone}</td>
                    <td>{application.membershipNumber || "Not issued"}</td>
                    <td>{application.authorisationCode || "Not issued"}</td>
                    <td>
                      <span className={getEmailStatusClass(application.emailStatus)}>
                        {getEmailStatusLabel(application.emailStatus)}
                      </span>
                      {application.emailError && (
                        <small className="table-error">{application.emailError}</small>
                      )}
                    </td>
                    <td>
                      <button
                        className="secondary-button table-action-button"
                        type="button"
                        disabled={
                          !application.authorisationCodeId ||
                          resendingCodeId === application.authorisationCodeId
                        }
                        onClick={() => void resendTrialEmail(application)}
                      >
                        {resendingCodeId === application.authorisationCodeId
                          ? "Sending..."
                          : "Resend"}
                      </button>
                    </td>
                    <td>
                      <span className="table-status">
                        {getTrialStatusLabel(application.status)}
                      </span>
                    </td>
                    <td>{formatDateTime(application.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminTableSection>

        <AdminTableSection title="Onboarding Completions">
          {onboardingCompletions.length === 0 ? (
            <EmptyTableMessage message="No completed onboarding records." />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Email</th>
                  <th>Programme</th>
                  <th>Passport</th>
                  <th>Source</th>
                  <th>Amount Paid</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {onboardingCompletions.map((completion) => (
                  <tr key={completion.id}>
                    <td>
                      <strong>
                        {completion.playerName} {completion.playerSurname}
                      </strong>
                    </td>
                    <td>{completion.guardianEmail}</td>
                    <td>{completion.programmeTitle}</td>
                    <td>{completion.passportNumber}</td>
                    <td>{getCodeTypeLabel(completion.codeType)}</td>
                    <td>R {completion.amountPaid.toLocaleString("en-ZA")}</td>
                    <td>{formatDateTime(completion.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminTableSection>

        {Object.entries(simpleRegistrationLabels).map(([type, label]) => {
          const records = simpleRegistrations.filter(
            (registration) => registration.type === type,
          );

          return (
            <AdminTableSection title={label} key={type}>
              {records.length === 0 ? (
                <EmptyTableMessage message={`No ${label} submissions.`} />
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Reference</th>
                      <th>Membership Code</th>
                      <th>Payment</th>
                      <th>Email Status</th>
                      <th>Resend</th>
                      <th>Parent / Guardian</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((registration) => (
                      <tr key={registration.id}>
                        <td>
                          <strong>{registration.fullName}</strong>
                        </td>
                        <td>{registration.email}</td>
                        <td>{registration.phone}</td>
                        <td>{registration.referenceNumber}</td>
                        <td>{registration.membershipCode || "Not required"}</td>
                        <td>
                          {registration.paymentStatus ? (
                            <span
                              className={
                                registration.paymentStatus === "PAID"
                                  ? "table-status table-status-success"
                                  : "table-status"
                              }
                            >
                              {registration.paymentStatus === "PAID" ? "Paid" : "Pending"}
                            </span>
                          ) : (
                            "Not required"
                          )}
                        </td>
                        <td>
                          {registration.membershipCode ? (
                            <>
                              <span className={getEmailStatusClass(registration.emailStatus)}>
                                {getEmailStatusLabel(registration.emailStatus)}
                              </span>
                              {registration.emailError && (
                                <small className="table-error">
                                  {registration.emailError}
                                </small>
                              )}
                            </>
                          ) : (
                            "Not required"
                          )}
                        </td>
                        <td>
                          <button
                            className="secondary-button table-action-button"
                            type="button"
                            disabled={
                              !registration.membershipCode ||
                              resendingRegistrationId === registration.id
                            }
                            onClick={() => void resendSimpleRegistrationEmail(registration)}
                          >
                            {resendingRegistrationId === registration.id
                              ? "Sending..."
                              : "Resend"}
                          </button>
                        </td>
                        <td>{registration.parentGuardian || "Not required"}</td>
                        <td>{formatDateTime(registration.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </AdminTableSection>
          );
        })}
      </div>
    </section>
  );
}

function AdminTableSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-table-section">
      <h2>{title}</h2>
      <div className="admin-table-scroll">{children}</div>
    </section>
  );
}

function EmptyTableMessage({ message }: { message: string }) {
  return <p className="admin-empty-message">{message}</p>;
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

function getEmailStatusLabel(status: string | undefined) {
  if (status === "SENT") return "Sent";
  if (status === "FAILED") return "Failed";
  if (status === "SKIPPED_CONFIG") return "Not configured";
  if (status === "PENDING") return "Pending";
  return "Unknown";
}

function getEmailStatusClass(status: string | undefined) {
  if (status === "SENT") return "table-status table-status-success";
  if (status === "FAILED") return "table-status table-status-error";
  return "table-status";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default AdminPanel;
