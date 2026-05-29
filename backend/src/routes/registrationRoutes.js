const express = require("express");
const {
  downloadRegistrationsCsv,
  getRegistrations,
  patchRegistrationStatus,
  submitRegistration,
} = require("../controllers/registrationController");
const requireAuth = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", upload.single("paymentProof"), submitRegistration);
router.get("/", requireAuth, getRegistrations);
router.get("/export/csv", requireAuth, downloadRegistrationsCsv);
router.patch("/:id/status", requireAuth, patchRegistrationStatus);

module.exports = router;
