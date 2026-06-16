import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "..");
const envPath = path.join(backendRoot, ".env");
const baseUrl = process.env.TEST_API_BASE_URL || "http://localhost:5050";

const readEnvFile = () => {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envText = fs.readFileSync(envPath, "utf8");

  return Object.fromEntries(
    envText
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
};

const envFile = readEnvFile();
const adminEmail =
  process.env.TEST_ADMIN_EMAIL || envFile.ADMIN_EMAIL || "admin@soccerschool.com";
const adminPassword = process.env.TEST_ADMIN_PASSWORD || envFile.ADMIN_PASSWORD || "admin123";

const results = [];
let token = "";

const step = async (name, fn) => {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`PASS ${name}${detail ? `: ${detail}` : ""}`);
  } catch (error) {
    results.push({ name, ok: false, detail: error.message });
    console.log(`FAIL ${name}: ${error.message}`);
  }
};

const request = async (route, options = {}) => {
  const response = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === "object" && body?.message ? body.message : String(body);
    const error = new Error(`${response.status} ${message}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
};

const expectFail = async (route, expectedStatus, options = {}) => {
  try {
    await request(route, options);
  } catch (error) {
    if (error.status === expectedStatus) {
      return error.body?.message || String(error.body);
    }
    throw error;
  }

  throw new Error(`Expected ${expectedStatus}, got success`);
};

const suffix = Date.now();
const trialPayload = {
  playerName: `Flow${suffix}`,
  playerSurname: "Tester",
  dateOfBirth: "2014-05-20",
  ageGroup: "U12",
  gender: "Male",
  guardianName: "Casey",
  guardianSurname: "Tester",
  guardianRelation: "Parent",
  guardianEmail: `flow-${suffix}@example.com`,
  guardianEmailConfirm: `flow-${suffix}@example.com`,
  guardianPhone: "+27821234567",
  province: "Western Cape",
  allergiesOrConditions: "None",
  birthCertificateFileName: "birth.pdf",
};

let trialId = "";
let authCode = "";
let membershipNumber = "";
let invite = null;
let clubInviteApplicationId = "";
let simpleId = "";

await step("health check", async () => {
  const health = await request("/api/health");
  if (health.status !== "ok") throw new Error("health status was not ok");
  return "status ok";
});

await step("admin login", async () => {
  const login = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
    }),
  });
  token = login.token;
  if (!token || login.admin?.role !== "ADMIN") throw new Error("missing admin token");
  return `role ${login.admin.role}`;
});

await step("trial validation rejects missing fields", async () => {
  const message = await expectFail("/api/academy/trials", 400, {
    method: "POST",
    body: JSON.stringify({ playerName: "Missing" }),
  });
  if (!message.includes("playerSurname")) throw new Error(`unexpected message: ${message}`);
  return message;
});

await step("create new trial application", async () => {
  const created = await request("/api/academy/trials", {
    method: "POST",
    body: JSON.stringify(trialPayload),
  });
  trialId = created.trialApplication?.id;
  membershipNumber = created.membershipNumber;
  if (!trialId || created.trialApplication.status !== "PAID") {
    throw new Error("trial was not created as paid");
  }
  return `trial ${trialId}, membership ${membershipNumber}`;
});

await step("upload birth certificate", async () => {
  const form = new FormData();
  form.append(
    "document",
    new Blob(["%PDF-1.4\n% test\n"], { type: "application/pdf" }),
    "birth.pdf",
  );
  const uploaded = await request(`/api/academy/trials/${trialId}/birth-certificate`, {
    method: "POST",
    body: form,
  });
  if (!uploaded.id || uploaded.storageProvider !== "local") {
    throw new Error("document upload did not return local document");
  }
  return `document ${uploaded.id}`;
});

await step("send information check email record", async () => {
  const emailLog = await request(`/api/academy/admin/trials/${trialId}/information-check-email`, {
    method: "POST",
    body: JSON.stringify({ status: "SUCCESSFUL", emailBody: "Information checked." }),
  });
  if (
    !emailLog.id ||
    !["SKIPPED_CONFIG", "FAILED", "SENT"].includes(emailLog.status)
  ) {
    throw new Error(`unexpected email status ${emailLog.status}`);
  }
  return `email ${emailLog.status}`;
});

await step("review trial successful and issue code", async () => {
  const reviewed = await request(`/api/academy/admin/trials/${trialId}/review`, {
    method: "PATCH",
    body: JSON.stringify({ status: "SUCCESSFUL", emailBody: "Successful trial." }),
  });
  authCode = reviewed.code?.code;
  if (!authCode || reviewed.trialApplication?.status !== "SUCCESSFUL") {
    throw new Error("review did not issue authorisation code");
  }
  return `code ${authCode}`;
});

await step("reviewed trial cannot be reviewed again", async () => {
  const message = await expectFail(`/api/academy/admin/trials/${trialId}/review`, 409, {
    method: "PATCH",
    body: JSON.stringify({ status: "UNSUCCESSFUL" }),
  });
  return message;
});

await step("validate issued code", async () => {
  const valid = await request("/api/academy/codes/validate", {
    method: "POST",
    body: JSON.stringify({ code: authCode, membershipNumber }),
  });
  if (valid.valid !== true || valid.type !== "TRIAL_AUTHORISATION") {
    throw new Error("code validation returned unexpected payload");
  }
  return valid.type;
});

await step("complete onboarding with issued code", async () => {
  const onboarded = await request("/api/academy/onboarding", {
    method: "POST",
    body: JSON.stringify({
      code: authCode,
      membershipNumber,
      programmeId: "ads",
      playerName: trialPayload.playerName,
      playerSurname: trialPayload.playerSurname,
      idNumber: "1405201234088",
      guardianName: `${trialPayload.guardianName} ${trialPayload.guardianSurname}`,
      guardianEmail: trialPayload.guardianEmail,
      debitOrderAccepted: true,
      codeOfConductAccepted: true,
      paymentOption: "monthly",
    }),
  });
  if (!onboarded.onboardingRecord?.passportNumber) {
    throw new Error("onboarding did not return passport number");
  }
  return `passport ${onboarded.onboardingRecord.passportNumber}, amount ${onboarded.onboardingRecord.amountDue}`;
});

await step("used code is rejected", async () => {
  const message = await expectFail("/api/academy/codes/validate", 400, {
    method: "POST",
    body: JSON.stringify({ code: authCode, membershipNumber }),
  });
  return message;
});

await step("create club invite trial code", async () => {
  invite = await request("/api/academy/admin/club-invite-trials", {
    method: "POST",
    body: JSON.stringify({
      playerName: `Invite ${suffix}`,
      email: `invite-${suffix}@example.com`,
      emailConfirm: `invite-${suffix}@example.com`,
    }),
  });
  if (!invite.membershipCode || !invite.inviteCode) {
    throw new Error("invite code missing");
  }
  return `${invite.membershipCode} / ${invite.inviteCode}`;
});

await step("club invite lookup succeeds", async () => {
  const lookedUp = await request(`/api/academy/club-invite-trials/${invite.membershipCode}`);
  if (lookedUp.inviteCode !== invite.inviteCode) throw new Error("invite lookup mismatch");
  return lookedUp.playerName;
});

await step("club invite application requires matching invite code", async () => {
  const message = await expectFail("/api/academy/trials", 400, {
    method: "POST",
    body: JSON.stringify({
      ...trialPayload,
      playerName: invite.playerName,
      guardianEmail: `club-bad-${suffix}@example.com`,
      guardianEmailConfirm: `club-bad-${suffix}@example.com`,
      membershipCode: invite.membershipCode,
      clubInviteCode: "WRONG-CODE",
    }),
  });
  return message;
});

await step("create club invite trial application", async () => {
  const created = await request("/api/academy/trials", {
    method: "POST",
    body: JSON.stringify({
      ...trialPayload,
      playerName: invite.playerName,
      guardianEmail: `club-${suffix}@example.com`,
      guardianEmailConfirm: `club-${suffix}@example.com`,
      membershipCode: invite.membershipCode,
      clubInviteCode: invite.inviteCode,
    }),
  });
  clubInviteApplicationId = created.trialApplication?.id;
  if (!clubInviteApplicationId || created.membershipNumber !== invite.membershipCode) {
    throw new Error("club invite application not created correctly");
  }
  return `club application ${clubInviteApplicationId}`;
});

await step("review club invite application unsuccessful", async () => {
  const reviewed = await request(
    `/api/academy/admin/club-invite-applications/${clubInviteApplicationId}/review`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: "UNSUCCESSFUL", emailBody: "Not successful." }),
    },
  );
  if (reviewed.clubInviteApplication?.status !== "UNSUCCESSFUL") {
    throw new Error("club invite review did not update status");
  }
  return reviewed.emailLog?.status || "reviewed";
});

await step("simple registration creates pending membership flow", async () => {
  const simple = await request("/api/academy/simple-registrations", {
    method: "POST",
    body: JSON.stringify({
      type: "holiday-camp",
      fullName: `Simple ${suffix}`,
      email: `simple-${suffix}@example.com`,
      phone: "+27827654321",
      dateOfBirth: "2015-01-02",
      parentGuardian: "Parent Simple",
      specificFields: { campDate: "2026-07-01" },
    }),
  });
  simpleId = simple.id;
  if (simple.paymentStatus !== "PENDING" || !simple.membershipCode) {
    throw new Error("simple registration did not create pending membership flow");
  }
  return `${simple.referenceNumber}, ${simple.membershipCode}`;
});

await step("simple registration simulated payment completes", async () => {
  const paid = await request(`/api/academy/simple-registrations/${simpleId}/simulate-payment`, {
    method: "PATCH",
  });
  if (paid.paymentStatus !== "PAID") throw new Error("payment was not marked paid");
  return paid.paymentStatus;
});

const failed = results.filter((result) => !result.ok);
console.log(`\nSUMMARY ${results.length - failed.length}/${results.length} passed`);

if (failed.length) {
  process.exitCode = 1;
}
