import { useState, type ReactNode } from "react";
import type {
  AdminDocumentRecord,
  AdminEmailLogRecord,
  AdminPlayerRecord,
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
  adminPlayers: AdminPlayerRecord[];
  adminDocuments: AdminDocumentRecord[];
  adminEmailLogs: AdminEmailLogRecord[];
  simpleRegistrations: SimpleRegistrationRecord[];
  onboardingCompletions: OnboardingCompletion[];
  onGenerateClubInviteTrialCode: (payload: {
    playerName: string;
    email: string;
    emailConfirm: string;
    emailBody?: string;
  }) => Promise<void>;
  onResendClubInviteTrialCode: (inviteId: string, emailBody: string) => Promise<void>;
  onReviewTrial: (
    trialApplicationId: string,
    status: "SUCCESSFUL" | "UNSUCCESSFUL",
    emailBody: string,
  ) => Promise<void>;
  onReviewClubInviteApplication: (
    applicationId: string,
    status: "SUCCESSFUL" | "UNSUCCESSFUL",
    emailBody: string,
  ) => Promise<void>;
  onSendInformationCheckEmail: (
    applicationType: "trial" | "club-invite",
    applicationId: string,
    status: "SUCCESSFUL" | "UNSUCCESSFUL",
    emailBody: string,
  ) => Promise<void>;
  onResendReviewEmail: (
    applicationType: "trial" | "club-invite",
    applicationId: string,
    status: "SUCCESSFUL" | "UNSUCCESSFUL",
    emailBody: string,
  ) => Promise<void>;
  onPreviewTrialBirthCertificate: (documentId: string) => Promise<void>;
  onResendSimpleRegistrationEmail: (
    registrationId: string,
    emailBody: string,
  ) => Promise<void>;
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

const appLink = window.location.origin;
const trialScheduleDetails = [
  `Trial start date: ${import.meta.env.VITE_TRIAL_START_DATE || "To be confirmed"}`,
  `Trial end date: ${import.meta.env.VITE_TRIAL_END_DATE || "To be confirmed"}`,
  `Arrival time: ${import.meta.env.VITE_TRIAL_ARRIVAL_TIME || "To be confirmed"}`,
].join("\n");
const appendTrialScheduleDetails = (body: string) =>
  body.includes("Trial start date:")
    ? body
    : `${body}\n\nTrial details:\n${trialScheduleDetails}`;

function AdminPanel({
  trialApplications,
  clubInviteApplications,
  clubInviteTrialCodes,
  adminPlayers,
  adminDocuments,
  adminEmailLogs,
  simpleRegistrations,
  onboardingCompletions,
  onGenerateClubInviteTrialCode,
  onResendClubInviteTrialCode,
  onReviewTrial,
  onReviewClubInviteApplication,
  onSendInformationCheckEmail,
  onResendReviewEmail,
  onPreviewTrialBirthCertificate,
  onResendSimpleRegistrationEmail,
  onResetTestingData,
}: AdminPanelProps) {
  const [reviewingTrialId, setReviewingTrialId] = useState("");
  const [reviewingClubInviteId, setReviewingClubInviteId] = useState("");
  const [emailActionKey, setEmailActionKey] = useState("");
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
  const [emailComposer, setEmailComposer] = useState<{
    title: string;
    to: string;
    body: string;
    onSend: (body: string) => Promise<void>;
  } | null>(null);
  const [isSendingComposer, setIsSendingComposer] = useState(false);

  const openEmailComposer = (config: {
    title: string;
    to: string;
    body: string;
    onSend: (body: string) => Promise<void>;
  }) => {
    setEmailComposer({ ...config, body: plainTextToHtml(config.body) });
  };

  const sendComposedEmail = async () => {
    if (!emailComposer) return;

    setIsSendingComposer(true);

    try {
      await emailComposer.onSend(emailComposer.body);
      setEmailComposer(null);
    } finally {
      setIsSendingComposer(false);
    }
  };

  const applyEmailFormat = (command: "bold" | "insertUnorderedList") => {
    document.execCommand(command);
    const editor = document.getElementById("emailComposerBody");
    if (editor) {
      setEmailComposer((current) =>
        current ? { ...current, body: editor.innerHTML } : current,
      );
    }
  };

  const addEmailLink = () => {
    const url = window.prompt("Enter link URL");
    if (!url) return;

    document.execCommand("createLink", false, url);
    const editor = document.getElementById("emailComposerBody");
    if (editor) {
      setEmailComposer((current) =>
        current ? { ...current, body: editor.innerHTML } : current,
      );
    }
  };

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
      setResendMessage("Club invite membership and trial code generated.");
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

  const resendClubInviteTrialCode = async (invite: ClubInviteTrialCode) => {
    openEmailComposer({
      title: "Send Club Invite Trial Code",
      to: invite.email,
      body: buildClubInviteCodeMessage(invite),
      onSend: async (emailBody) => {
        setResendingClubInviteId(invite.id);
        setResendMessage("");

        try {
          await onResendClubInviteTrialCode(invite.id, emailBody);
          setResendMessage(
            `Sent club invite trial code to ${invite.email}. Check the Email Status column for delivery result.`,
          );
        } catch (error) {
          setResendMessage(
            error instanceof Error ? error.message : "Email resend failed. Please try again.",
          );
        } finally {
          setResendingClubInviteId("");
        }
      },
    });
  };

  const reviewTrial = async (
    application: TrialApplication,
    status: "SUCCESSFUL" | "UNSUCCESSFUL",
    emailBody: string,
  ) => {
    setReviewingTrialId(application.id);
    setResendMessage("");

    try {
      await onReviewTrial(application.id, status, emailBody);
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
    emailBody: string,
  ) => {
    setReviewingClubInviteId(application.id);
    setResendMessage("");

    try {
      await onReviewClubInviteApplication(application.id, status, emailBody);
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

  const sendInformationCheckEmail = async (
    application: TrialApplication | ClubInviteApplication,
    applicationType: "trial" | "club-invite",
    status: "SUCCESSFUL" | "UNSUCCESSFUL",
    emailBody: string,
  ) => {
    const actionKey = `${applicationType}-${application.id}-info-${status}`;
    setEmailActionKey(actionKey);
    setResendMessage("");

    try {
      await onSendInformationCheckEmail(applicationType, application.id, status, emailBody);
      setResendMessage(
        status === "SUCCESSFUL"
          ? `Information check successful email sent to ${application.guardianEmail}.`
          : `Information check failed email sent to ${application.guardianEmail}.`,
      );
    } catch (error) {
      setResendMessage(
        error instanceof Error
          ? error.message
          : "Information check email failed. Please try again.",
      );
    } finally {
      setEmailActionKey("");
    }
  };

  const resendReviewEmail = async (
    application: TrialApplication | ClubInviteApplication,
    applicationType: "trial" | "club-invite",
    status: "SUCCESSFUL" | "UNSUCCESSFUL",
    emailBody: string,
  ) => {
    const actionKey = `${applicationType}-${application.id}-review-${status}`;
    setEmailActionKey(actionKey);
    setResendMessage("");

    try {
      await onResendReviewEmail(applicationType, application.id, status, emailBody);
      setResendMessage(
        status === "SUCCESSFUL"
          ? `Resent successful review email to ${application.guardianEmail}.`
          : `Resent failed review email to ${application.guardianEmail}.`,
      );
    } catch (error) {
      setResendMessage(
        error instanceof Error
          ? error.message
          : "Review email resend failed. Please try again.",
      );
    } finally {
      setEmailActionKey("");
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
    emailBody: string,
  ) => {
    setResendingRegistrationId(registration.id);
    setResendMessage("");

    try {
      await onResendSimpleRegistrationEmail(registration.id, emailBody);
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

  const renderReviewActions = (
    application: TrialApplication | ClubInviteApplication,
    applicationType: "trial" | "club-invite",
  ) => {
    const reviewBusy =
      applicationType === "trial"
        ? reviewingTrialId === application.id
        : reviewingClubInviteId === application.id;
    const canReview = application.status === "paid";
    const finalStatus =
      application.status === "successful"
        ? "SUCCESSFUL"
        : application.status === "unsuccessful"
          ? "UNSUCCESSFUL"
          : null;

    return (
      <div className="table-action-group">
        <button
          className="secondary-button table-action-button"
          type="button"
          disabled={emailActionKey === `${applicationType}-${application.id}-info-SUCCESSFUL`}
          onClick={() =>
            openEmailComposer({
              title: "Information Check Successful Email",
              to: application.guardianEmail,
              body: buildInformationCheckMessage(application, "SUCCESSFUL"),
              onSend: (emailBody) =>
                sendInformationCheckEmail(
                  application,
                  applicationType,
                  "SUCCESSFUL",
                  emailBody,
                ),
            })
          }
        >
          {emailActionKey === `${applicationType}-${application.id}-info-SUCCESSFUL`
            ? "Sending..."
            : "Info Check OK"}
        </button>
        <button
          className="secondary-button table-action-button danger"
          type="button"
          disabled={emailActionKey === `${applicationType}-${application.id}-info-UNSUCCESSFUL`}
          onClick={() =>
            openEmailComposer({
              title: "Information Check Failed Email",
              to: application.guardianEmail,
              body: buildInformationCheckMessage(application, "UNSUCCESSFUL"),
              onSend: (emailBody) =>
                sendInformationCheckEmail(
                  application,
                  applicationType,
                  "UNSUCCESSFUL",
                  emailBody,
                ),
            })
          }
        >
          {emailActionKey === `${applicationType}-${application.id}-info-UNSUCCESSFUL`
            ? "Sending..."
            : "Info Check Fail"}
        </button>

        {canReview ? (
          <>
            <button
              className="secondary-button table-action-button"
              type="button"
              disabled={reviewBusy}
              onClick={() =>
                openEmailComposer({
                  title: "Final Successful Review Email",
                  to: application.guardianEmail,
                  body: buildFinalReviewMessage(application, "SUCCESSFUL"),
                  onSend: (emailBody) =>
                    applicationType === "trial"
                      ? reviewTrial(
                          application as TrialApplication,
                          "SUCCESSFUL",
                          emailBody,
                        )
                      : reviewClubInviteApplication(
                          application as ClubInviteApplication,
                          "SUCCESSFUL",
                          emailBody,
                        ),
                })
              }
            >
              {reviewBusy ? "Saving..." : "Successful"}
            </button>
            <button
              className="secondary-button table-action-button danger"
              type="button"
              disabled={reviewBusy}
              onClick={() =>
                openEmailComposer({
                  title: "Final Failed Review Email",
                  to: application.guardianEmail,
                  body: buildFinalReviewMessage(application, "UNSUCCESSFUL"),
                  onSend: (emailBody) =>
                    applicationType === "trial"
                      ? reviewTrial(
                          application as TrialApplication,
                          "UNSUCCESSFUL",
                          emailBody,
                        )
                      : reviewClubInviteApplication(
                          application as ClubInviteApplication,
                          "UNSUCCESSFUL",
                          emailBody,
                        ),
                })
              }
            >
              Fail
            </button>
          </>
        ) : finalStatus ? (
          <button
            className={
              finalStatus === "SUCCESSFUL"
                ? "secondary-button table-action-button"
                : "secondary-button table-action-button danger"
            }
            type="button"
            disabled={
              emailActionKey ===
              `${applicationType}-${application.id}-review-${finalStatus}`
            }
            onClick={() =>
              openEmailComposer({
                title:
                  finalStatus === "SUCCESSFUL"
                    ? "Resend Successful Review Email"
                    : "Resend Failed Review Email",
                to: application.guardianEmail,
                body: buildFinalReviewMessage(application, finalStatus),
                onSend: (emailBody) =>
                  resendReviewEmail(
                    application,
                    applicationType,
                    finalStatus,
                    emailBody,
                  ),
              })
            }
          >
            {emailActionKey ===
            `${applicationType}-${application.id}-review-${finalStatus}`
              ? "Sending..."
              : finalStatus === "SUCCESSFUL"
                ? "Resend Success"
                : "Resend Fail"}
          </button>
        ) : (
          "Reviewed"
        )}
      </div>
    );
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
          <article className="status-card">
            <span>Players</span>
            <strong>{adminPlayers.length}</strong>
            <p>Player records currently stored in Postgres.</p>
          </article>
          <article className="status-card">
            <span>Documents</span>
            <strong>{adminDocuments.length}</strong>
            <p>Uploaded documents available for protected preview.</p>
          </article>
          <article className="status-card">
            <span>Email Logs</span>
            <strong>{adminEmailLogs.length}</strong>
            <p>Latest outbound email attempts and provider status.</p>
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
                  <th>Send Email</th>
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
                        {resendingClubInviteId === invite.id ? "Sending..." : "Send Email"}
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
                  <th>Birthday</th>
                  <th>Age Group</th>
                  <th>Gender</th>
                  <th>Guardian</th>
                  <th>Phone</th>
                  <th>Province</th>
                  <th>Membership</th>
                  <th>Club Invite Code</th>
                  <th>Birth Certificate</th>
                  <th>Info Check Status</th>
                  <th>Qualification Review Status</th>
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
                    <td>{formatDateOnly(application.dateOfBirth)}</td>
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
                      <EmailStatusCell
                        status={application.informationCheckEmailStatus}
                        error={application.informationCheckEmailError}
                      />
                    </td>
                    <td>
                      <EmailStatusCell
                        status={application.qualificationEmailStatus}
                        error={application.qualificationEmailError}
                      />
                    </td>
                    <td>{renderReviewActions(application, "club-invite")}</td>
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
                  <th>Birthday</th>
                  <th>Age Group</th>
                  <th>Gender</th>
                  <th>Guardian</th>
                  <th>Relation</th>
                  <th>Phone</th>
                  <th>Province</th>
                  <th>Membership</th>
                  <th>Authorisation Code</th>
                  <th>Birth Certificate</th>
                  <th>Info Check Status</th>
                  <th>Qualification Review Status</th>
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
                    <td>{formatDateOnly(application.dateOfBirth)}</td>
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
                      <EmailStatusCell
                        status={application.informationCheckEmailStatus}
                        error={application.informationCheckEmailError}
                      />
                    </td>
                    <td>
                      <EmailStatusCell
                        status={application.qualificationEmailStatus}
                        error={application.qualificationEmailError}
                      />
                    </td>
                    <td>{renderReviewActions(application, "trial")}</td>
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

        <AdminTableSection title="Players">
          {adminPlayers.length === 0 ? (
            <EmptyTableMessage message="No player records yet." />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Membership</th>
                  <th>Passport</th>
                  <th>Birthday</th>
                  <th>Age Group</th>
                  <th>Guardian</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {adminPlayers.map((player) => (
                  <tr key={player.id}>
                    <td>
                      <strong>
                        {player.firstName} {player.surname}
                      </strong>
                    </td>
                    <td>{player.membershipNumber || "Not issued"}</td>
                    <td>{player.passportNumber || "Not issued"}</td>
                    <td>{formatDateOnly(player.dateOfBirth ?? undefined)}</td>
                    <td>{player.ageGroup || "Not calculated"}</td>
                    <td>
                      {player.guardianName || "Not provided"}
                      {player.guardianEmail && (
                        <small className="table-subtext">{player.guardianEmail}</small>
                      )}
                    </td>
                    <td>
                      <span className="table-status">{formatStatusLabel(player.status)}</span>
                    </td>
                    <td>{formatDateTime(player.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminTableSection>

        <AdminTableSection title="Documents">
          {adminDocuments.length === 0 ? (
            <EmptyTableMessage message="No uploaded documents yet." />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Linked To</th>
                  <th>Size</th>
                  <th>Preview</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {adminDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <strong>{document.fileName}</strong>
                      {document.mimeType && (
                        <small className="table-subtext">{document.mimeType}</small>
                      )}
                    </td>
                    <td>{formatStatusLabel(document.type)}</td>
                    <td>{getDocumentOwnerLabel(document)}</td>
                    <td>{formatFileSize(document.fileSize)}</td>
                    <td>
                      <button
                        className="secondary-button table-action-button table-inline-button"
                        type="button"
                        disabled={previewingDocumentId === document.id}
                        onClick={() => void onPreviewTrialBirthCertificate(document.id)}
                      >
                        {previewingDocumentId === document.id ? "Opening..." : "View"}
                      </button>
                    </td>
                    <td>{formatDateTime(document.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminTableSection>

        <AdminTableSection title="Email Logs">
          {adminEmailLogs.length === 0 ? (
            <EmptyTableMessage message="No email logs yet." />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Related Code</th>
                  <th>Message Preview</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {adminEmailLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.to}</td>
                    <td>
                      <strong>{log.subject}</strong>
                      <small className="table-subtext">{log.provider}</small>
                    </td>
                    <td>
                      <EmailStatusCell status={log.status} error={log.error ?? undefined} />
                    </td>
                    <td>{log.code?.code || log.onboardingRecord?.passportNumber || "Not linked"}</td>
                    <td>{truncateText(htmlToPlainText(log.body), 110)}</td>
                    <td>{formatDateTime(log.createdAt)}</td>
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
                            onClick={() =>
                              openEmailComposer({
                                title: "Resend Registration Email",
                                to: registration.email,
                                body: buildSimpleRegistrationMessage(registration),
                                onSend: (emailBody) =>
                                  resendSimpleRegistrationEmail(registration, emailBody),
                              })
                            }
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
      {emailComposer && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="email-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="emailComposerTitle"
          >
            <div className="email-modal-header">
              <div>
                <h2 id="emailComposerTitle">{emailComposer.title}</h2>
                <p>To: {emailComposer.to}</p>
              </div>
              <button
                className="secondary-button table-action-button"
                type="button"
                onClick={() => setEmailComposer(null)}
                disabled={isSendingComposer}
              >
                Close
              </button>
            </div>
            <label className="field-label" id="emailComposerBodyLabel">
              Email Message
            </label>
            <div className="email-format-toolbar" aria-label="Email formatting tools">
              <button
                className="secondary-button table-action-button"
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  applyEmailFormat("bold");
                }}
                disabled={isSendingComposer}
              >
                Bold
              </button>
              <button
                className="secondary-button table-action-button"
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  applyEmailFormat("insertUnorderedList");
                }}
                disabled={isSendingComposer}
              >
                List
              </button>
              <button
                className="secondary-button table-action-button"
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  addEmailLink();
                }}
                disabled={isSendingComposer}
              >
                Link
              </button>
            </div>
            <div
              id="emailComposerBody"
              className="email-rich-editor"
              role="textbox"
              aria-labelledby="emailComposerBodyLabel"
              aria-multiline="true"
              contentEditable={!isSendingComposer}
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: emailComposer.body }}
              onInput={(event) =>
                setEmailComposer({
                  ...emailComposer,
                  body: event.currentTarget.innerHTML,
                })
              }
            />
            <div className="email-modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setEmailComposer(null)}
                disabled={isSendingComposer}
              >
                Cancel
              </button>
              <button
                className="submit-button inline-submit"
                type="button"
                onClick={() => void sendComposedEmail()}
                disabled={
                  isSendingComposer || !htmlToPlainText(emailComposer.body).trim()
                }
              >
                {isSendingComposer ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainTextToHtml(value: string) {
  if (/<\/?[a-z][\s\S]*>/i.test(value)) return value;

  return value
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lines = paragraph
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br>");

      return `<p>${lines || "<br>"}</p>`;
    })
    .join("");
}

function htmlToPlainText(value: string) {
  const element = document.createElement("div");
  element.innerHTML = value;

  return element.textContent || "";
}

function formatStatusLabel(value?: string | null) {
  if (!value) return "Not provided";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDocumentOwnerLabel(document: AdminDocumentRecord) {
  if (document.player) {
    const membership = document.player.membershipNumber
      ? ` (${document.player.membershipNumber})`
      : "";

    return `${document.player.firstName} ${document.player.surname}${membership}`;
  }

  if (document.onboardingRecord) {
    return `${document.onboardingRecord.playerName} ${document.onboardingRecord.playerSurname} (${document.onboardingRecord.programmeTitle})`;
  }

  return "Not linked";
}

function formatFileSize(value?: number | null) {
  if (!value) return "Unknown";

  if (value < 1024 * 1024) {
    return `${Math.max(Math.round(value / 1024), 1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;

  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function EmailStatusCell({
  status,
  error,
}: {
  status?: string;
  error?: string;
}) {
  return (
    <>
      <span className={getEmailStatusClass(status)}>
        {getEmailStatusLabel(status)}
      </span>
      {error && <small className="table-error">{error}</small>}
    </>
  );
}

function getApplicationFullName(application: TrialApplication | ClubInviteApplication) {
  return `${application.playerName} ${application.playerSurname}`.trim();
}

function getApplicationMembership(application: TrialApplication | ClubInviteApplication) {
  return application.membershipNumber || application.membershipCode || "not available";
}

function buildInformationCheckMessage(
  application: TrialApplication | ClubInviteApplication,
  status: "SUCCESSFUL" | "UNSUCCESSFUL",
) {
  const fullName = getApplicationFullName(application);

  if (status === "SUCCESSFUL") {
    return appendTrialScheduleDetails(
      `Your information check for ${fullName} is successful. You can come to the trial please.\n\nMembership number: ${getApplicationMembership(application)}`,
    );
  }

  return appendTrialScheduleDetails(
    `Your information check for ${fullName} was unsuccessful because the birth certificate does not match the birthday provided on the application.\n\nMembership number: ${getApplicationMembership(application)}`,
  );
}

function buildFinalReviewMessage(
  application: TrialApplication | ClubInviteApplication,
  status: "SUCCESSFUL" | "UNSUCCESSFUL",
) {
  const fullName = getApplicationFullName(application);
  const membership = getApplicationMembership(application);

  if (status === "SUCCESSFUL") {
    return appendTrialScheduleDetails(
      `Congratulations, ${fullName} was successful.\n\nMembership number: ${membership}\nAuthorisation code: ${application.authorisationCode || "[generated authorisation code]"}\n\nNext steps:\n1. Open the registration system: ${appLink}\n2. Go to Urban Warrior Onboarding.\n3. Enter your authorisation code and membership number.\n4. Complete your registration details, debit order authorisation, and payment.`,
    );
  }

  return appendTrialScheduleDetails(
    `Thank you for applying for trials. ${fullName} was not successful this time.\n\nMembership number: ${membership}`,
  );
}

function buildClubInviteCodeMessage(invite: {
  playerName: string;
  membershipCode: string;
  inviteCode: string;
}) {
  return appendTrialScheduleDetails(
    `You have been invited to trial with Cape Town Spurs.\n\nPlayer: ${invite.playerName}\nMembership code: ${invite.membershipCode}\nClub invite trial code: ${invite.inviteCode}\nRegistration link: ${appLink}`,
  );
}

function buildSimpleRegistrationMessage(registration: SimpleRegistrationRecord) {
  return `Thank you for registering for ${simpleRegistrationLabels[registration.type]}.\n\nReference number: ${registration.referenceNumber}\n${registration.membershipCode ? `Membership code: ${registration.membershipCode}\n` : ""}Status: ${registration.paymentStatus || "Submitted"}`;
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

function formatDateOnly(value?: string) {
  if (!value) return "Not provided";

  return new Date(value).toLocaleDateString("en-ZA", {
    dateStyle: "medium",
  });
}

export default AdminPanel;
