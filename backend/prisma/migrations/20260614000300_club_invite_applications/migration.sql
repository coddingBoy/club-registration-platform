CREATE TABLE "ClubInviteApplication" (
    "id" TEXT NOT NULL,
    "clubInviteTrialCodeId" TEXT NOT NULL,
    "playerId" TEXT,
    "playerName" TEXT NOT NULL,
    "playerSurname" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "ageGroup" TEXT,
    "gender" TEXT,
    "guardianName" TEXT NOT NULL,
    "guardianSurname" TEXT,
    "guardianRelation" TEXT,
    "guardianEmail" TEXT NOT NULL,
    "guardianEmailConfirm" TEXT,
    "guardianPhone" TEXT NOT NULL,
    "province" TEXT,
    "allergiesOrConditions" TEXT,
    "birthCertificateFileName" TEXT,
    "membershipCode" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "status" "TrialStatus" NOT NULL DEFAULT 'PAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubInviteApplication_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ClubInviteApplication" ADD CONSTRAINT "ClubInviteApplication_clubInviteTrialCodeId_fkey" FOREIGN KEY ("clubInviteTrialCodeId") REFERENCES "ClubInviteTrialCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClubInviteApplication" ADD CONSTRAINT "ClubInviteApplication_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
