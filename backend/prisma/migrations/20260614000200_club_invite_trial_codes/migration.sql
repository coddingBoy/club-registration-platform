CREATE TABLE "ClubInviteTrialCode" (
  "id" TEXT NOT NULL,
  "playerName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailConfirm" TEXT NOT NULL,
  "membershipCode" TEXT NOT NULL,
  "inviteCode" TEXT NOT NULL,
  "emailStatus" TEXT,
  "emailError" TEXT,
  "emailSentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClubInviteTrialCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClubInviteTrialCode_membershipCode_key" ON "ClubInviteTrialCode"("membershipCode");
CREATE UNIQUE INDEX "ClubInviteTrialCode_inviteCode_key" ON "ClubInviteTrialCode"("inviteCode");
