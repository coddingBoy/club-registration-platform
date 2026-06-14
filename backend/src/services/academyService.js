const { Parser } = require("json2csv");
const prisma = require("../config/prisma");
const env = require("../config/env");
const AppError = require("../utils/appError");
const { sendEmail } = require("./emailService");
const { createPendingPayment } = require("./paymentService");
const { getProgrammeById, programmes } = require("./programmeCatalog");
const { uploadDocumentFile } = require("./storageService");

const trialFeeAmount = 500;
const membershipFlowTypes = new Set(["holiday-camp", "meet-greet"]);
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
const generateUniqueClubInviteValue = async (prefix, field) => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateCode(prefix);
    const existing = await prisma.clubInviteTrialCode.findFirst({
      where: { [field]: candidate },
    });

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

const buildSimpleRegistrationEmail = (registration) => {
  const specificFields = registration.specificFields || {};

  return {
    subject: "Cape Town Spurs registration received",
    body: `We received your ${registration.type} registration. Reference number: ${registration.referenceNumber}.${
      specificFields.membershipCode
        ? ` Membership code: ${specificFields.membershipCode}.`
        : ""
    }`,
  };
};

const findSimpleRegistrationEmailLog = (registration) =>
  prisma.emailLog.findFirst({
    where: {
      to: registration.email,
      subject: "Cape Town Spurs registration received",
      body: {
        contains: registration.referenceNumber,
      },
    },
    orderBy: { createdAt: "desc" },
  });

