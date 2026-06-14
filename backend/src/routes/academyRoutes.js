const express = require("express");
const {
  getAdminCodes,
  getAdminAuditLogs,
  getAdminDocument,
  getAdminDocumentFile,
  getAdminDocuments,
  getAdminExportCsv,
  getAdminClubInviteTrialCodes,
  getAdminClubInviteApplications,
  getAdminOnboardingRecords,
  getAdminPlayers,
  getAdminTrialApplications,
  getProgrammes,
  getClubInviteApplications,
  getClubInviteTrialCodeLookup,
  getSimpleRegistrations,
  getTrialApplications,
  patchAdminTrialReview,
  patchAdminClubInviteApplicationReview,
  postAdminCodeEmail,
  postAdminClubInviteTrialCode,
  postAdminClubInviteTrialCodeEmail,
  postAdminSimpleRegistrationEmail,
  postAdminBulkRenewalCodes,
  postAdminRenewalCode,
  postDocumentUpload,
  postOnboarding,
  postPayFastNotification,
  patchSimpleRegistrationPayment,
  postSimpleRegistration,
  postTrialBirthCertificateUpload,
  postTrialApplication,
  postValidateCode,
} = require("../controllers/academyController");
const { requireRole } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const adminRead = requireRole("ADMIN", "SUPER_ADMIN", "READ_ONLY_STAFF");
const adminWrite = requireRole("ADMIN", "SUPER_ADMIN");

const router = express.Router();

router.get("/programmes", getProgrammes);
router.get("/trials", getTrialApplications);
router.post("/trials", postTrialApplication);
router.get("/club-invite-applications", getClubInviteApplications);
router.get("/club-invite-trials/:membershipCode", getClubInviteTrialCodeLookup);
router.post(
  "/trials/:id/birth-certificate",
  upload.single("document"),
  postTrialBirthCertificateUpload,
);
router.get("/simple-registrations", getSimpleRegistrations);
router.post("/simple-registrations", postSimpleRegistration);
router.patch("/simple-registrations/:id/simulate-payment", patchSimpleRegistrationPayment);
router.post("/codes/validate", postValidateCode);
router.post("/onboarding", postOnboarding);
router.post(
  "/documents",
  requireRole("ADMIN", "SUPER_ADMIN", "PLAYER_PARENT"),
  upload.single("document"),
  postDocumentUpload,
);
router.post("/payments/payfast/itn", postPayFastNotification);

router.get("/admin/trials", adminRead, getAdminTrialApplications);
router.patch("/admin/trials/:id/review", adminWrite, patchAdminTrialReview);
router.get("/admin/club-invite-applications", adminRead, getAdminClubInviteApplications);
router.patch(
  "/admin/club-invite-applications/:id/review",
  adminWrite,
  patchAdminClubInviteApplicationReview,
);
router.get("/admin/club-invite-trials", adminRead, getAdminClubInviteTrialCodes);
router.post("/admin/club-invite-trials", adminWrite, postAdminClubInviteTrialCode);
router.post(
  "/admin/club-invite-trials/:id/send-email",
  adminWrite,
  postAdminClubInviteTrialCodeEmail,
);
router.get("/admin/players", adminRead, getAdminPlayers);
router.post("/admin/renewal-codes", adminWrite, postAdminRenewalCode);
router.post("/admin/renewal-codes/bulk", adminWrite, postAdminBulkRenewalCodes);
router.get("/admin/codes", adminRead, getAdminCodes);
router.post("/admin/codes/:id/send-email", adminWrite, postAdminCodeEmail);
router.post(
  "/admin/simple-registrations/:id/send-email",
  adminWrite,
  postAdminSimpleRegistrationEmail,
);
router.get("/admin/onboarding", adminRead, getAdminOnboardingRecords);
router.get("/admin/documents", adminRead, getAdminDocuments);
router.get("/admin/documents/:id/file", adminRead, getAdminDocumentFile);
router.get("/admin/documents/:id", adminRead, getAdminDocument);
router.get("/admin/audit-logs", requireRole("SUPER_ADMIN"), getAdminAuditLogs);
router.get("/admin/export/csv", adminWrite, getAdminExportCsv);

module.exports = router;
