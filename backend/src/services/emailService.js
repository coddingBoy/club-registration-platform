const { Resend } = require("resend");
const nodemailer = require("nodemailer");
const env = require("../config/env");

const getResendClient = () => {
  if (!env.resendApiKey) {
    return null;
  }

  return new Resend(env.resendApiKey);
};

const getSmtpClient = () => {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    connectionTimeout: env.smtpConnectionTimeoutMs,
    greetingTimeout: env.smtpGreetingTimeoutMs,
    socketTimeout: env.smtpSocketTimeoutMs,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
};

const sendResendEmail = async ({ to, subject, text, html }) => {
  const client = getResendClient();
  if (!client) {
    return {
      provider: env.emailProvider,
      status: "SKIPPED_CONFIG",
      providerMessageId: "",
    };
  }

  const response = await client.emails.send({
    from: env.emailFrom,
    to,
    subject,
    text,
    html,
  });

  if (response.error) {
    return {
      provider: env.emailProvider,
      status: "FAILED",
      providerMessageId: "",
      error: response.error.message || String(response.error),
    };
  }

  return {
    provider: env.emailProvider,
    status: "SENT",
    providerMessageId: response.data?.id || "",
  };
};

const sendSmtpEmail = async ({ to, subject, text, html }) => {
  const client = getSmtpClient();
  if (!client) {
    return {
      provider: env.emailProvider,
      status: "SKIPPED_CONFIG",
      providerMessageId: "",
    };
  }

  try {
    const response = await client.sendMail({
      from: env.emailFrom,
      to,
      subject,
      text,
      html,
    });

    return {
      provider: env.emailProvider,
      status: "SENT",
      providerMessageId: response.messageId || "",
    };
  } catch (error) {
    return {
      provider: env.emailProvider,
      status: "FAILED",
      providerMessageId: "",
      error: error.message || String(error),
    };
  }
};

const sendEmail = async (message) => {
  if (env.emailProvider === "resend") {
    return sendResendEmail(message);
  }

  if (env.emailProvider === "smtp") {
    return sendSmtpEmail(message);
  }

  return {
    provider: env.emailProvider,
    status: "FAILED",
    providerMessageId: "",
    error: `Unsupported email provider: ${env.emailProvider}`,
  };
};

module.exports = {
  sendEmail,
};
