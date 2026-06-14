ALTER TABLE "OneTimeCode" ADD COLUMN "clubInviteApplicationId" TEXT;

CREATE UNIQUE INDEX "OneTimeCode_clubInviteApplicationId_key" ON "OneTimeCode"("clubInviteApplicationId");

ALTER TABLE "OneTimeCode" ADD CONSTRAINT "OneTimeCode_clubInviteApplicationId_fkey" FOREIGN KEY ("clubInviteApplicationId") REFERENCES "ClubInviteApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
