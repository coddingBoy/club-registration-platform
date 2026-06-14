const { Parser } = require("json2csv");
const prisma = require("../config/prisma");
const env = require("../config/env");
const AppError = require("../utils/appError");
const { sendEmail } = require("./emailService");
const { createPendingPayment } = require("./paymentService");
const { getProgrammeById, programmes } = require("./programmeCatalog");
const { uploadDocumentFile } = require("./storageService");

const trialFeeAmount = 500;
const documentTypes = new Set([
  "BIRTH_CERTIFICATE",
  "SIGNED_CODE_OF_CONDUCT",
  "DEBIT_ORDER",
  "DEBIT_ORDER_AUTHORISATION",
  "MEDICAL_DOCUMENT",
  "PAYMENT_PROOF",
  "OTHER",
]);

const generateCode = (prefix) => `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
const generateUniqueCode = async (client, prefix, field = "code") => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateCode(prefix);
    const existing =
      field === "membershipNumber"
        ? await client.player.findUnique({ where: { membershipNumber: candidate } })
        : await client.oneTimeCode.findUnique({ where: { code: candidate } });

    if (!existing) {
      return candidate;
    }
  }

  throw new AppError(`Could not generate a unique ${field}`, 500);
};
const getCodeExpiryDate = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.codeExpiryDays);
  return expiresAt;
};

const isExpired = (expiresAt) => expiresAt && new Date(expiresAt) <= new Date();

const createEmailLog = async (
  client,
  { to, subject, body, codeId, onboardingRecordId }
) => {
  const result = await sendEmail({ to, subject, text: body });

  return client.emailLog.create({
    data: {
      to,
      subject,
      body,
      codeId,
      onboardingRecordId,
      provider: result.provider,
      providerMessageId: result.providerMessageId,
      status: result.status,
      error: result.error,
    },
  });
};

const createTrialApplication = async (payload) => {
  const requiredFields = [
    "playerName",
    "playerSurname",
    "guardianName",
    "guardianEmail",
    "guardianPhone",
  ];

  requiredFields.forEach((field) => {
    if (!payload[field]) {
      throw new AppError(`${field} is required`, 400);
    }
  });

  const { payment, checkout } = await createPendingPayment({
    amount: trialFeeAmount,
    itemName: "Cape Town Spurs Trial Fee",
    metadata: {
      flow: "trial",
    },
  });

  const { trialApplication, player, code } = await prisma.$transaction(async (tx) => {
    const membershipNumber = await generateUniqueCode(tx, "MEM", "membershipNumber");
    const player = await tx.player.create({
      data: {
        membershipNumber,
        firstName: payload.playerName,
        surname: payload.playerSurname,
        dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
        guardianName: payload.guardianName,
        guardianEmail: payload.guardianEmail,
        guardianPhone: payload.guardianPhone,
        status: "TRIAL_SUCCESSFUL",
      },
    });

    const trialApplication = await tx.trialApplication.create({
      data: {
        playerId: player.id,
        playerName: payload.playerName,
        playerSurname: payload.playerSurname,
        dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
        guardianName: payload.guardianName,
        guardianEmail: payload.guardianEmail,
        guardianPhone: payload.guardianPhone,
        trialFeeAmount,
        status: "SUCCESSFUL",
        paymentId: payment.id,
      },
    });

    const code = await tx.oneTimeCode.create({
      data: {
        code: await generateUniqueCode(tx, "TRIAL-AUTH"),
        type: "TRIAL_AUTHORISATION",
        playerId: player.id,
        trialApplicationId: trialApplication.id,
        membershipNumber,
        email: trialApplication.guardianEmail,
        expiresAt: getCodeExpiryDate(),
      },
    });

    return { trialApplication, player, code };
  });

  await createEmailLog(prisma, {
    to: trialApplication.guardianEmail,
    subject: "Cape Town Spurs trial application received",
    body: `We received the trial application for ${trialApplication.playerName} ${trialApplication.playerSurname}. Your Urban Warrior onboarding authorisation code is ${code.code}. Membership number: ${player.membershipNumber}.`,
    codeId: code.id,
  });

  await createEmailLog(prisma, {
    to: env.adminNotificationEmail,
    subject: "New Cape Town Spurs trial application",
    body: `${trialApplication.playerName} ${trialApplication.playerSurname} submitted a trial application. Authorisation code ${code.code} and membership number ${player.membershipNumber} were generated for onboarding.`,
    codeId: code.id,
  });

  return {
    trialApplication,
    payment,
    checkout,
    onboardingCredentials: {
      authorisationCode: code.code,
      authorisationCodeId: code.id,
      membershipNumber: player.membershipNumber,
      playerName: trialApplication.playerName,
      playerSurname: trialApplication.playerSurname,
      guardianName: trialApplication.guardianName,
      guardianEmail: trialApplication.guardianEmail,
    },
  };
};

const createSimpleRegistration = async (payload) => {
  const requiredFields = ["type", "fullName", "email", "phone"];

  requiredFields.forEach((field) => {
    if (!payload[field]) {
      throw new AppError(`${field} is required`, 400);
    }
  });

  const referencePrefix = String(payload.type)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 8)
    .replace(/^-|-$/g, "");
  const referenceNumber = generateCode(referencePrefix || "REG");
  const registration = await prisma.simpleRegistration.create({
    data: {
      type: payload.type,
      referenceNumber,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
      parentGuardian: payload.parentGuardian || null,
      specificFields: payload.specificFields || {},
    },
  });

  const emailLog = await createEmailLog(prisma, {
    to: payload.email,
    subject: "Cape Town Spurs registration received",
    body: `We received your ${payload.type} registration. Reference number: ${referenceNumber}.`,
  });

  await createEmailLog(prisma, {
    to: env.adminNotificationEmail,
    subject: "New Cape Town Spurs registration",
    body: `${payload.fullName} submitted ${payload.type}. Reference number: ${referenceNumber}.`,
  });

  const updatedRegistration = await prisma.simpleRegistration.update({
    where: { id: registration.id },
    data: { emailSimulatedAt: emailLog.createdAt },
  });

  return {
    id: updatedRegistration.id,
    referenceNumber,
    submittedAt: updatedRegistration.createdAt.toISOString(),
    emailSimulatedAt: emailLog.createdAt.toISOString(),
    payload,
  };
};

const listSimpleRegistrations = () =>
  prisma.simpleRegistration.findMany({
    orderBy: { createdAt: "desc" },
  });

const reviewTrialApplication = async (trialApplicationId, status) => {
  if (!["SUCCESSFUL", "UNSUCCESSFUL"].includes(status)) {
    throw new AppError("Trial status must be SUCCESSFUL or UNSUCCESSFUL", 400);
  }

  return prisma.$transaction(async (tx) => {
    const application = await tx.trialApplication.findUnique({
      where: { id: trialApplicationId },
    });

    if (!application) {
      throw new AppError("Trial application not found", 404);
    }

    if (application.status !== "PAID") {
      throw new AppError("Trial application has already been reviewed", 409);
    }

    const updatedApplication = await tx.trialApplication.update({
      where: { id: trialApplicationId },
      data: { status },
    });

    if (status === "UNSUCCESSFUL") {
      const emailLog = await createEmailLog(tx, {
        to: application.guardianEmail,
        subject: "Cape Town Spurs trial outcome",
        body: `Thank you for attending trials. ${application.playerName} ${application.playerSurname} was not successful this time.`,
      });

      return { trialApplication: updatedApplication, code: null, emailLog };
    }

    const code = await tx.oneTimeCode.create({
      data: {
        code: generateCode("TRIAL-AUTH"),
        type: "TRIAL_AUTHORISATION",
        trialApplicationId,
        email: application.guardianEmail,
        expiresAt: getCodeExpiryDate(),
      },
    });

    const emailLog = await createEmailLog(tx, {
      to: application.guardianEmail,
      subject: "Cape Town Spurs trial successful",
      body: `Your Urban Warrior onboarding authorisation code is ${code.code}.`,
      codeId: code.id,
    });

    return { trialApplication: updatedApplication, code, emailLog };
  });
};

const listTrialApplications = () =>
  prisma.trialApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      authorisationCode: {
        include: {
          emailLogs: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

const listPlayers = ({ search, programmeId, ageGroup }) => {
  const where = {};

  if (programmeId && programmeId !== "all") {
    where.programmeId = programmeId;
  }

  if (ageGroup && ageGroup !== "all") {
    where.ageGroup = ageGroup;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { surname: { contains: search, mode: "insensitive" } },
      { membershipNumber: { contains: search, mode: "insensitive" } },
      { guardianEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.player.findMany({
    where,
    orderBy: [{ surname: "asc" }, { firstName: "asc" }],
  });
};

const createRenewalCode = async (playerId) => {
  const player = await prisma.player.findUnique({ where: { id: playerId } });

  if (!player) {
    throw new AppError("Player not found", 404);
  }

  if (!player.membershipNumber) {
    throw new AppError("Player does not have a membership number", 400);
  }

  const code = await prisma.oneTimeCode.create({
    data: {
      code: generateCode("RENEW"),
      type: "RENEWAL",
      playerId: player.id,
      membershipNumber: player.membershipNumber,
      email: player.guardianEmail || "",
      expiresAt: getCodeExpiryDate(),
    },
  });

  const emailLog = await createEmailLog(prisma, {
    to: player.guardianEmail || "",
    subject: "Cape Town Spurs renewal code",
    body: `Your Urban Warrior renewal code is ${code.code}.`,
    codeId: code.id,
  });

  return { code, emailLog };
};

const bulkCreateRenewalCodes = async (playerIds) => {
  if (!Array.isArray(playerIds) || playerIds.length === 0) {
    throw new AppError("playerIds must be a non-empty array", 400);
  }

  const results = [];

  for (const playerId of playerIds) {
    results.push(await createRenewalCode(playerId));
  }

  return results;
};

const listCodes = () =>
  prisma.oneTimeCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { emailLogs: true },
  });

const simulateCodeEmail = async (codeId) => {
  const code = await prisma.oneTimeCode.findUnique({
    where: { id: codeId },
  });

  if (!code) {
    throw new AppError("Code not found", 404);
  }

  return createEmailLog(prisma, {
    to: code.email,
    subject:
      code.type === "RENEWAL"
        ? "Cape Town Spurs renewal code"
        : "Cape Town Spurs authorisation code",
    body: `Your code is ${code.code}.${
      code.membershipNumber ? ` Membership number: ${code.membershipNumber}.` : ""
    }`,
    codeId: code.id,
  });
};

const validateOneTimeCode = async ({ code, membershipNumber }) => {
  const oneTimeCode = await prisma.oneTimeCode.findUnique({
    where: { code },
  });

  if (!oneTimeCode || oneTimeCode.usedAt || isExpired(oneTimeCode.expiresAt)) {
    throw new AppError("Invalid or already used code", 400);
  }

  if (
    oneTimeCode.type === "RENEWAL" &&
    oneTimeCode.membershipNumber !== membershipNumber
  ) {
    throw new AppError("Membership number does not match renewal code", 400);
  }

  return oneTimeCode;
};

const createOnboardingRecord = async (payload) =>
  prisma.$transaction(async (tx) => {
    const code = await tx.oneTimeCode.findUnique({
      where: { code: payload.code },
    });

    if (!code || code.usedAt || isExpired(code.expiresAt)) {
      throw new AppError("Invalid or already used code", 400);
    }

    if (code.type === "RENEWAL" && code.membershipNumber !== payload.membershipNumber) {
      throw new AppError("Membership number does not match renewal code", 400);
    }

    const programme = getProgrammeById(payload.programmeId);

    if (!programme) {
      throw new AppError("Invalid programme", 400);
    }

    const trialCreditAmount = code.type === "TRIAL_AUTHORISATION" ? trialFeeAmount : 0;
    const amountDue = Math.max(programme.registrationFee - trialCreditAmount, 0);
    const passportNumber = generateCode("CTS-UW");

    const claimedCode = await tx.oneTimeCode.updateMany({
      where: {
        id: code.id,
        usedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      data: { usedAt: new Date() },
    });

    if (claimedCode.count !== 1) {
      throw new AppError("Invalid or already used code", 400);
    }

    const paymentResult = await createPendingPayment({
      amount: amountDue,
      itemName: `Cape Town Spurs ${programme.title} Registration`,
      client: tx,
      metadata: {
        flow: "onboarding",
        paymentOption: payload.paymentOption,
        programmeId: programme.id,
      },
    });

    const onboardingRecord = await tx.onboardingRecord.create({
      data: {
        codeId: code.id,
        programmeId: programme.id,
        programmeTitle: programme.title,
        playerName: payload.playerName,
        playerSurname: payload.playerSurname,
        idNumber: payload.idNumber,
        guardianName: payload.guardianName,
        guardianEmail: payload.guardianEmail,
        debitOrderAccepted: Boolean(payload.debitOrderAccepted),
        codeOfConductAccepted: Boolean(payload.codeOfConductAccepted),
        paymentOption: payload.paymentOption,
        trialCreditAmount,
        amountDue,
        passportNumber,
        paymentId: paymentResult.payment.id,
      },
    });

    return {
      onboardingRecord,
      payment: paymentResult.payment,
      checkout: paymentResult.checkout,
    };
  });

const listOnboardingRecords = () =>
  prisma.onboardingRecord.findMany({
    orderBy: { createdAt: "desc" },
    include: { code: true, payment: true, documents: true },
  });

const createDocumentUpload = async ({ file, type, playerId, onboardingRecordId }) => {
  if (!file) {
    throw new AppError("Document file is required", 400);
  }

  if (!documentTypes.has(type)) {
    throw new AppError("Invalid document type", 400);
  }

  if (!playerId && !onboardingRecordId) {
    throw new AppError("playerId or onboardingRecordId is required", 400);
  }

  let player = null;
  let onboardingRecord = null;

  if (playerId) {
    player = await prisma.player.findUnique({ where: { id: playerId } });

    if (!player) {
      throw new AppError("Player not found", 404);
    }
  }

  if (onboardingRecordId) {
    onboardingRecord = await prisma.onboardingRecord.findUnique({
      where: { id: onboardingRecordId },
    });

    if (!onboardingRecord) {
      throw new AppError("Onboarding record not found", 404);
    }
  }

  const storedFile = await uploadDocumentFile({ file, type });

  const document = await prisma.document.create({
    data: {
      playerId: player?.id || onboardingRecord?.playerId || null,
      onboardingRecordId: onboardingRecord?.id || null,
      type,
      fileName: file.filename,
      originalName: file.originalname,
      fileUrl: storedFile.fileUrl,
      storageProvider: storedFile.storageProvider,
      storagePath: storedFile.storagePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    },
  });

  return prisma.document.update({
    where: { id: document.id },
    data: {
      fileUrl: `${env.publicApiUrl}/api/academy/admin/documents/${document.id}/file`,
    },
  });
};

const listDocuments = ({ type, playerId, onboardingRecordId } = {}) => {
  const where = {};

  if (type && type !== "all") {
    where.type = type;
  }

  if (playerId) {
    where.playerId = playerId;
  }

  if (onboardingRecordId) {
    where.onboardingRecordId = onboardingRecordId;
  }

  return prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      player: true,
      onboardingRecord: {
        select: {
          id: true,
          playerName: true,
          playerSurname: true,
          programmeTitle: true,
          passportNumber: true,
          status: true,
        },
      },
    },
  });
};

const getDocument = async (documentId) => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      player: true,
      onboardingRecord: true,
    },
  });

  if (!document) {
    throw new AppError("Document not found", 404);
  }

  return document;
};

const exportRegistrationsCsv = async () => {
  const [trials, onboardings] = await Promise.all([
    prisma.trialApplication.findMany({ include: { authorisationCode: true } }),
    prisma.onboardingRecord.findMany({ include: { payment: true, code: true } }),
  ]);

  const rows = [
    ...trials.map((trial) => ({
      type: "trial",
      name: `${trial.playerName} ${trial.playerSurname}`,
      email: trial.guardianEmail,
      status: trial.status,
      reference: trial.authorisationCode?.code || "",
      programme: "",
      amount: trial.trialFeeAmount,
      createdAt: trial.createdAt.toISOString(),
    })),
    ...onboardings.map((record) => ({
      type: "onboarding",
      name: `${record.playerName} ${record.playerSurname}`,
      email: record.guardianEmail,
      status: "complete",
      reference: record.passportNumber,
      programme: record.programmeTitle,
      amount: record.amountDue,
      createdAt: record.createdAt.toISOString(),
    })),
  ];

  const parser = new Parser();
  return parser.parse(rows);
};

module.exports = {
  programmes,
  createTrialApplication,
  createSimpleRegistration,
  reviewTrialApplication,
  listTrialApplications,
  listSimpleRegistrations,
  listPlayers,
  createRenewalCode,
  bulkCreateRenewalCodes,
  listCodes,
  simulateCodeEmail,
  validateOneTimeCode,
  createOnboardingRecord,
  listOnboardingRecords,
  createDocumentUpload,
  listDocuments,
  getDocument,
  exportRegistrationsCsv,
};
