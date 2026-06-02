const express = require("express");
const {
  downloadRegistrationsCsv,
  getRegistrations,
  patchRegistrationStatus,
  submitRegistration,
} = require("../controllers/registrationController");
const { requireRole } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", upload.single("paymentProof"), submitRegistration);
router.get("/", requireRole("ADMIN", "SUPER_ADMIN", "READ_ONLY_STAFF"), getRegistrations);
router.get("/export/csv", requireRole("ADMIN", "SUPER_ADMIN"), downloadRegistrationsCsv);
router.patch("/:id/status", requireRole("ADMIN", "SUPER_ADMIN"), patchRegistrationStatus);

module.exports = router;
