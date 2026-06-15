const {
  bulkCreateRenewalCodes,
  createOnboardingRecord,
  createDocumentUpload,
  createTrialBirthCertificateUpload,
  createRenewalCode,
  createSimpleRegistration,
  completeSimpleRegistrationPayment,
  createClubInviteTrialCode,
  createTrialApplication,
  exportRegistrationsCsv,
  getDocument,
  getClubInviteTrialCodeByMembership,
  listCodes,
  listDocuments,
  listOnboardingRecords,
  listPlayers,
  listClubInviteApplications,
  listClubInviteTrialCodes,
  listSimpleRegistrations,
  listTrialApplications,
  programmes,
  reviewClubInviteApplication,
  reviewTrialApplication,
  resetTestingData,
  resendClubInviteReviewEmail,
  resendClubInviteTrialCodeEmail,
  resendTrialReviewEmail,
  sendClubInviteInformationCheckEmail,
  sendTrialInformationCheckEmail,
  resendSimpleRegistrationEmail,
  simulateCodeEmail,
  validateOneTimeCode,
} = require("../services/academyService");
const { listAuditLogs, logAuditEvent } = require("../services/auditService");
const { handlePayFastNotification } = require("../services/paymentService");
const { getDocumentAccess } = require("../services/storageService");

const getProgrammes = (_req, res) => {
  res.json(programmes);
};

