import type { TrialApplication, TrialRegistration } from "../types";
import type { getTrialApplications, postTrialApplication } from "../utils/api";

type TrialApplicationResponse = Awaited<ReturnType<typeof postTrialApplication>>;
type DatabaseTrial = Awaited<ReturnType<typeof getTrialApplications>>[number];

export function buildTrialApplicationFromResponse(
  values: TrialRegistration,
  result: TrialApplicationResponse,
): TrialApplication {
  return {
    ...values,
    id: result.trialApplication.id,
    submittedAt: result.trialApplication.createdAt,
    status: "paid",
    paymentConfirmed: true,
  };
}

export function mapDatabaseTrial(trial: DatabaseTrial): TrialApplication {
  return {
    id: trial.id,
    playerName: trial.playerName,
    playerSurname: trial.playerSurname,
    dateOfBirth: trial.dateOfBirth?.slice(0, 10) ?? "",
    guardianName: trial.guardianName,
    guardianEmail: trial.guardianEmail,
    guardianPhone: trial.guardianPhone,
    submittedAt: trial.createdAt,
    status: mapTrialStatus(trial.status),
    paymentConfirmed: trial.status !== "PAYMENT_PENDING",
    authorisationCode: trial.authorisationCode?.code,
  };
}

function mapTrialStatus(status: DatabaseTrial["status"]): TrialApplication["status"] {
  if (status === "PAYMENT_PENDING") return "payment-pending";
  if (status === "SUCCESSFUL") return "successful";
  if (status === "UNSUCCESSFUL") return "unsuccessful";
  return "paid";
}
