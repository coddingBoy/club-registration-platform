const { Resend } = require("resend");
const env = require("../config/env");

const getProviderClient = () => {
  if (env.emailProvider !== "resend") {
    throw new Error(`Unsupported email provider: ${env.emailProvider}`);
  }

  if (!env.resendApiKey) {
    return null;
  }

  return new Resend(env.resendApiKey);
};

const sendEmail = async ({ to, subject, text }) => {
  const client = getProviderClient();

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

module.exports = {
  sendEmail,
};
