const express = require("express");
const {
  getAdminCodes,
  getAdminAuditLogs,
  getAdminDocument,
  getAdminDocumentFile,
  getAdminDocuments,
  getAdminExportCsv,
  getAdminOnboardingRecords,
  getAdminPlayers,
  getAdminTrialApplications,
  getProgrammes,
  getSimpleRegistrations,
  getTrialApplications,
  patchAdminTrialReview,
  postAdminCodeEmail,
  postAdminSimpleRegistrationEmail,
  postAdminBulkRenewalCodes,
  postAdminRenewalCode,
  postDocumentUpload,
  postOnboarding,
  postPayFastNotification,
  patchSimpleRegistrationPayment,
  postSimpleRegistration,
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
