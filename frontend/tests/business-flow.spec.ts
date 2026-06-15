import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const apiBaseUrl = process.env.TEST_API_BASE_URL || "http://localhost:5050";
const adminEmail = process.env.TEST_ADMIN_EMAIL || "admin@soccerschool.com";
const adminPassword = process.env.TEST_ADMIN_PASSWORD || "admin123";

type AdminSession = {
  token: string;
};

type TrialFixture = {
  playerName: string;
  playerSurname: string;
  guardianName: string;
  guardianSurname: string;
  guardianEmail: string;
  phone: string;
};

const loginAdminByApi = async (request: APIRequestContext) => {
  const response = await request.post(`${apiBaseUrl}/api/auth/login`, {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as AdminSession;
};

const resetTestingData = async (request: APIRequestContext) => {
  const { token } = await loginAdminByApi(request);
  const response = await request.post(`${apiBaseUrl}/api/academy/admin/testing/reset-data`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok()).toBeTruthy();
};

const createTrialFixture = (): TrialFixture => {
  const suffix = Date.now();

  return {
    playerName: `Ui${suffix}`,
    playerSurname: "Tester",
    guardianName: "Casey",
    guardianSurname: "Tester",
    guardianEmail: `ui-${suffix}@example.com`,
    phone: "0821234567",
  };
};

const selectTopTab = async (page: Page, label: string) => {
  await page.getByRole("navigation", { name: "System sections" }).getByRole("button", { name: label }).click();
};

const fillTrialForm = async (
  page: Page,
  fixture: TrialFixture,
  options: { playerNameLocked?: boolean } = {},
) => {
  if (!options.playerNameLocked) {
    await page.locator("#trialPlayerName").fill(fixture.playerName);
  }
  await page.locator("#trialPlayerSurname").fill(fixture.playerSurname);
  await page.locator("#trialDob").fill("2014-05-20");
  await page.locator("#trialGender").selectOption("Male");
  await page.locator("#trialBirthCertificate").setInputFiles({
    name: "birth.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% UI flow test\n"),
  });
  await page.locator("#trialGuardian").fill(fixture.guardianName);
  await page.locator("#trialGuardianSurname").fill(fixture.guardianSurname);
  await page.locator("#trialRelation").selectOption("Father");
  await page.locator("#trialEmail").fill(fixture.guardianEmail);
  await page.locator("#trialEmailConfirm").fill(fixture.guardianEmail);
  await page.locator("#trialPhone").fill(fixture.phone);
  await page.locator("#trialProvince").selectOption("Western Cape");
  await page.locator("#trialMedical").fill("None");
};

const sendOpenEmailComposer = async (page: Page, title: string) => {
  const dialog = page.getByRole("dialog", { name: title });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Send Email" }).click();
  await expect(dialog).toBeHidden();
};

const generateAdminInvite = async (page: Page, suffix: number) => {
  await selectTopTab(page, "Admin");
  await page.locator("#adminEmail").fill(adminEmail);
  await page.locator("#adminPassword").fill(adminPassword);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Club Invite Trial Codes" })).toBeVisible();

  const playerName = `Invite ${suffix}`;
  const email = `invite-ui-${suffix}@example.com`;

  await page.locator("#clubInvitePlayerName").fill(playerName);
  await page.locator("#clubInviteEmail").fill(email);
  await page.locator("#clubInviteEmailConfirm").fill(email);
  await page.getByRole("button", { name: "Generate Invite" }).click();

  const row = page.getByRole("row").filter({ hasText: playerName });
  await expect(row).toContainText("MEM-");
  await expect(row).toContainText("CLUB-INVITE-");

  const membershipCode = (await row.locator("td").nth(2).innerText()).trim();
  const inviteCode = (await row.locator("td").nth(3).innerText()).trim();

  return { playerName, membershipCode, inviteCode };
};

test.beforeEach(async ({ request }) => {
  await resetTestingData(request);
});

test("new trial to admin approval to onboarding", async ({ page }) => {
  const fixture = createTrialFixture();

  await page.goto("/");
  await expect(page.getByRole("button", { name: "New Trial" })).toHaveClass(/active/);

  await page.getByRole("button", { name: "Save Trial Application" }).click();
  await expect(page.getByText("Please fix the highlighted fields before saving.")).toBeVisible();

  await fillTrialForm(page, fixture);
  await page.getByRole("button", { name: "Save Trial Application" }).click();
  await expect(page.getByText(/Trial application saved\. Membership number MEM-/)).toBeVisible();

  await selectTopTab(page, "Admin");
  await page.locator("#adminEmail").fill(adminEmail);
  await page.locator("#adminPassword").fill(adminPassword);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "New Trial Applications" })).toBeVisible();

  const trialRow = page.getByRole("row").filter({ hasText: `${fixture.playerName} ${fixture.playerSurname}` });
  await expect(trialRow).toContainText("Waiting Admin Verification");

  await trialRow.getByRole("button", { name: "Info Check OK" }).click();
  await sendOpenEmailComposer(page, "Information Check Successful Email");
  await expect(trialRow.locator("td").nth(11)).not.toContainText("Unknown");

  await trialRow.getByRole("button", { name: "Successful" }).click();
  await sendOpenEmailComposer(page, "Final Successful Review Email");
  await expect(trialRow).toContainText("Onboarding Issued");
  await expect(trialRow).toContainText("TRIAL-AUTH-");

  const membershipNumber = (await trialRow.locator("td").nth(8).innerText()).trim();
  const authorisationCode = (await trialRow.locator("td").nth(9).innerText()).trim();

  await selectTopTab(page, "Urban Warrior Onboarding");
  await page.locator("#authCode").fill(authorisationCode);
  await page.locator("#onboardMembership").fill(membershipNumber);
  await page.locator("#onboardProgramme").selectOption("first-touch");
  await page.locator("#onboardName").fill(fixture.playerName);
  await page.locator("#onboardSurname").fill(fixture.playerSurname);
  await page.locator("#onboardId").fill("1405201234088");
  await page.locator("#onboardGuardian").fill(`${fixture.guardianName} ${fixture.guardianSurname}`);
  await page.locator("#onboardEmail").fill(fixture.guardianEmail);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Accept Code of Conduct").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Authorise debit order placeholder").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("strong").filter({ hasText: "Amount due now" })).toContainText(
    "R 2 100,00",
  );
  await page.getByRole("button", { name: "Complete Payment" }).click();

  await expect(page.getByRole("heading", { name: "Onboarding Complete" })).toBeVisible();
  await expect(page.getByText(/New Passport Number:/)).toBeVisible();
});