const findTrialEmailLog = (trialApplication) => {
  if (trialApplication.authorisationCode?.emailLogs?.length) {
    return trialApplication.authorisationCode.emailLogs[0];
  }

  return prisma.emailLog.findFirst({
    where: {
      to: trialApplication.guardianEmail,
      OR: [
        {
          subject: "Cape Town Spurs trial application received",
          body: { contains: trialApplication.playerName },
        },
        {
          subject: "Cape Town Spurs trial outcome",
          body: { contains: trialApplication.playerName },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
};

const buildClubInviteTrialEmailBody = ({ playerName, membershipCode, inviteCode }) =>
  `You have been invited to trial with Cape Town Spurs. Player: ${playerName}. Membership code: ${membershipCode}. Club invite trial code: ${inviteCode}. Registration link: ${env.clientUrl}.`;

const getClubInviteTrialCodeByMembership = async (membershipCode) => {
  if (!membershipCode) {
    throw new AppError("membershipCode is required", 400);
  }

  const invite = await prisma.clubInviteTrialCode.findUnique({
    where: { membershipCode: membershipCode.trim().toUpperCase() },
  });

  if (!invite) {
    throw new AppError("Club invite trial code not found", 404);
  }

  return {
    playerName: invite.playerName,
    email: invite.email,
    membershipCode: invite.membershipCode,
    inviteCode: invite.inviteCode,
  };
};

const createTrialApplication = async (payload) => {
  const requiredFields = [
    "playerName",
    "playerSurname",
    "dateOfBirth",
    "ageGroup",
    "gender",
    "guardianName",
    "guardianSurname",
    "guardianRelation",
    "guardianEmail",
    "guardianEmailConfirm",
    "guardianPhone",
    "province",
    "allergiesOrConditions",
    "birthCertificateFileName",
  ];

  requiredFields.forEach((field) => {
    if (!payload[field]) {
      throw new AppError(`${field} is required`, 400);
    }
  });

  const isClubInviteTrial = Boolean(payload.membershipCode || payload.clubInviteCode);

  if (isClubInviteTrial && (!payload.membershipCode || !payload.clubInviteCode)) {
    throw new AppError("Membership code and club invite trial code are required", 400);
  }

  const { trialApplication, player } = await prisma.$transaction(async (tx) => {
    let membershipNumber = await generateUniqueCode(tx, "MEM", "membershipNumber");
    let invite = null;

    if (isClubInviteTrial) {
      const membershipCode = payload.membershipCode.trim().toUpperCase();
      const clubInviteCode = payload.clubInviteCode.trim().toUpperCase();

      invite = await tx.clubInviteTrialCode.findUnique({
        where: { membershipCode },
      });

      if (!invite || invite.inviteCode !== clubInviteCode) {
        throw new AppError("You are not the membership from the club invite.", 400);
      }

      membershipNumber = invite.membershipCode;
    }

    const playerPayload = {
      firstName: payload.playerName,
      surname: payload.playerSurname,
      dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
      ageGroup: payload.ageGroup,
      gender: payload.gender,
      guardianName: payload.guardianName,
      guardianEmail: payload.guardianEmail,
      guardianPhone: payload.guardianPhone,
      status: "TRIAL_PENDING",
    };

    const player = await tx.player.upsert({
      where: { membershipNumber },
      update: playerPayload,
      create: {
        membershipNumber,
        ...playerPayload,
      },
    });

    const applicationData = {
      player: { connect: { id: player.id } },
      playerName: payload.playerName,
      playerSurname: payload.playerSurname,
      dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
      ageGroup: payload.ageGroup,
      gender: payload.gender,
      guardianName: payload.guardianName,
      guardianSurname: payload.guardianSurname,
      guardianRelation: payload.guardianRelation,
      guardianEmail: payload.guardianEmail,
      guardianEmailConfirm: payload.guardianEmailConfirm,
      guardianPhone: payload.guardianPhone,
      province: payload.province,
      allergiesOrConditions: payload.allergiesOrConditions,
      birthCertificateFileName: payload.birthCertificateFileName,
      status: "PAID",
    };

    const trialApplication = isClubInviteTrial
      ? await tx.clubInviteApplication.create({
          data: {
            ...applicationData,
            clubInviteTrialCode: { connect: { id: invite.id } },
            membershipCode: invite.membershipCode,
            inviteCode: invite.inviteCode,
          },
        })
      : await tx.trialApplication.create({
          data: {
            ...applicationData,
            trialFeeAmount,
          },
        });

    return { trialApplication, player };
  });

  const emailLog = await createEmailLog(prisma, {
    to: trialApplication.guardianEmail,
    subject: isClubInviteTrial
      ? "Cape Town Spurs club invite trial application received"
      : "Cape Town Spurs trial application received",
    body: `We received the ${isClubInviteTrial ? "club invite trial" : "trial"} application for ${trialApplication.playerName} ${trialApplication.playerSurname}. Membership number: ${player.membershipNumber}. The application is waiting for admin verification.`,
  });

  await createEmailLog(prisma, {
    to: env.adminNotificationEmail,
    subject: isClubInviteTrial
      ? "New Cape Town Spurs club invite trial application"
      : "New Cape Town Spurs trial application",
    body: `${trialApplication.playerName} ${trialApplication.playerSurname} submitted a ${isClubInviteTrial ? "club invite trial" : "trial"} application. Membership number ${player.membershipNumber} is waiting for admin verification.`,
  });

  return {
    trialApplication,
    membershipNumber: player.membershipNumber,
    emailLog,
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
  const needsMembershipFlow = membershipFlowTypes.has(payload.type);
  const membershipCode = needsMembershipFlow
    ? generateCode(payload.type === "holiday-camp" ? "CAMP-MEM" : "MEET-MEM")
    : undefined;
  const specificFields = {
    ...(payload.specificFields || {}),
    ...(needsMembershipFlow
      ? {
          membershipCode,
          paymentStatus: "PENDING",
        }
      : {}),
  };
  const registration = await prisma.simpleRegistration.create({
    data: {
      type: payload.type,
      referenceNumber,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
      parentGuardian: payload.parentGuardian || null,
      specificFields,
    },
  });

  const emailLog = await createEmailLog(prisma, {
    to: payload.email,
    ...buildSimpleRegistrationEmail({
      type: payload.type,
      referenceNumber,
      specificFields,
    }),
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
    membershipCode,
    paymentStatus: needsMembershipFlow ? "PENDING" : undefined,
    emailStatus: emailLog.status,
    emailError: emailLog.error,
    emailSentAt: emailLog.createdAt.toISOString(),
    submittedAt: updatedRegistration.createdAt.toISOString(),
    emailSimulatedAt: emailLog.createdAt.toISOString(),
    payload,
  };
};

const completeSimpleRegistrationPayment = async (registrationId) => {
  const registration = await prisma.simpleRegistration.findUnique({
    where: { id: registrationId },
  });

  if (!registration) {
    throw new AppError("Registration not found", 404);
  }

  if (!membershipFlowTypes.has(registration.type)) {
    throw new AppError("This registration type does not use the membership payment flow", 400);
  }

  const completedAt = new Date();
  const specificFields = {
    ...(registration.specificFields || {}),
    paymentStatus: "PAID",
    paymentCompletedAt: completedAt.toISOString(),
  };

  const updatedRegistration = await prisma.simpleRegistration.update({
    where: { id: registration.id },
    data: { specificFields },
  });

  await createEmailLog(prisma, {
    to: registration.email,
    subject: "Cape Town Spurs payment completed",
    body: `Payment has been simulated for ${registration.type}. Reference number: ${registration.referenceNumber}. Membership code: ${specificFields.membershipCode}.`,
  });

  return {
    id: updatedRegistration.id,
    type: updatedRegistration.type,
    referenceNumber: updatedRegistration.referenceNumber,
    fullName: updatedRegistration.fullName,
    email: updatedRegistration.email,
    phone: updatedRegistration.phone,
    dateOfBirth: updatedRegistration.dateOfBirth,
    parentGuardian: updatedRegistration.parentGuardian,
    specificFields: updatedRegistration.specificFields || {},
    submittedAt: updatedRegistration.createdAt.toISOString(),
    emailSimulatedAt:
      updatedRegistration.emailSimulatedAt?.toISOString() ||
      updatedRegistration.createdAt.toISOString(),
    membershipCode: specificFields.membershipCode,
    paymentStatus: specificFields.paymentStatus,
    paymentCompletedAt: specificFields.paymentCompletedAt,
  };
};

const listSimpleRegistrations = () =>
  prisma.simpleRegistration.findMany({
    orderBy: { createdAt: "desc" },
  }).then(async (registrations) =>
    Promise.all(
      registrations.map(async (registration) => {
        const emailLog = await findSimpleRegistrationEmailLog(registration);

        return {
          ...registration,
          emailStatus: emailLog?.status,
          emailError: emailLog?.error,
          emailSentAt: emailLog?.createdAt,
        };
      }),
    ),
  );

const resendSimpleRegistrationEmail = async (registrationId) => {
  const registration = await prisma.simpleRegistration.findUnique({
    where: { id: registrationId },
  });

  if (!registration) {
    throw new AppError("Registration not found", 404);
  }

  if (!membershipFlowTypes.has(registration.type)) {
    throw new AppError("This registration type does not use membership email resend", 400);
  }

  return createEmailLog(prisma, {
    to: registration.email,
    ...buildSimpleRegistrationEmail(registration),
  });
};

const listClubInviteTrialCodes = () =>
  prisma.clubInviteTrialCode.findMany({
    orderBy: { createdAt: "desc" },
  });

const createClubInviteTrialCode = async (payload) => {
  const requiredFields = ["playerName", "email", "emailConfirm"];

  requiredFields.forEach((field) => {
    if (!payload[field]) {
      throw new AppError(`${field} is required`, 400);
    }
  });

  if (payload.email !== payload.emailConfirm) {
    throw new AppError("Email confirmation does not match", 400);
  }

  const membershipCode = await generateUniqueClubInviteValue(
    "MEM",
    "membershipCode",
  );
  const inviteCode = await generateUniqueClubInviteValue(
    "CLUB-INVITE",
    "inviteCode",
  );

  const emailLog = await createEmailLog(prisma, {
    to: payload.email,
    subject: "Cape Town Spurs club invite trial code",
    body: buildClubInviteTrialEmailBody({
      playerName: payload.playerName,
      membershipCode,
      inviteCode,
    }),
  });

  return prisma.clubInviteTrialCode.create({
    data: {
      playerName: payload.playerName,
      email: payload.email,
      emailConfirm: payload.emailConfirm,
      membershipCode,
      inviteCode,
      emailStatus: emailLog.status,
      emailError: emailLog.error,
      emailSentAt: emailLog.createdAt,
    },
  });
};

const resendClubInviteTrialCodeEmail = async (inviteId) => {
  const invite = await prisma.clubInviteTrialCode.findUnique({
    where: { id: inviteId },
  });

  if (!invite) {
    throw new AppError("Club invite trial code not found", 404);
  }

  const emailLog = await createEmailLog(prisma, {
    to: invite.email,
    subject: "Cape Town Spurs club invite trial code",
    body: buildClubInviteTrialEmailBody(invite),
  });

  return prisma.clubInviteTrialCode.update({
    where: { id: invite.id },
    data: {
      emailStatus: emailLog.status,
      emailError: emailLog.error,
      emailSentAt: emailLog.createdAt,
    },
  });
};

const reviewTrialApplication = async (trialApplicationId, status) => {
  if (!["SUCCESSFUL", "UNSUCCESSFUL"].includes(status)) {
    throw new AppError("Trial status must be SUCCESSFUL or UNSUCCESSFUL", 400);
  }

  return prisma.$transaction(async (tx) => {
    const application = await tx.trialApplication.findUnique({
      where: { id: trialApplicationId },
      include: { player: true },
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
      if (application.playerId) {
        await tx.player.update({
          where: { id: application.playerId },
          data: { status: "TRIAL_UNSUCCESSFUL" },
        });
      }

      const emailLog = await createEmailLog(tx, {
        to: application.guardianEmail,
        subject: "Cape Town Spurs trial outcome",
        body: `Thank you for applying for trials. ${application.playerName} ${application.playerSurname} was not successful this time. Membership number: ${application.player?.membershipNumber || "not available"}.`,
      });

      return { trialApplication: updatedApplication, code: null, emailLog };
    }

    if (application.playerId) {
      await tx.player.update({
        where: { id: application.playerId },
        data: { status: "TRIAL_SUCCESSFUL" },
      });
    }

    const code = await tx.oneTimeCode.create({
      data: {
        code: await generateUniqueCode(tx, "TRIAL-AUTH"),
        type: "TRIAL_AUTHORISATION",
        ...(application.playerId
          ? { player: { connect: { id: application.playerId } } }
          : {}),
        trialApplication: { connect: { id: trialApplicationId } },
        membershipNumber: application.player?.membershipNumber,
        email: application.guardianEmail,
        expiresAt: getCodeExpiryDate(),
      },
    });

    const emailLog = await createEmailLog(tx, {
      to: application.guardianEmail,
      subject: "Cape Town Spurs trial successful",
      body: `Congratulations, ${application.playerName} ${application.playerSurname} was successful. Continue Urban Warrior onboarding here: ${env.clientUrl}. Membership number: ${application.player?.membershipNumber || "not available"}. Authorisation code: ${code.code}.`,
      codeId: code.id,
    });

    return { trialApplication: updatedApplication, code, emailLog };
  });
};

const reviewClubInviteApplication = async (applicationId, status) => {
  if (!["SUCCESSFUL", "UNSUCCESSFUL"].includes(status)) {
    throw new AppError("Trial status must be SUCCESSFUL or UNSUCCESSFUL", 400);
  }

  return prisma.$transaction(async (tx) => {
    const application = await tx.clubInviteApplication.findUnique({
      where: { id: applicationId },
      include: { player: true },
    });

    if (!application) {
      throw new AppError("Club invite application not found", 404);
    }

    if (application.status !== "PAID") {
      throw new AppError("Club invite application has already been reviewed", 409);
    }

    const updatedApplication = await tx.clubInviteApplication.update({
      where: { id: applicationId },
      data: { status },
    });

    if (status === "UNSUCCESSFUL") {
      if (application.playerId) {
        await tx.player.update({
          where: { id: application.playerId },
          data: { status: "TRIAL_UNSUCCESSFUL" },
        });
      }

      const emailLog = await createEmailLog(tx, {
        to: application.guardianEmail,
        subject: "Cape Town Spurs club invite trial outcome",
        body: `Thank you for applying for the club invite trial. ${application.playerName} ${application.playerSurname} was not successful this time. Membership number: ${application.membershipCode}.`,
      });

      return { clubInviteApplication: updatedApplication, code: null, emailLog };
    }

    if (application.playerId) {
      await tx.player.update({
        where: { id: application.playerId },
        data: { status: "TRIAL_SUCCESSFUL" },
      });
    }

    const code = await tx.oneTimeCode.create({
      data: {
        code: await generateUniqueCode(tx, "TRIAL-AUTH"),
        type: "TRIAL_AUTHORISATION",
        ...(application.playerId
          ? { player: { connect: { id: application.playerId } } }
          : {}),
        clubInviteApplication: { connect: { id: applicationId } },
        membershipNumber: application.membershipCode,
        email: application.guardianEmail,
        expiresAt: getCodeExpiryDate(),
      },
    });

    const emailLog = await createEmailLog(tx, {
      to: application.guardianEmail,
      subject: "Cape Town Spurs club invite trial successful",
      body: `Congratulations, ${application.playerName} ${application.playerSurname} was successful. Continue Urban Warrior onboarding here: ${env.clientUrl}. Membership number: ${application.membershipCode}. Authorisation code: ${code.code}.`,
      codeId: code.id,
    });

    return { clubInviteApplication: updatedApplication, code, emailLog };
  });
};

const listTrialApplications = () =>
  prisma.trialApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      player: {
        include: {
          documents: {
            where: { type: "BIRTH_CERTIFICATE" },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      authorisationCode: {
        include: {
          emailLogs: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  }).then(async (applications) =>
    Promise.all(
      applications.map(async (application) => {
        const emailLog = await findTrialEmailLog(application);

        return {
          ...application,
          membershipNumber:
            application.authorisationCode?.membershipNumber ||
            application.player?.membershipNumber,
          birthCertificateDocumentId: application.player?.documents?.[0]?.id,
          birthCertificateFileUrl: application.player?.documents?.[0]?.fileUrl,
          emailStatus: emailLog?.status,
          emailError: emailLog?.error,
          emailSentAt: emailLog?.createdAt,
        };
      }),
    ),
  );

const listClubInviteApplications = () =>
  prisma.clubInviteApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      player: {
        include: {
          documents: {
            where: { type: "BIRTH_CERTIFICATE" },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      clubInviteTrialCode: true,
      authorisationCode: {
        include: {
          emailLogs: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  }).then(async (applications) =>
    Promise.all(
      applications.map(async (application) => {
        const emailLog = application.authorisationCode?.emailLogs?.[0] ||
          await prisma.emailLog.findFirst({
          where: {
            to: application.guardianEmail,
            OR: [
              { subject: "Cape Town Spurs club invite trial application received" },
              { subject: "Cape Town Spurs club invite trial outcome" },
              { subject: "Cape Town Spurs club invite trial successful" },
            ],
            body: { contains: application.playerName },
          },
          orderBy: { createdAt: "desc" },
        });

        return {
          ...application,
          membershipNumber:
            application.membershipCode || application.player?.membershipNumber,
          authorisationCode: application.authorisationCode,
          birthCertificateDocumentId: application.player?.documents?.[0]?.id,
          birthCertificateFileUrl: application.player?.documents?.[0]?.fileUrl,
          emailStatus: emailLog?.status,
          emailError: emailLog?.error,
          emailSentAt: emailLog?.createdAt,
        };
      }),
    ),
  );

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

const createTrialBirthCertificateUpload = async ({ trialApplicationId, file }) => {
  let trialApplication = await prisma.trialApplication.findUnique({
    where: { id: trialApplicationId },
  });

  let isClubInviteApplication = false;

  if (!trialApplication) {
    trialApplication = await prisma.clubInviteApplication.findUnique({
      where: { id: trialApplicationId },
    });
    isClubInviteApplication = Boolean(trialApplication);
  }

  if (!trialApplication) {
    throw new AppError("Trial application not found", 404);
  }

  if (!trialApplication.playerId) {
    throw new AppError("Trial application is not linked to a player", 400);
  }

  const document = await createDocumentUpload({
    file,
    type: "BIRTH_CERTIFICATE",
    playerId: trialApplication.playerId,
  });

  if (isClubInviteApplication) {
    await prisma.clubInviteApplication.update({
      where: { id: trialApplication.id },
      data: { birthCertificateFileName: file.originalname },
    });
  } else {
    await prisma.trialApplication.update({
      where: { id: trialApplication.id },
      data: { birthCertificateFileName: file.originalname },
    });
  }

  return document;
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
  completeSimpleRegistrationPayment,
  resendSimpleRegistrationEmail,
  reviewTrialApplication,
  reviewClubInviteApplication,
  listTrialApplications,
  listClubInviteApplications,
  listSimpleRegistrations,
  listPlayers,
  listClubInviteTrialCodes,
  getClubInviteTrialCodeByMembership,
  createClubInviteTrialCode,
  resendClubInviteTrialCodeEmail,
  createRenewalCode,
  bulkCreateRenewalCodes,
  listCodes,
  simulateCodeEmail,
  validateOneTimeCode,
  createOnboardingRecord,
  listOnboardingRecords,
  createDocumentUpload,
  createTrialBirthCertificateUpload,
  listDocuments,
  getDocument,
  exportRegistrationsCsv,
};
