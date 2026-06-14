import { useState, type ReactNode } from "react";
import type {
  ClubInviteApplication,
  ClubInviteTrialCode,
  OnboardingCompletion,
  SimpleRegistrationRecord,
  SimpleRegistrationType,
  TrialApplication,
} from "../types";
import { isEmail, isRequired } from "../utils/validation";

type AdminPanelProps = {
  trialApplications: TrialApplication[];
  clubInviteApplications: ClubInviteApplication[];
  clubInviteTrialCodes: ClubInviteTrialCode[];
  simpleRegistrations: SimpleRegistrationRecord[];
  onboardingCompletions: OnboardingCompletion[];
  onGenerateClubInviteTrialCode: (payload: {
    playerName: string;
    email: string;
    emailConfirm: string;
  }) => Promise<void>;
  onResendClubInviteTrialCode: (inviteId: string) => Promise<void>;
  onResendTrialEmail: (codeId: string) => Promise<void>;
  onReviewTrial: (
    trialApplicationId: string,
    status: "SUCCESSFUL" | "UNSUCCESSFUL",
  ) => Promise<void>;
  onReviewClubInviteApplication: (
    applicationId: string,
    status: "SUCCESSFUL" | "UNSUCCESSFUL",
  ) => Promise<void>;
  onPreviewTrialBirthCertificate: (documentId: string) => Promise<void>;
  onResendSimpleRegistrationEmail: (registrationId: string) => Promise<void>;
  onResetTestingData: () => Promise<void>;
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
  clubInviteApplications,
  clubInviteTrialCodes,
  simpleRegistrations,
  onboardingCompletions,
  onGenerateClubInviteTrialCode,
  onResendClubInviteTrialCode,
  onResendTrialEmail,
  onReviewTrial,
  onReviewClubInviteApplication,
  onPreviewTrialBirthCertificate,
  onResendSimpleRegistrationEmail,
  onResetTestingData,
}: AdminPanelProps) {
  const [resendingCodeId, setResendingCodeId] = useState("");
  const [reviewingTrialId, setReviewingTrialId] = useState("");
  const [reviewingClubInviteId, setReviewingClubInviteId] = useState("");
  const [previewingDocumentId, setPreviewingDocumentId] = useState("");
  const [resendingRegistrationId, setResendingRegistrationId] = useState("");
  const [resendingClubInviteId, setResendingClubInviteId] = useState("");
  const [isResettingData, setIsResettingData] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [inviteValues, setInviteValues] = useState({
    playerName: "",
    email: "",
    emailConfirm: "",
  });
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  const generateClubInviteTrialCode = async () => {
    const nextErrors: Record<string, string> = {};

    if (!isRequired(inviteValues.playerName)) {
      nextErrors.playerName = "Player name is required.";
    }

    if (!isEmail(inviteValues.email)) {
      nextErrors.email = "Enter a valid email.";
    }

    if (!isEmail(inviteValues.emailConfirm)) {
      nextErrors.emailConfirm = "Confirm the email address.";
    } else if (inviteValues.email !== inviteValues.emailConfirm) {
      nextErrors.emailConfirm = "Email addresses must match.";
    }

    setInviteErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsGeneratingInvite(true);
    setResendMessage("");

    try {
      await onGenerateClubInviteTrialCode(inviteValues);
      setInviteValues({ playerName: "", email: "", emailConfirm: "" });
      setResendMessage(
        `Club invite trial code generated and sent to ${inviteValues.email}.`,
      );
    } catch (error) {
      setResendMessage(
        error instanceof Error
          ? error.message
          : "Could not generate club invite trial code.",
      );
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const resendTrialEmail = async (
    application: TrialApplication | ClubInviteApplication,
  ) => {
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

  const resendClubInviteTrialCode = async (invite: ClubInviteTrialCode) => {
    setResendingClubInviteId(invite.id);
    setResendMessage("");

    try {
      await onResendClubInviteTrialCode(invite.id);
      setResendMessage(
        `Resent club invite trial code to ${invite.email}. Check the Email Status column for delivery result.`,
      );
    } catch (error) {
      setResendMessage(
        error instanceof Error ? error.message : "Email resend failed. Please try again.",
      );
    } finally {
      setResendingClubInviteId("");
    }
  };

  const reviewTrial = async (
    application: TrialApplication,
    status: "SUCCESSFUL" | "UNSUCCESSFUL",
  ) => {
    setReviewingTrialId(application.id);
    setResendMessage("");

    try {
      await onReviewTrial(application.id, status);
      setResendMessage(
        status === "SUCCESSFUL"
          ? `Marked ${application.playerName} ${application.playerSurname} successful. Authorisation email sent to ${application.guardianEmail}.`
          : `Marked ${application.playerName} ${application.playerSurname} unsuccessful. Outcome email sent to ${application.guardianEmail}.`,
      );
    } catch (error) {
      setResendMessage(
        error instanceof Error ? error.message : "Trial review failed. Please try again.",
      );
    } finally {
      setReviewingTrialId("");
    }
  };

  const reviewClubInviteApplication = async (
    application: ClubInviteApplication,
    status: "SUCCESSFUL" | "UNSUCCESSFUL",
  ) => {
    setReviewingClubInviteId(application.id);
    setResendMessage("");

    try {
      await onReviewClubInviteApplication(application.id, status);
      setResendMessage(
        status === "SUCCESSFUL"
          ? `Marked ${application.playerName} ${application.playerSurname} successful. Authorisation email sent to ${application.guardianEmail}.`
          : `Marked ${application.playerName} ${application.playerSurname} unsuccessful. Outcome email sent to ${application.guardianEmail}.`,
      );
    } catch (error) {
      setResendMessage(
        error instanceof Error
          ? error.message
          : "Club invite review failed. Please try again.",
      );
    } finally {
      setReviewingClubInviteId("");
    }
  };

  const previewTrialBirthCertificate = async (
    application: TrialApplication | ClubInviteApplication,
  ) => {
    if (!application.birthCertificateDocumentId) return;

    setPreviewingDocumentId(application.birthCertificateDocumentId);
    setResendMessage("");

    try {
      await onPreviewTrialBirthCertificate(application.birthCertificateDocumentId);
    } catch (error) {
      setResendMessage(
        error instanceof Error
          ? error.message
          : "Could not open birth certificate. Please try again.",
      );
    } finally {
      setPreviewingDocumentId("");
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

  const resetTestingData = async () => {
    const confirmed = window.confirm(
      "Reset all testing data? This will delete players, applications, codes, onboarding records, payments, documents, and email logs. Admin login users will remain.",
    );

    if (!confirmed) return;

    setIsResettingData(true);
    setResendMessage("");

    try {
      await onResetTestingData();
      setResendMessage("Testing data has been reset.");
    } catch (error) {
      setResendMessage(
        error instanceof Error ? error.message : "Testing data reset failed.",
      );
    } finally {
      setIsResettingData(false);
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
      ...clubInviteApplications.map((application) => [
        "club-invite-trial",
        `${application.playerName} ${application.playerSurname}`,
        application.guardianEmail,
        application.clubInviteCode ?? "",
        getTrialStatusLabel(application.status),
        application.membershipNumber ?? application.membershipCode ?? "",
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
          then wait for admin verification. Successful trials generate an
          onboarding authorisation code.
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
            <span>Club Invite Applications</span>
            <strong>{clubInviteApplications.length}</strong>
            <p>Club invite submissions saved in the backend.</p>
          </article>
          <article className="status-card">
            <span>Waiting Verification</span>
            <strong>
              {
                [...trialApplications, ...clubInviteApplications].filter(
                  (application) => application.status === "paid",
                ).length
              }
            </strong>
            <p>Trial applications waiting for admin decision.</p>
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
          <button
            className="secondary-button danger-button"
            type="button"
            onClick={() => void resetTestingData()}
            disabled={isResettingData}
          >
            {isResettingData ? "Resetting..." : "Reset Testing Data"}
          </button>
        </div>
        {resendMessage && <p className="admin-action-message">{resendMessage}</p>}

        <AdminTableSection title="Club Invite Trial Codes">
          <div className="admin-inline-form">
            <div className="field">
              <label className="field-label" htmlFor="clubInvitePlayerName">
                Player Name <span aria-label="required">*</span>
              </label>
              <input
                id="clubInvitePlayerName"
                value={inviteValues.playerName}
                onChange={(event) => {
                  setInviteValues({
                    ...inviteValues,
                    playerName: event.target.value,
                  });
                  setInviteErrors({ ...inviteErrors, playerName: "" });
                }}
              />
              {inviteErrors.playerName && (
                <p className="field-error">{inviteErrors.playerName}</p>
              )}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="clubInviteEmail">
                Email <span aria-label="required">*</span>
              </label>
              <input
                id="clubInviteEmail"
                type="email"
                value={inviteValues.email}
                onChange={(event) => {
                  setInviteValues({ ...inviteValues, email: event.target.value });
                  setInviteErrors({ ...inviteErrors, email: "" });
                }}
              />
              {inviteErrors.email && <p className="field-error">{inviteErrors.email}</p>}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="clubInviteEmailConfirm">
                Confirm Email <span aria-label="required">*</span>
              </label>
              <input
                id="clubInviteEmailConfirm"
                type="email"
                value={inviteValues.emailConfirm}
                onChange={(event) => {
                  setInviteValues({
                    ...inviteValues,
                    emailConfirm: event.target.value,
                  });
                  setInviteErrors({ ...inviteErrors, emailConfirm: "" });
                }}
              />
              {inviteErrors.emailConfirm && (
                <p className="field-error">{inviteErrors.emailConfirm}</p>
              )}
            </div>
            <button
              className="submit-button inline-submit"
              type="button"
              onClick={() => void generateClubInviteTrialCode()}
              disabled={isGeneratingInvite}
            >
              {isGeneratingInvite ? "Generating..." : "Generate Invite"}
            </button>
          </div>

          {clubInviteTrialCodes.length === 0 ? (
            <EmptyTableMessage message="No club invite trial codes generated yet." />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Email</th>
                  <th>Membership Code</th>
                  <th>Club Invite Trial Code</th>
                  <th>Email Status</th>
                  <th>Resend</th>
                  <th>Generated</th>
                </tr>
              </thead>
              <tbody>
                {clubInviteTrialCodes.map((invite) => (
                  <tr key={invite.id}>
                    <td>
                      <strong>{invite.playerName}</strong>
                    </td>
                    <td>{invite.email}</td>
                    <td>{invite.membershipCode}</td>
                    <td>{invite.inviteCode}</td>
                    <td>
                      <span className={getEmailStatusClass(invite.emailStatus)}>
                        {getEmailStatusLabel(invite.emailStatus)}
                      </span>
                      {invite.emailError && (
                        <small className="table-error">{invite.emailError}</small>
                      )}
                    </td>
                    <td>
                      <button
                        className="secondary-button table-action-button"
                        type="button"
                        disabled={resendingClubInviteId === invite.id}
                        onClick={() => void resendClubInviteTrialCode(invite)}
                      >
                        {resendingClubInviteId === invite.id ? "Sending..." : "Resend"}
                      </button>
                    </td>
                    <td>{formatDateTime(invite.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminTableSection>

        <AdminTableSection title="Club Invite Applications">
          {clubInviteApplications.length === 0 ? (
            <EmptyTableMessage message="No Club Invite Trial applications yet." />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Age Group</th>
                  <th>Gender</th>
                  <th>Guardian</th>
                  <th>Phone</th>
                  <th>Province</th>
                  <th>Membership</th>
                  <th>Club Invite Code</th>
                  <th>Birth Certificate</th>
                  <th>Email Status</th>
                  <th>Review</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {clubInviteApplications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <strong>
                        {application.playerName} {application.playerSurname}
                      </strong>
                    </td>
                    <td>{application.ageGroup || "Not calculated"}</td>
                    <td>{application.gender || "Not provided"}</td>
                    <td>
                      <strong>
                        {application.guardianName} {application.guardianSurname}
                      </strong>
                      <small className="table-subtext">{application.guardianEmail}</small>
                    </td>
                    <td>{application.guardianPhone}</td>
                    <td>{application.province || "Not provided"}</td>
                    <td>{application.membershipNumber || application.membershipCode}</td>
                    <td>{application.clubInviteCode || "Not provided"}</td>
                    <td>
                      {application.birthCertificateFileName || "Not provided"}
                      {application.birthCertificateDocumentId && (
                        <button
                          className="secondary-button table-action-button table-inline-button"
                          type="button"
                          disabled={
                            previewingDocumentId === application.birthCertificateDocumentId
                          }
                          onClick={() => void previewTrialBirthCertificate(application)}
                        >
                          {previewingDocumentId === application.birthCertificateDocumentId
                            ? "Opening..."
                            : "View"}
                        </button>
                      )}
                    </td>
                    <td>
                      <span className={getEmailStatusClass(application.emailStatus)}>
                        {getEmailStatusLabel(application.emailStatus)}
                      </span>
                      {application.emailError && (
                        <small className="table-error">{application.emailError}</small>
                      )}
                    </td>
                    <td>
                      {application.status === "paid" ? (
                        <div className="table-action-group">
                          <button
                            className="secondary-button table-action-button"
                            type="button"
                            disabled={reviewingClubInviteId === application.id}
                            onClick={() =>
                              void reviewClubInviteApplication(application, "SUCCESSFUL")
                            }
                          >
                            {reviewingClubInviteId === application.id
                              ? "Saving..."
                              : "Successful"}
                          </button>
                          <button
                            className="secondary-button table-action-button danger"
                            type="button"
                            disabled={reviewingClubInviteId === application.id}
                            onClick={() =>
                              void reviewClubInviteApplication(application, "UNSUCCESSFUL")
                            }
                          >
                            Fail
                          </button>
                        </div>
                      ) : application.authorisationCodeId ? (
                        <button
                          className="secondary-button table-action-button"
                          type="button"
                          disabled={resendingCodeId === application.authorisationCodeId}
                          onClick={() => void resendTrialEmail(application)}
                        >
                          {resendingCodeId === application.authorisationCodeId
                            ? "Sending..."
                            : "Resend Email"}
                        </button>
                      ) : (
                        "Reviewed"
                      )}
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

        <AdminTableSection title="New Trial Applications">
          {trialApplications.length === 0 ? (
            <EmptyTableMessage message="No New Trial applications yet." />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Age Group</th>
                  <th>Gender</th>
                  <th>Guardian</th>
                  <th>Relation</th>
                  <th>Phone</th>
                  <th>Province</th>
                  <th>Membership</th>
                  <th>Authorisation Code</th>
                  <th>Birth Certificate</th>
                  <th>Email Status</th>
                  <th>Review</th>
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
                    <td>{application.ageGroup || "Not calculated"}</td>
                    <td>{application.gender || "Not provided"}</td>
                    <td>
                      <strong>
                        {application.guardianName} {application.guardianSurname}
                      </strong>
                      <small className="table-subtext">{application.guardianEmail}</small>
                    </td>
                    <td>{application.guardianRelation || "Not provided"}</td>
                    <td>{application.guardianPhone}</td>
                    <td>{application.province || "Not provided"}</td>
                    <td>{application.membershipNumber || "Not issued"}</td>
                    <td>{application.authorisationCode || "Not issued"}</td>
                    <td>
                      {application.birthCertificateFileName || "Not provided"}
                      {application.birthCertificateDocumentId && (
                        <button
                          className="secondary-button table-action-button table-inline-button"
                          type="button"
                          disabled={
                            previewingDocumentId === application.birthCertificateDocumentId
                          }
                          onClick={() => void previewTrialBirthCertificate(application)}
                        >
                          {previewingDocumentId === application.birthCertificateDocumentId
                            ? "Opening..."
                            : "View"}
                        </button>
                      )}
                    </td>
                    <td>
                      <span className={getEmailStatusClass(application.emailStatus)}>
                        {getEmailStatusLabel(application.emailStatus)}
                      </span>
                      {application.emailError && (
                        <small className="table-error">{application.emailError}</small>
                      )}
                    </td>
                    <td>
                      {application.status === "paid" ? (
                        <div className="table-action-group">
                          <button
                            className="secondary-button table-action-button"
                            type="button"
                            disabled={reviewingTrialId === application.id}
                            onClick={() => void reviewTrial(application, "SUCCESSFUL")}
                          >
                            {reviewingTrialId === application.id
                              ? "Saving..."
                              : "Successful"}
                          </button>
                          <button
                            className="secondary-button table-action-button danger"
                            type="button"
                            disabled={reviewingTrialId === application.id}
                            onClick={() => void reviewTrial(application, "UNSUCCESSFUL")}
                          >
                            Fail
                          </button>
                        </div>
                      ) : application.authorisationCodeId ? (
                        <button
                          className="secondary-button table-action-button"
                          type="button"
                          disabled={resendingCodeId === application.authorisationCodeId}
                          onClick={() => void resendTrialEmail(application)}
                        >
                          {resendingCodeId === application.authorisationCodeId
                            ? "Sending..."
                            : "Resend Email"}
                        </button>
                      ) : (
                        "Reviewed"
                      )}
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
  if (status === "paid") return "Waiting Admin Verification";
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
