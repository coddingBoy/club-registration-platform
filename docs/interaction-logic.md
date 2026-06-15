# Existing Interaction Logic

Source review date: 2026-06-15

This document maps the current interaction logic implemented in the React frontend and Express API. It is intended as a web design reference for screens, user paths, admin actions, and backend state changes.

## Screen And Role Flow

```mermaid
flowchart TD
  Start([User opens app]) --> Shell[Layout: header + main flow + programme summary]
  Shell --> Tabs[Public tab selector]

  Tabs --> PlayerTab[Player Registration]
  Tabs --> OnboardingTab[Urban Warrior Onboarding]
  Tabs --> SimpleTabs[Simple registration tabs]
  Tabs --> AdminTab[Admin]
  Tabs --> DisabledTabs[Disabled tabs]

  DisabledTabs --> PlayerTab

  PlayerTab --> Journey{Choose player path}
  Journey --> NewTrial[New Trial]
  Journey --> ClubInviteTrial[Club Invite Trial]
  Journey --> Renewal[Renewal]

  NewTrial --> TrialForm[Trial form]
  TrialForm --> TrialValidate{Client validation}
  TrialValidate -->|Invalid| TrialErrors[Show field errors]
  TrialValidate -->|Valid| CreateTrial[POST /api/academy/trials]
  CreateTrial --> UploadBirthCert[POST /api/academy/trials/:id/birth-certificate]
  UploadBirthCert --> TrialSaved[Save in app state as trial application]
  TrialSaved --> AdminWaiting[Waiting admin verification]

  ClubInviteTrial --> InviteLookup[Enter membership code]
  InviteLookup --> LookupApi[GET /api/academy/club-invite-trials/:membershipCode]
  LookupApi -->|Found| PrefillInvite[Lock invite code and player name]
  LookupApi -->|Not found| LookupError[Show lookup error]
  PrefillInvite --> TrialForm

  Renewal --> RenewalForm[Membership number + renewal code]
  RenewalForm --> ValidateRenewal[POST /api/academy/codes/validate]
  ValidateRenewal -->|Valid| OnboardingTab
  ValidateRenewal -->|Invalid| RenewalError[Show code error]

  OnboardingTab --> Step0[Step 1: confirm details and code]
  Step0 --> ValidateCode[POST /api/academy/codes/validate]
  ValidateCode -->|Invalid| CodeError[Show invalid code message]
  ValidateCode -->|Valid| Step1[Step 2: code of conduct]
  Step1 --> Step2[Step 3: debit order authorisation]
  Step2 --> Step3[Step 4: payment option]
  Step3 --> CreateOnboarding[POST /api/academy/onboarding]
  CreateOnboarding --> Completion[Step 5: passport number + completion message]

  SimpleTabs --> SimpleForm[Config-driven simple form]
  SimpleForm --> SimpleValidate{Client validation}
  SimpleValidate -->|Invalid| SimpleErrors[Show field errors]
  SimpleValidate -->|Valid| CreateSimple[POST /api/academy/simple-registrations]
  CreateSimple --> PaymentNeeded{Holiday camp or meet & greet?}
  PaymentNeeded -->|Yes| SimPayment[PATCH /api/academy/simple-registrations/:id/simulate-payment]
  PaymentNeeded -->|No| SimpleDone[Reference returned + confirmation logged]
  SimPayment --> SimpleDone

  AdminTab --> HasSession{Admin session in localStorage?}
  HasSession -->|No| LoginForm[Admin login form]
  LoginForm --> LoginApi[POST /api/auth/login]
  LoginApi -->|Success| AdminDashboard[Admin dashboard]
  LoginApi -->|Failure| LoginError[Show login error]
  HasSession -->|Yes| AdminDashboard

  AdminDashboard --> ClubInviteCodes[Generate / resend club invite trial codes]
  AdminDashboard --> ReviewTables[Review trial and club invite applications]
  AdminDashboard --> SimpleAdmin[View simple registrations + resend emails]
  AdminDashboard --> OnboardingAdmin[View onboarding completions]
  AdminDashboard --> ExportCsv[Client-side CSV export]
  AdminDashboard --> ResetData[Confirm + reset testing data]
```

