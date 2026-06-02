import type { SimpleRegistrationConfig } from "../types";

export const simpleRegistrationForms: SimpleRegistrationConfig[] = [
  {
    type: "general-member",
    title: "General Member Registration",
    intro: "Simple club member registration for general communications and access.",
    referencePrefix: "MEMBER",
    dateOfBirthRelevant: true,
    parentGuardianRelevant: false,
    fields: [
      {
        name: "membershipInterest",
        label: "Membership Interest",
        type: "select",
        required: true,
        options: ["Supporter", "Family", "Community", "Volunteer"],
      },
      {
        name: "preferredContact",
        label: "Preferred Contact Method",
        type: "select",
        required: true,
        options: ["Email", "Phone"],
      },
    ],
  },
  {
    type: "holiday-camp",
    title: "Holiday Camp Registration",
    intro: "Once-off camp registration kept separate from player onboarding.",
    referencePrefix: "CAMP",
    dateOfBirthRelevant: true,
    parentGuardianRelevant: true,
    fields: [
      {
        name: "campWeek",
        label: "Camp Week",
        type: "select",
        required: true,
        options: ["Week 1", "Week 2", "Week 3"],
      },
      {
        name: "medicalNotes",
        label: "Medical Notes",
        type: "textarea",
      },
    ],
  },
  {
    type: "meet-greet",
    title: "Meet & Greet Registration",
    intro: "Registration for club meet and greet attendance.",
    referencePrefix: "MEET",
    dateOfBirthRelevant: false,
    parentGuardianRelevant: false,
    fields: [
      {
        name: "guestCount",
        label: "Number of Guests",
        type: "number",
        required: true,
      },
      {
        name: "preferredPlayer",
        label: "Preferred Player / Coach",
        type: "text",
      },
    ],
  },
  {
    type: "urban-lounge",
    title: "Urban Lounge Event Registration",
    intro: "Event registration for Urban Lounge attendance.",
    referencePrefix: "LOUNGE",
    dateOfBirthRelevant: false,
    parentGuardianRelevant: false,
    fields: [
      {
        name: "ticketType",
        label: "Ticket Type",
        type: "select",
        required: true,
        options: ["Standard", "VIP", "Table Booking"],
      },
      {
        name: "companyName",
        label: "Company / Group Name",
        type: "text",
      },
    ],
  },
  {
    type: "club-event",
    title: "Club Event Registration",
    intro: "General club event registration placeholder.",
    referencePrefix: "EVENT",
    dateOfBirthRelevant: false,
    parentGuardianRelevant: false,
    fields: [
      {
        name: "eventName",
        label: "Event",
        type: "select",
        required: true,
        options: ["Open Day", "Awards Evening", "Community Day"],
      },
      {
        name: "accessRequirements",
        label: "Access Requirements",
        type: "textarea",
      },
    ],
  },
  {
    type: "match-tickets",
    title: "Match Tickets Registration",
    intro: "Simple match ticket request form.",
    referencePrefix: "TICKET",
    dateOfBirthRelevant: false,
    parentGuardianRelevant: false,
    fields: [
      {
        name: "match",
        label: "Match",
        type: "select",
        required: true,
        options: ["Home Match 1", "Home Match 2", "Home Match 3"],
      },
      {
        name: "ticketQuantity",
        label: "Ticket Quantity",
        type: "number",
        required: true,
      },
      {
        name: "standPreference",
        label: "Stand Preference",
        type: "select",
        options: ["Main Stand", "Family Stand", "General"],
      },
    ],
  },
];

export function getSimpleRegistrationForm(type: SimpleRegistrationConfig["type"]) {
  return simpleRegistrationForms.find((form) => form.type === type);
}
