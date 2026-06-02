import type { MockPlayer } from "../types";

export const mockPlayers: MockPlayer[] = [
  {
    id: "player-001",
    membershipNumber: "MEM-1001",
    passportNumber: "CTS-UW-1001",
    name: "Liam",
    surname: "Daniels",
    ageGroup: "U10",
    programmeId: "first-touch",
    status: "current",
    guardianEmail: "guardian.one@example.com",
  },
  {
    id: "player-002",
    membershipNumber: "MEM-1002",
    passportNumber: "CTS-UW-1002",
    name: "Noah",
    surname: "Jacobs",
    ageGroup: "U11",
    programmeId: "little-warriors",
    status: "current",
    guardianEmail: "guardian.two@example.com",
  },
  {
    id: "player-003",
    membershipNumber: "MEM-1003",
    passportNumber: "CTS-TR-1003",
    name: "Ethan",
    surname: "Mokoena",
    ageGroup: "U9",
    programmeId: "first-touch",
    status: "trial-pending",
    guardianEmail: "guardian.three@example.com",
  },
];