## Admin Review Flow

```mermaid
flowchart TD
  AdminDashboard[Admin dashboard] --> AppRow[Trial or club invite application row]
  AppRow --> ViewDocument{Birth certificate document exists?}
  ViewDocument -->|Yes| Preview[GET /api/academy/admin/documents/:id/file]
  ViewDocument -->|No| NoPreview[No document action]

  AppRow --> InfoCheck[Info check buttons]
  InfoCheck --> InfoComposer[Open editable email composer]
  InfoComposer --> InfoSend{Send email?}
  InfoSend -->|Cancel| AppRow
  InfoSend -->|Send OK| InfoOk[POST information-check-email with SUCCESSFUL]
  InfoSend -->|Send fail| InfoFail[POST information-check-email with UNSUCCESSFUL]
  InfoOk --> UpdateInfoStatus[Update information email status in table]
  InfoFail --> UpdateInfoStatus

  AppRow --> CanFinalReview{Application status is paid?}
  CanFinalReview -->|Yes| FinalButtons[Successful / Fail buttons]
  FinalButtons --> FinalComposer[Open editable final review email composer]
  FinalComposer --> FinalDecision{Send final decision?}
  FinalDecision -->|Cancel| AppRow
  FinalDecision -->|Successful| SuccessApi[PATCH review with SUCCESSFUL]
  FinalDecision -->|Fail| FailApi[PATCH review with UNSUCCESSFUL]
  SuccessApi --> SuccessState[Status: successful; authorisation code may be generated; email log saved]
  FailApi --> FailState[Status: unsuccessful; outcome email log saved]

  CanFinalReview -->|Already final| ResendFinal[Resend Success / Resend Fail]
  ResendFinal --> ResendComposer[Open editable resend email composer]
  ResendComposer --> ResendApi[POST review-email]
  ResendApi --> UpdateReviewEmail[Update qualification review email status]
```

## Data And API Sequence

```mermaid
sequenceDiagram
  participant Visitor
  participant React
  participant API as Express API
  participant DB as Prisma/PostgreSQL
  participant Mail as Email provider/log
  participant Storage as Document storage
  participant Admin

  Visitor->>React: Submit new trial form
  React->>React: Validate required fields, email match, phone, age group, file type/size
  React->>API: POST /api/academy/trials
  API->>DB: Create player/trial/payment-related records
  API-->>React: trialApplication + membershipNumber + email status
  React->>API: POST /api/academy/trials/:id/birth-certificate
  API->>Storage: Store birth certificate
  API->>DB: Link document to trial application
  API-->>React: document id and URL
  React->>React: Add application to local state

  Admin->>React: Sign in
  React->>API: POST /api/auth/login
  API-->>React: JWT + admin profile
  React->>React: Persist admin session to localStorage
  React->>API: GET /api/academy/admin/club-invite-trials
  API->>DB: Read invite codes
  API-->>React: Invite code list

  Admin->>React: Mark application successful
  React->>React: Open editable email composer
  Admin->>React: Confirm send
  React->>API: PATCH /api/academy/admin/trials/:id/review
  API->>DB: Update application status
  API->>DB: Create authorisation code when successful
  API->>Mail: Send or log review email
  API-->>React: code + emailLog
  React->>React: Update row status, code, membership, email status

  Visitor->>React: Complete onboarding with code
  React->>API: POST /api/academy/codes/validate
  API->>DB: Check unused trial authorisation or renewal code
  API-->>React: Code type
  React->>API: POST /api/academy/onboarding
  API->>DB: Create onboarding record, mark code used, create payment
  API-->>React: passport number, programme, amount due, checkout data
  React->>React: Show completion and add dashboard record
```