const postTrialApplication = async (req, res, next) => {
  try {
    const result = await createTrialApplication(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const postSimpleRegistration = async (req, res, next) => {
  try {
    const result = await createSimpleRegistration(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const patchSimpleRegistrationPayment = async (req, res, next) => {
  try {
    const result = await completeSimpleRegistrationPayment(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getSimpleRegistrations = async (_req, res, next) => {
  try {
    res.json(await listSimpleRegistrations());
  } catch (error) {
    next(error);
  }
};

const getTrialApplications = async (_req, res, next) => {
  try {
    res.json(await listTrialApplications());
  } catch (error) {
    next(error);
  }
};

const getClubInviteApplications = async (_req, res, next) => {
  try {
    res.json(await listClubInviteApplications());
  } catch (error) {
    next(error);
  }
};

const getClubInviteTrialCodeLookup = async (req, res, next) => {
  try {
    res.json(await getClubInviteTrialCodeByMembership(req.params.membershipCode));
  } catch (error) {
    next(error);
  }
};

const postPayFastNotification = async (req, res, next) => {
  try {
    await handlePayFastNotification(req.body);
    res.status(200).send("OK");
  } catch (error) {
    next(error);
  }
};

const getAdminTrialApplications = async (_req, res, next) => {
  try {
    res.json(await listTrialApplications());
  } catch (error) {
    next(error);
  }
};

const patchAdminTrialReview = async (req, res, next) => {
  try {
    const result = await reviewTrialApplication(
      req.params.id,
      req.body.status,
      req.body.emailBody,
    );
    await logAuditEvent({
      actor: req.user,
      action: "TRIAL_REVIEW",
      entityType: "TrialApplication",
      entityId: req.params.id,
      metadata: { status: req.body.status, generatedCodeId: result.code?.id || null },
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const postAdminTrialInformationCheckEmail = async (req, res, next) => {
  try {
    const emailLog = await sendTrialInformationCheckEmail(
      req.params.id,
      req.body.status,
      req.body.emailBody,
    );
    await logAuditEvent({
      actor: req.user,
      action: "TRIAL_INFORMATION_CHECK_EMAIL_SENT",
      entityType: "TrialApplication",
      entityId: req.params.id,
      metadata: { status: req.body.status, emailLogId: emailLog.id },
    });
    res.status(201).json(emailLog);
  } catch (error) {
    next(error);
  }
};

const postAdminTrialReviewEmail = async (req, res, next) => {
  try {
    const emailLog = await resendTrialReviewEmail(
      req.params.id,
      req.body.status,
      req.body.emailBody,
    );
    await logAuditEvent({
      actor: req.user,
      action: "TRIAL_REVIEW_EMAIL_RESENT",
      entityType: "TrialApplication",
      entityId: req.params.id,
      metadata: { status: req.body.status, emailLogId: emailLog.id },
    });
    res.status(201).json(emailLog);
  } catch (error) {
    next(error);
  }
};

const patchAdminClubInviteApplicationReview = async (req, res, next) => {
  try {
    const result = await reviewClubInviteApplication(
      req.params.id,
      req.body.status,
      req.body.emailBody,
    );
    await logAuditEvent({
      actor: req.user,
      action: "CLUB_INVITE_APPLICATION_REVIEW",
      entityType: "ClubInviteApplication",
      entityId: req.params.id,
      metadata: { status: req.body.status, generatedCodeId: result.code?.id || null },
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const postAdminClubInviteInformationCheckEmail = async (req, res, next) => {
  try {
    const emailLog = await sendClubInviteInformationCheckEmail(
      req.params.id,
      req.body.status,
      req.body.emailBody,
    );
    await logAuditEvent({
      actor: req.user,
      action: "CLUB_INVITE_INFORMATION_CHECK_EMAIL_SENT",
      entityType: "ClubInviteApplication",
      entityId: req.params.id,
      metadata: { status: req.body.status, emailLogId: emailLog.id },
    });
    res.status(201).json(emailLog);
  } catch (error) {
    next(error);
  }
};

const postAdminClubInviteReviewEmail = async (req, res, next) => {
  try {
    const emailLog = await resendClubInviteReviewEmail(
      req.params.id,
      req.body.status,
      req.body.emailBody,
    );
    await logAuditEvent({
      actor: req.user,
      action: "CLUB_INVITE_REVIEW_EMAIL_RESENT",
      entityType: "ClubInviteApplication",
      entityId: req.params.id,
      metadata: { status: req.body.status, emailLogId: emailLog.id },
    });
    res.status(201).json(emailLog);
  } catch (error) {
    next(error);
  }
};

const getAdminPlayers = async (req, res, next) => {
  try {
    res.json(await listPlayers(req.query));
  } catch (error) {
    next(error);
  }
};

const getAdminClubInviteTrialCodes = async (_req, res, next) => {
  try {
    res.json(await listClubInviteTrialCodes());
  } catch (error) {
    next(error);
  }
};

const getAdminClubInviteApplications = async (_req, res, next) => {
  try {
    res.json(await listClubInviteApplications());
  } catch (error) {
    next(error);
  }
};

const postAdminClubInviteTrialCode = async (req, res, next) => {
  try {
    const invite = await createClubInviteTrialCode(req.body);
    await logAuditEvent({
      actor: req.user,
      action: "CLUB_INVITE_TRIAL_CODE_GENERATED",
      entityType: "ClubInviteTrialCode",
      entityId: invite.id,
      metadata: {
        membershipCode: invite.membershipCode,
        inviteCode: invite.inviteCode,
      },
    });
    res.status(201).json(invite);
  } catch (error) {
    next(error);
  }
};

const postAdminClubInviteTrialCodeEmail = async (req, res, next) => {
  try {
    const invite = await resendClubInviteTrialCodeEmail(
      req.params.id,
      req.body.emailBody,
    );
    await logAuditEvent({
      actor: req.user,
      action: "CLUB_INVITE_TRIAL_CODE_EMAIL_SENT",
      entityType: "ClubInviteTrialCode",
      entityId: invite.id,
      metadata: {
        membershipCode: invite.membershipCode,
        inviteCode: invite.inviteCode,
      },
    });
    res.status(201).json(invite);
  } catch (error) {
    next(error);
  }
};

const postAdminResetTestingData = async (req, res, next) => {
  try {
    const result = await resetTestingData();
    await logAuditEvent({
      actor: req.user,
      action: "RESET_TESTING_DATA",
      entityType: "Database",
      entityId: null,
      metadata: result,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const postAdminRenewalCode = async (req, res, next) => {
  try {
    const result = await createRenewalCode(req.body.playerId);
    await logAuditEvent({
      actor: req.user,
      action: "RENEWAL_CODE_GENERATED",
      entityType: "Player",
      entityId: req.body.playerId,
      metadata: { codeId: result.code.id },
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const postAdminBulkRenewalCodes = async (req, res, next) => {
  try {
    const result = await bulkCreateRenewalCodes(req.body.playerIds);
    await logAuditEvent({
      actor: req.user,
      action: "BULK_RENEWAL_CODES_GENERATED",
      entityType: "Player",
      metadata: {
        playerIds: req.body.playerIds,
        generatedCodeIds: result.map((item) => item.code.id),
      },
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getAdminCodes = async (_req, res, next) => {
  try {
    res.json(await listCodes());
  } catch (error) {
    next(error);
  }
};

const postAdminCodeEmail = async (req, res, next) => {
  try {
    const emailLog = await simulateCodeEmail(req.params.id);
    await logAuditEvent({
      actor: req.user,
      action: "CODE_EMAIL_SENT",
      entityType: "OneTimeCode",
      entityId: req.params.id,
      metadata: { emailLogId: emailLog.id },
    });
    res.status(201).json(emailLog);
  } catch (error) {
    next(error);
  }
};

const postAdminSimpleRegistrationEmail = async (req, res, next) => {
  try {
    const emailLog = await resendSimpleRegistrationEmail(
      req.params.id,
      req.body.emailBody,
    );
    await logAuditEvent({
      actor: req.user,
      action: "SIMPLE_REGISTRATION_EMAIL_SENT",
      entityType: "SimpleRegistration",
      entityId: req.params.id,
      metadata: { emailLogId: emailLog.id },
    });
    res.status(201).json(emailLog);
  } catch (error) {
    next(error);
  }
};

const postValidateCode = async (req, res, next) => {
  try {
    const code = await validateOneTimeCode(req.body);
    res.json({
      valid: true,
      type: code.type,
      membershipNumber: code.membershipNumber,
    });
  } catch (error) {
    next(error);
  }
};

const postOnboarding = async (req, res, next) => {
  try {
    const result = await createOnboardingRecord(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const postDocumentUpload = async (req, res, next) => {
  try {
    const document = await createDocumentUpload({
      file: req.file,
      type: req.body.type,
      playerId: req.body.playerId,
      onboardingRecordId: req.body.onboardingRecordId,
    });

    await logAuditEvent({
      actor: req.user,
      action: "DOCUMENT_UPLOADED",
      entityType: "Document",
      entityId: document.id,
      metadata: {
        type: document.type,
        playerId: document.playerId,
        onboardingRecordId: document.onboardingRecordId,
      },
    });

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
};

const postTrialBirthCertificateUpload = async (req, res, next) => {
  try {
    const document = await createTrialBirthCertificateUpload({
      trialApplicationId: req.params.id,
      file: req.file,
    });

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
};

const getAdminOnboardingRecords = async (_req, res, next) => {
  try {
    res.json(await listOnboardingRecords());
  } catch (error) {
    next(error);
  }
};

const getAdminExportCsv = async (_req, res, next) => {
  try {
    const csv = await exportRegistrationsCsv();
    await logAuditEvent({
      actor: _req.user,
      action: "REGISTRATION_EXPORT_DOWNLOADED",
      entityType: "Registration",
    });
    res.header("Content-Type", "text/csv");
    res.attachment("academy-registrations.csv");
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

const getAdminDocuments = async (req, res, next) => {
  try {
    res.json(await listDocuments(req.query));
  } catch (error) {
    next(error);
  }
};

const getAdminDocument = async (req, res, next) => {
  try {
    const document = await getDocument(req.params.id);
    await logAuditEvent({
      actor: req.user,
      action: "DOCUMENT_METADATA_VIEWED",
      entityType: "Document",
      entityId: req.params.id,
      metadata: { type: document.type },
    });
    res.json(document);
  } catch (error) {
    next(error);
  }
};

const getAdminDocumentFile = async (req, res, next) => {
  try {
    const document = await getDocument(req.params.id);
    const access = await getDocumentAccess(document);

    await logAuditEvent({
      actor: req.user,
      action: "DOCUMENT_FILE_VIEWED",
      entityType: "Document",
      entityId: req.params.id,
      metadata: { type: document.type, storageProvider: document.storageProvider },
    });

    if (access.type === "redirect") {
      res.redirect(access.url);
      return;
    }

    res.type(document.mimeType || "application/octet-stream");
    res.sendFile(access.path);
  } catch (error) {
    next(error);
  }
};

const getAdminAuditLogs = async (_req, res, next) => {
  try {
    res.json(await listAuditLogs());
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProgrammes,
  postPayFastNotification,
  postTrialApplication,
  getTrialApplications,
  getClubInviteApplications,
  getClubInviteTrialCodeLookup,
  postSimpleRegistration,
  patchSimpleRegistrationPayment,
  getSimpleRegistrations,
  getAdminTrialApplications,
  patchAdminTrialReview,
  postAdminTrialInformationCheckEmail,
  postAdminTrialReviewEmail,
  patchAdminClubInviteApplicationReview,
  postAdminClubInviteInformationCheckEmail,
  postAdminClubInviteReviewEmail,
  getAdminPlayers,
  getAdminClubInviteTrialCodes,
  getAdminClubInviteApplications,
  postAdminClubInviteTrialCode,
  postAdminClubInviteTrialCodeEmail,
  postAdminResetTestingData,
  postAdminRenewalCode,
  postAdminBulkRenewalCodes,
  getAdminCodes,
  postAdminCodeEmail,
  postAdminSimpleRegistrationEmail,
  postValidateCode,
  postOnboarding,
  postDocumentUpload,
  postTrialBirthCertificateUpload,
  getAdminOnboardingRecords,
  getAdminDocuments,
  getAdminDocument,
  getAdminDocumentFile,
  getAdminExportCsv,
  getAdminAuditLogs,
};
