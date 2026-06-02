const crypto = require("crypto");
const env = require("../config/env");
const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { sendEmail } = require("./emailService");

const formatAmount = (amount) => Number(amount).toFixed(2);

const encodePayFastValue = (value) =>
  encodeURIComponent(String(value).trim()).replace(/%20/g, "+");

const buildSignaturePayload = (fields) =>
  Object.entries(fields)
    .filter(([key, value]) => key !== "signature" && value !== undefined && value !== "")
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${encodePayFastValue(value)}`)
    .join("&");

const createPayFastSignature = (fields) => {
  const signatureFields = { ...fields };

  if (env.payfastPassphrase) {
    signatureFields.passphrase = env.payfastPassphrase;
  }

  return crypto.createHash("md5").update(buildSignaturePayload(signatureFields)).digest("hex");
};

const buildPayFastCheckout = (payment, itemName) => {
  if (!env.payfastMerchantId || !env.payfastMerchantKey) {
    throw new AppError("PayFast merchant credentials are not configured", 500);
  }

  const fields = {
    merchant_id: env.payfastMerchantId,
    merchant_key: env.payfastMerchantKey,
    return_url: env.paymentReturnUrl,
    cancel_url: env.paymentCancelUrl,
    notify_url: `${env.publicApiUrl}/api/academy/payments/payfast/itn`,
    m_payment_id: payment.id,
    amount: formatAmount(payment.amount),
    item_name: itemName,
  };

  return {
    provider: "payfast",
    checkoutUrl: env.payfastProcessUrl,
    fields: {
      ...fields,
      signature: createPayFastSignature(fields),
    },
  };
};

const createPendingPayment = async ({ amount, metadata, itemName, client = prisma }) => {
  const payment = await client.payment.create({
    data: {
      amount,
      provider: "payfast",
      status: "PENDING",
      metadata,
    },
  });
  const checkout = buildPayFastCheckout(payment, itemName);

  await client.payment.update({
    where: { id: payment.id },
    data: { checkoutUrl: checkout.checkoutUrl },
  });

  return { payment, checkout };
};

const verifyPayFastSignature = (payload) => {
  if (!payload.signature) {
    return false;
  }

  return createPayFastSignature(payload) === payload.signature;
};

const handlePayFastNotification = async (payload) => {
  if (!verifyPayFastSignature(payload)) {
    throw new AppError("Invalid PayFast signature", 400);
  }

  const paymentId = payload.m_payment_id;
  const paymentStatus = String(payload.payment_status || "").toUpperCase();

  if (!paymentId) {
    throw new AppError("Missing PayFast payment id", 400);
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        trialApplications: true,
        onboardingRecords: true,
      },
    });

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    const status = paymentStatus === "COMPLETE" ? "PAID" : "FAILED";
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status,
        providerReference: payload.pf_payment_id || payment.providerReference,
        metadata: {
          ...(payment.metadata || {}),
          payfastNotification: payload,
        },
      },
    });

    if (status === "PAID") {
      for (const trial of payment.trialApplications) {
        await tx.trialApplication.update({
          where: { id: trial.id },
          data: { status: "PAID" },
        });
      }

      for (const onboarding of payment.onboardingRecords) {
        await tx.onboardingRecord.update({
          where: { id: onboarding.id },
          data: { status: "COMPLETE" },
        });

        const paymentEmailResult = await sendEmail({
          to: onboarding.guardianEmail,
          subject: "Cape Town Spurs payment confirmation",
          text: `Payment of R${payment.amount} has been confirmed for ${onboarding.programmeTitle}.`,
        });

        await tx.emailLog.create({
          data: {
            to: onboarding.guardianEmail,
            subject: "Cape Town Spurs payment confirmation",
            body: `Payment of R${payment.amount} has been confirmed for ${onboarding.programmeTitle}.`,
            onboardingRecordId: onboarding.id,
            provider: paymentEmailResult.provider,
            providerMessageId: paymentEmailResult.providerMessageId,
            status: paymentEmailResult.status,
            error: paymentEmailResult.error,
          },
        });

        const completeEmailResult = await sendEmail({
          to: onboarding.guardianEmail,
          subject: "Cape Town Spurs onboarding complete",
          text: `Onboarding is complete for ${onboarding.programmeTitle}. Passport number: ${onboarding.passportNumber}.`,
        });

        await tx.emailLog.create({
          data: {
            to: onboarding.guardianEmail,
            subject: "Cape Town Spurs onboarding complete",
            body: `Onboarding is complete for ${onboarding.programmeTitle}. Passport number: ${onboarding.passportNumber}.`,
            onboardingRecordId: onboarding.id,
            provider: completeEmailResult.provider,
            providerMessageId: completeEmailResult.providerMessageId,
            status: completeEmailResult.status,
            error: completeEmailResult.error,
          },
        });
      }
    } else {
      for (const onboarding of payment.onboardingRecords) {
        await tx.onboardingRecord.update({
          where: { id: onboarding.id },
          data: { status: "PAYMENT_FAILED" },
        });
      }
    }

    return updatedPayment;
  });
};

module.exports = {
  buildPayFastCheckout,
  createPendingPayment,
  createPayFastSignature,
  handlePayFastNotification,
};
