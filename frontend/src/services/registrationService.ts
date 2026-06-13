import type { SimpleRegistrationRecord, SimpleRegistrationType } from "../types";
import type { getSimpleRegistrations } from "../utils/api";

type DatabaseSimpleRegistration = Awaited<ReturnType<typeof getSimpleRegistrations>>[number];

export function mapDatabaseSimpleRegistration(
  registration: DatabaseSimpleRegistration,
): SimpleRegistrationRecord {
  return {
    id: registration.id,
    type: registration.type as SimpleRegistrationType,
    referenceNumber: registration.referenceNumber,
    fullName: registration.fullName,
    email: registration.email,
    phone: registration.phone,
    dateOfBirth: registration.dateOfBirth?.slice(0, 10),
    parentGuardian: registration.parentGuardian ?? undefined,
    specificFields: registration.specificFields ?? {},
    submittedAt: registration.createdAt,
    emailSimulatedAt: registration.emailSimulatedAt ?? registration.createdAt,
  };
}

export function isSimpleRegistrationType(value: string): value is SimpleRegistrationType {
  return [
    "general-member",
    "holiday-camp",
    "meet-greet",
    "urban-lounge",
    "club-event",
    "match-tickets",
  ].includes(value);
}
