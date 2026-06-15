DELETE FROM "ClubInviteApplication" old_application
WHERE EXISTS (
  SELECT 1
  FROM "ClubInviteApplication" latest_application
  WHERE latest_application."membershipCode" = old_application."membershipCode"
    AND (
      latest_application."updatedAt" > old_application."updatedAt"
      OR (
        latest_application."updatedAt" = old_application."updatedAt"
        AND latest_application."id" > old_application."id"
      )
    )
);

CREATE UNIQUE INDEX "ClubInviteApplication_membershipCode_key" ON "ClubInviteApplication"("membershipCode");