test("club invite lookup and application flow", async ({ page }) => {
  const suffix = Date.now();
  await page.goto("/");
  const invite = await generateAdminInvite(page, suffix);

  await selectTopTab(page, "Player Registration");
  await page.getByRole("button", { name: "Club Invite Trial" }).click();
  await page.locator("#clubInviteMembershipCode").fill(invite.membershipCode);
  await page.getByRole("button", { name: "Lookup Invite" }).click();
  await expect(page.getByText("Club invite details found. Please complete the remaining trial form.")).toBeVisible();
  await expect(page.locator("#clubInviteCode")).toHaveValue(invite.inviteCode);
  await expect(page.locator("#trialPlayerName")).toHaveValue("Invite");

  await fillTrialForm(page, {
    playerName: "Invite",
    playerSurname: String(suffix),
    guardianName: "Jordan",
    guardianSurname: "Guardian",
    guardianEmail: `club-ui-${suffix}@example.com`,
    phone: "0827654321",
  }, { playerNameLocked: true });
  await expect(page.locator("#clubInviteCode")).toHaveValue(invite.inviteCode);
  await page.getByRole("button", { name: "Save Trial Application" }).click();
  await expect(page.getByText(/Club invite trial application saved\. Membership number MEM-/)).toBeVisible();
});

test("holiday camp membership payment flow", async ({ page }) => {
  const suffix = Date.now();

  await page.goto("/");
  await selectTopTab(page, "Holiday Camp");
  await page.locator("#holiday-camp-fullName").fill(`Camp ${suffix}`);
  await page.locator("#holiday-camp-email").fill(`camp-ui-${suffix}@example.com`);
  await page.locator("#holiday-camp-phone").fill("0825551234");
  await page.locator("#holiday-camp-dob").fill("2015-01-02");
  await page.locator("#holiday-camp-guardian").fill("Camp Parent");
  await page.locator("#holiday-camp-campWeek").selectOption("Week 1");
  await page.locator("#holiday-camp-medicalNotes").fill("None");
  await page.getByRole("button", { name: "Generate Membership Code" }).click();

  await expect(page.getByText(/Membership code CAMP-MEM-/)).toBeVisible();
  await page.getByRole("button", { name: "Simulate Payment & Finish" }).click();
  await expect(page.getByText(/Payment simulated\. Holiday Camp Registration complete\./)).toBeVisible();
});
