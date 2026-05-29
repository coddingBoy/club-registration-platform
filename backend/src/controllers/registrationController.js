const path = require("path");
const AppError = require("../utils/appError");
const {
  createRegistration,
  exportRegistrationsCsv,
  listRegistrations,
  updateRegistrationStatus,
} = require("../services/registrationService");

const buildProofFields = (file) => {
  if (!file) {
    return {};
  }

  return {
    paymentProofUrl: `/uploads/proofs/${path.basename(file.path)}`,
    paymentProofName: file.originalname,
  };
};

const submitRegistration = async (req, res, next) => {
  try {
    const registration = await createRegistration({
      playerName: req.body.playerName,
      dateOfBirth: req.body.dateOfBirth,
      ageGroup: req.body.ageGroup,
      parentName: req.body.parentName,
      email: req.body.email,
      phone: req.body.phone,
      medicalNotes: req.body.medicalNotes,
      paymentReference: req.body.paymentReference,
      ...buildProofFields(req.file),
    });

    res.status(201).json({
      message: "Registration submitted successfully.",
      registration,
    });
  } catch (error) {
    next(error);
  }
};

const getRegistrations = async (req, res, next) => {
  try {
    const registrations = await listRegistrations(req.query);
    res.json(registrations);
  } catch (error) {
    next(error);
  }
};

const patchRegistrationStatus = async (req, res, next) => {
  try {
    const updatedRegistration = await updateRegistrationStatus(
      req.params.id,
      req.body.status
    );

    if (!updatedRegistration) {
      throw new AppError("Registration not found", 404);
    }

    res.json(updatedRegistration);
  } catch (error) {
    next(error);
  }
};

const downloadRegistrationsCsv = async (req, res, next) => {
  try {
    const csv = await exportRegistrationsCsv(req.query);

    res.header("Content-Type", "text/csv");
    res.attachment("registrations.csv");
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitRegistration,
  getRegistrations,
  patchRegistrationStatus,
  downloadRegistrationsCsv,
};
