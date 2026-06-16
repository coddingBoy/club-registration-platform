const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  adminEmail: process.env.ADMIN_EMAIL || "admin@soccerschool.com",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || "",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  emailProvider: process.env.EMAIL_PROVIDER || "resend",
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom:
    process.env.EMAIL_FROM || "Cape Town Spurs <registrations@capetownspurs.co.za>",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpConnectionTimeoutMs:
    Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 10_000,
  smtpGreetingTimeoutMs: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 10_000,
  smtpSocketTimeoutMs: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 15_000,
  adminNotificationEmail:
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "admin@soccerschool.com",
  paymentProvider: process.env.PAYMENT_PROVIDER || "payfast",
  payfastMerchantId: process.env.PAYFAST_MERCHANT_ID || "",
  payfastMerchantKey: process.env.PAYFAST_MERCHANT_KEY || "",
  payfastPassphrase: process.env.PAYFAST_PASSPHRASE || "",
  payfastProcessUrl:
    process.env.PAYFAST_PROCESS_URL || "https://sandbox.payfast.co.za/eng/process",
  publicApiUrl: process.env.PUBLIC_API_URL || "http://localhost:5050",
  paymentReturnUrl:
    process.env.PAYMENT_RETURN_URL || "http://localhost:5173/payment/success",
  paymentCancelUrl:
    process.env.PAYMENT_CANCEL_URL || "http://localhost:5173/payment/cancel",
  storageProvider: process.env.STORAGE_PROVIDER || "supabase",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseStorageBucket:
    process.env.SUPABASE_STORAGE_BUCKET || "cape-town-spurs-documents",
  localStorageBaseUrl:
    process.env.LOCAL_STORAGE_BASE_URL ||
    process.env.PUBLIC_API_URL ||
    "http://localhost:5050",
  codeExpiryDays: Number(process.env.CODE_EXPIRY_DAYS) || 30,
  trialStartDate: process.env.TRIAL_START_DATE || "To be confirmed",
  trialEndDate: process.env.TRIAL_END_DATE || "To be confirmed",
  trialArrivalTime: process.env.TRIAL_ARRIVAL_TIME || "To be confirmed",
};

module.exports = env;