## State Flow

```mermaid
stateDiagram-v2
  [*] --> PublicApp

  PublicApp --> ActiveTabStored: tab change
  ActiveTabStored --> PublicApp: localStorage restore

  PublicApp --> TrialApplicationCreated: New Trial submitted
  PublicApp --> ClubInviteApplicationCreated: Club Invite Trial submitted
  PublicApp --> SimpleRegistrationCreated: Simple form submitted
  PublicApp --> OnboardingCreated: Onboarding completed

  TrialApplicationCreated --> Paid: backend status maps to paid
  ClubInviteApplicationCreated --> Paid
  Paid --> InformationCheckEmailSent: admin sends info check email
  InformationCheckEmailSent --> Paid
  Paid --> Successful: admin final successful review
  Paid --> Unsuccessful: admin final failed review
  Successful --> AuthorisationCodeIssued
  AuthorisationCodeIssued --> OnboardingCreated: visitor uses code
  OnboardingCreated --> CodeUsed

  SimpleRegistrationCreated --> Submitted
  Submitted --> PaymentPending: holiday-camp or meet-greet
  PaymentPending --> PaidSimpleRegistration: simulated payment
  Submitted --> CompletedSimpleRegistration: no payment required
  PaidSimpleRegistration --> CompletedSimpleRegistration

  PublicApp --> AdminUnauthenticated: admin tab without session
  AdminUnauthenticated --> AdminAuthenticated: login success
  AdminAuthenticated --> AdminUnauthenticated: sign out
  AdminAuthenticated --> TestingDataReset: reset confirmed
  TestingDataReset --> PublicApp
```

## Current Screen Inventory

| Area | Component | Primary actions | Backend endpoints |
| --- | --- | --- | --- |
| App shell | `App`, `Layout`, `Tabs` | Restore active tab, render selected flow, show programme summary | `GET /api/academy/trials`, `GET /api/academy/club-invite-applications`, `GET /api/academy/simple-registrations` |
| Player Registration | `PlayerRegistration` | Select New Trial, Club Invite Trial, Renewal | `POST /api/academy/codes/validate` for Renewal |
| Trial Registration | `TrialRegistration` | Validate form, calculate age group, submit application, upload birth certificate | `POST /api/academy/trials`, `POST /api/academy/trials/:id/birth-certificate`, `GET /api/academy/club-invite-trials/:membershipCode` |
| Onboarding | `UrbanWarriorOnboarding` | Validate code, accept conduct, accept debit order, select payment, complete onboarding | `POST /api/academy/codes/validate`, `POST /api/academy/onboarding` |
| Simple Registrations | `PlaceholderForm` | Submit config-driven registration, simulate payment for selected types | `POST /api/academy/simple-registrations`, `PATCH /api/academy/simple-registrations/:id/simulate-payment` |
| Admin Login | `AdminLogin` | Authenticate admin | `POST /api/auth/login` |
| Admin Dashboard | `AdminPanel` | Generate invite codes, review applications, preview documents, resend emails, export CSV, reset testing data | `/api/academy/admin/*` endpoints |

## Design Notes

- The public navigation is tab-based, not route-based. `activeTab`, admin session, generated codes, and onboarding completions are persisted in `localStorage`.
- Several tabs are present but disabled in the public tab config: General Member, Urban Lounge Event, Club Event, and Match Tickets. The simple form logic exists for these types, but disabled tabs normalize back to Player Registration.
- Club Invite Trial is a two-step public path: lookup membership code first, then complete the same trial form with invite fields locked or prefilled.
- Admin email actions are intentionally mediated by an editable composer modal before API calls are made.
- Admin CSV export is client-side and uses current in-memory state, while backend also exposes admin export endpoints that are not currently wired in this frontend component.
- `generatedCodes` remains in local storage, but current successful trial and renewal validation depends on backend code validation.
