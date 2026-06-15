# UI Interaction Map From Requirements Pool

Source: `需求池.md`
Last updated: 2026-06-16

This map translates the requirements pool into a target UI interaction structure. It separates currently implemented UI from planned UI so design and development can discuss the whole product without confusing MVP scope with the final workflow.

## Legend

```mermaid
flowchart LR
  Done["Implemented / mostly implemented"]
  Partial["Partially implemented"]
  Planned["Planned from requirements pool"]
  Risk["High-priority UX or data risk"]

  classDef done fill:#e8f7ee,stroke:#1f7a45,color:#173b27
  classDef partial fill:#fff6db,stroke:#9a6b00,color:#3f2c00
  classDef planned fill:#eef3ff,stroke:#315fbd,color:#172b55
  classDef risk fill:#ffe8e8,stroke:#b42318,color:#5f1510

  class Done done
  class Partial partial
  class Planned planned
  class Risk risk
```

## 1. Overall UI Information Architecture

```mermaid
flowchart TD
  App["Cape Town Spurs Registration Platform"] --> Public["Public / parent-facing area"]
  App --> PlayerAuth["Player / guardian OTP login"]
  App --> PlayerDash["Player dashboard after login"]
  App --> AdminAuth["Admin login"]
  App --> AdminDash["Admin back office"]
  App --> OpsApps["Operations apps"]

  Public --> PublicTabs["Current public tabs"]
  PublicTabs --> PlayerReg["Player Registration"]
  PublicTabs --> PublicOnboarding["Urban Warrior Onboarding"]
  PublicTabs --> SimpleRegs["Simple registrations"]
  PublicTabs --> PublicSupport["Support footer on every user page"]

  PlayerAuth --> OtpRequest["Request OTP by email or membership number"]
  PlayerAuth --> OtpVerify["Enter OTP"]
  PlayerAuth --> OtpHelp["Resend, spam/junk hint, contact admin"]
  OtpVerify --> PlayerDash

  PlayerDash --> AcademyTab["Academy Programmes"]
  PlayerDash --> FirstTouchTab["First Touch"]
  PlayerDash --> LittleWarriorsTab["Little Warriors"]
  PlayerDash --> HolidayCampTab["Holiday Camps"]
  PlayerDash --> RenewalTab["Renewal"]
  PlayerDash --> ProfileTab["Player Passport / profile"]
  PlayerDash --> PaymentsTab["Payments and renewal status"]

  AdminDash --> TrialAdmin["Trial applications"]
  AdminDash --> ClubInviteAdmin["Club invite applications"]
  AdminDash --> InviteCodeAdmin["Club invite trial codes"]
  AdminDash --> PlayerAdmin["Players / passports"]
  AdminDash --> EmailAdmin["Email composer and logs"]
  AdminDash --> PaymentAdmin["Payment history and refunds"]
  AdminDash --> RenewalAdmin["Renewal selection workflow"]
  AdminDash --> AdminExport["CSV export"]
  AdminDash --> TestingReset["Testing data reset"]

  OpsApps --> CheckIn["Trial check-in"]
  OpsApps --> Assessment["Trial assessment app"]

  classDef done fill:#e8f7ee,stroke:#1f7a45,color:#173b27
  classDef partial fill:#fff6db,stroke:#9a6b00,color:#3f2c00
  classDef planned fill:#eef3ff,stroke:#315fbd,color:#172b55
  classDef risk fill:#ffe8e8,stroke:#b42318,color:#5f1510

  class Public,PublicTabs,PlayerReg,PublicOnboarding,SimpleRegs,AdminAuth,AdminDash,TrialAdmin,ClubInviteAdmin,InviteCodeAdmin,EmailAdmin,AdminExport,TestingReset done
  class PlayerDash,PlayerAdmin,PaymentsTab,PaymentAdmin,RenewalAdmin,OpsApps,CheckIn,Assessment,PublicSupport planned
  class PlayerAuth,OtpRequest,OtpVerify,OtpHelp,AcademyTab,FirstTouchTab,LittleWarriorsTab,HolidayCampTab,RenewalTab,ProfileTab risk
```

## 2. Parent / Player Main Journey

```mermaid
flowchart TD
  Entry["Parent opens site"] --> Choice{"Known player passport?"}

  Choice -->|"No / first contact"| PublicStart["Public registration start"]
  Choice -->|"Yes"| Login["OTP login"]

  Login --> OtpSent["OTP sent by email"]
  OtpSent --> OtpScreen["OTP screen"]
  OtpScreen --> OtpValid{"OTP valid?"}
  OtpValid -->|"No"| OtpHelp["Resend OTP, check spam, contact admin"]
  OtpValid -->|"Yes"| Dashboard["Player dashboard"]

  PublicStart --> PathChoice{"Choose journey"}
  PathChoice --> NewTrial["New Trial"]
  PathChoice --> ClubInvite["Club Invite Trial"]
  PathChoice --> DirectProgramme["First Touch / Little Warriors direct registration"]
  PathChoice --> SimpleEvent["Holiday camp / meet and greet"]

  NewTrial --> DuplicateCheck["Duplicate passport check by ID/email"]
  DirectProgramme --> DuplicateCheck
  SimpleEvent --> DuplicateCheck
  ClubInvite --> InviteLookup["Lookup membership / invite code"]
  InviteLookup --> DuplicateCheck

  DuplicateCheck --> DuplicateFound{"Existing passport found?"}
  DuplicateFound -->|"Yes"| LoginPrompt["Prompt login / recover access"]
  DuplicateFound -->|"No"| ProfileCreate["Create or update Player Passport"]

  LoginPrompt --> Login
  ProfileCreate --> Dashboard

  Dashboard --> ProgrammeEligibility{"Programme eligibility"}
  ProgrammeEligibility -->|"Trial required"| TrialFlow["Trial registration"]
  ProgrammeEligibility -->|"No trial required"| DirectFlow["Direct programme registration"]
  ProgrammeEligibility -->|"Existing player"| RenewalFlow["Renewal portal"]
  ProgrammeEligibility -->|"One active programme conflict"| ActiveProgrammeBlock["Block and explain current active programme"]

  TrialFlow --> Checkout["Basket / checkout"]
  DirectFlow --> Checkout
  RenewalFlow --> RenewalCheckout["Renewal amount confirmation"]
  RenewalCheckout --> Checkout
  Checkout --> PayFast["PayFast payment"]
  PayFast --> Result{"Payment result"}
  Result -->|"Success"| Confirmation["Confirmation screen and email"]
  Result -->|"Fail / cancel"| RetryPayment["Retry payment or ask for help"]

  Confirmation --> Dashboard
  RetryPayment --> Checkout

  classDef done fill:#e8f7ee,stroke:#1f7a45,color:#173b27
  classDef partial fill:#fff6db,stroke:#9a6b00,color:#3f2c00
  classDef planned fill:#eef3ff,stroke:#315fbd,color:#172b55
  classDef risk fill:#ffe8e8,stroke:#b42318,color:#5f1510

  class PublicStart,PathChoice,NewTrial,ClubInvite,InviteLookup,SimpleEvent,Confirmation partial
  class Login,OtpSent,OtpScreen,OtpHelp,Dashboard,DirectProgramme,DuplicateCheck,ProfileCreate,ProgrammeEligibility,DirectFlow,RenewalFlow,RenewalCheckout,Checkout,PayFast,RetryPayment planned
  class DuplicateFound,LoginPrompt,ActiveProgrammeBlock risk
```

## 3. New Trial UI Flow

```mermaid
flowchart TD
  TrialEntry["New Trial entry"] --> TrialWindow["Select or auto-match trial window by DOB / age group"]
  TrialWindow --> Capacity["Show capacity and remaining spots"]
  Capacity --> HasSpots{"Remaining spots available?"}

  HasSpots -->|"No"| FullState["Registration full state with support contact"]
  HasSpots -->|"Yes"| TrialForm["Trial application form"]

  TrialForm --> DobField["Date of Birth field"]
  DobField --> AgeGroupCalc["Age group calculated and highlighted"]
  DobField --> DobRange["Outside Trial Age Groups disabled"]

  TrialForm --> BirthCert["Birth certificate upload"]
  BirthCert --> UploadRules["PDF / JPG / PNG, max size per business rule"]

  TrialForm --> SaveSubmit{"Submit application"}
  SaveSubmit --> ClientValidation["Client validation"]
  ClientValidation -->|"Invalid"| InlineErrors["Inline errors and guidance"]
  ClientValidation -->|"Valid"| TrialCheckout["Trial fee basket / checkout"]

  TrialCheckout --> PayFast["PayFast payment"]
  PayFast --> PaymentResult{"Payment confirmed?"}
  PaymentResult -->|"No"| PaymentRetry["Retry / cancel / support"]
  PaymentResult -->|"Yes"| BibAssign["Assign bib number and colour"]
  BibAssign --> TrialEmail["Trial confirmation email with dates, arrival time, venue, bib"]
  TrialEmail --> WaitingAdmin["Waiting admin information check / qualification review"]

  WaitingAdmin --> AdminInfoCheck["Admin information check"]
  AdminInfoCheck --> InfoOk{"Info check OK?"}
  InfoOk -->|"No"| InfoFailEmail["Information failed email"]
  InfoOk -->|"Yes"| AttendTrial["Attend trial"]

  AttendTrial --> CheckIn["Trial check-in"]
  CheckIn --> Attendance{"Attended?"}
  Attendance -->|"No"| NoShow["Mark absent / no-show, fee forfeited policy"]
  Attendance -->|"Yes"| Assessment["Assessment scoring by bib"]
  Assessment --> AdminFinalReview["Admin final successful / unsuccessful review"]

  AdminFinalReview --> FinalResult{"Successful?"}
  FinalResult -->|"No"| NotApprovedEmail["Outcome email"]
  FinalResult -->|"Yes"| OnboardingCode["Authorisation code email with clear next steps"]
  OnboardingCode --> Onboarding["Urban Warrior onboarding"]

  classDef done fill:#e8f7ee,stroke:#1f7a45,color:#173b27
  classDef partial fill:#fff6db,stroke:#9a6b00,color:#3f2c00
  classDef planned fill:#eef3ff,stroke:#315fbd,color:#172b55
  classDef risk fill:#ffe8e8,stroke:#b42318,color:#5f1510

  class TrialEntry,TrialForm,DobField,AgeGroupCalc,DobRange,BirthCert,ClientValidation,InlineErrors,WaitingAdmin,AdminInfoCheck,InfoFailEmail,AdminFinalReview,NotApprovedEmail,Onboarding partial
  class TrialWindow,Capacity,TrialCheckout,PayFast,BibAssign,TrialEmail,CheckIn,Assessment planned
  class HasSpots,FullState,UploadRules,PaymentResult,PaymentRetry,Attendance,NoShow,OnboardingCode risk
```

## 4. Club Invite Trial UI Flow

```mermaid
flowchart TD
  AdminInvite["Admin creates club invite"] --> MinimalProfile["Create or link minimal Player Passport"]
  MinimalProfile --> InviteCodes["Generate membership code and club invite trial code"]
  InviteCodes --> InviteEmail["Send invite email with trial details and registration link"]

  ParentInvite["Parent opens Club Invite Trial"] --> Lookup["Enter membership code"]
  Lookup --> LookupResult{"Invite found?"}
  LookupResult -->|"No"| LookupError["Show lookup error and support contact"]
  LookupResult -->|"Yes"| LockedFields["Prefill and lock invite code / player details"]

  LockedFields --> ClubForm["Complete remaining trial form"]
  ClubForm --> BirthCert["Upload latest birth certificate"]
  ClubForm --> Upsert{"Same membership code exists?"}
  Upsert -->|"Yes"| UpdateExisting["Update birthday, age group, latest birth cert only"]
  Upsert -->|"No"| CreateApplication["Create club invite application"]

  UpdateExisting --> AdminTable["Admin table shows one latest row"]
  CreateApplication --> AdminTable
  AdminTable --> AdminReview["Admin information check and final review"]
  AdminReview --> Outcome{"Successful?"}
  Outcome -->|"No"| OutcomeEmail["Unsuccessful email"]
  Outcome -->|"Yes"| AuthCode["Issue onboarding authorisation code"]
  AuthCode --> Onboarding["Urban Warrior onboarding"]

  classDef done fill:#e8f7ee,stroke:#1f7a45,color:#173b27
  classDef partial fill:#fff6db,stroke:#9a6b00,color:#3f2c00
  classDef planned fill:#eef3ff,stroke:#315fbd,color:#172b55
  classDef risk fill:#ffe8e8,stroke:#b42318,color:#5f1510

  class AdminInvite,InviteCodes,ParentInvite,Lookup,LookupResult,LockedFields,ClubForm,BirthCert,Upsert,UpdateExisting,CreateApplication,AdminTable,AdminReview,Outcome,OutcomeEmail,AuthCode,Onboarding done
  class MinimalProfile,InviteEmail planned
  class LookupError risk
```

## 5. Direct Programme Registration UI Flow

```mermaid
flowchart TD
  ProgrammeTab["First Touch / Little Warriors tab"] --> DobCapture["Capture or read DOB"]
  DobCapture --> AgeValidation{"Age eligible?"}

  AgeValidation -->|"No"| AgeMismatch["Explain child age, allowed range, recommended programme, contact club"]
  AgeValidation -->|"Yes"| ActiveProgrammeCheck{"Already has active programme?"}

  ActiveProgrammeCheck -->|"Yes"| ProgrammeBlocked["Block duplicate programme; show current active programme and admin override path"]
  ActiveProgrammeCheck -->|"No"| DirectForm["Programme registration form"]

  DirectForm --> ProfileFields["Player Passport fields"]
  DirectForm --> KitFields["Kit size and sock size"]
  KitFields --> SizeGuide["Size guide link / modal"]
  DirectForm --> Terms["Terms, code of conduct, notification opt-ins"]
  DirectForm --> Checkout["Basket / checkout"]
  Checkout --> PayFast["PayFast payment"]
  PayFast --> Confirmation["Programme confirmation email and dashboard update"]

  classDef planned fill:#eef3ff,stroke:#315fbd,color:#172b55
  classDef risk fill:#ffe8e8,stroke:#b42318,color:#5f1510

  class ProgrammeTab,DobCapture,DirectForm,ProfileFields,KitFields,SizeGuide,Terms,Checkout,PayFast,Confirmation planned
  class AgeValidation,AgeMismatch,ActiveProgrammeCheck,ProgrammeBlocked risk
```

## 6. Onboarding And Renewal UI Flow

```mermaid
flowchart TD
  Start["Onboarding / Renewal entry"] --> EntryType{"Entry source"}
  EntryType -->|"Trial successful"| CodeEntry["Enter authorisation code"]
  EntryType -->|"Renewal invite"| RenewalCode["Enter renewal code or open renewal link"]
  EntryType -->|"Existing session"| Prefill["Prefill from Player Passport"]

  CodeEntry --> ValidateCode["Validate code"]
  RenewalCode --> ValidateCode
  ValidateCode --> ValidCode{"Valid and unused?"}
  ValidCode -->|"No"| CodeHelp["Show error, resend/help/support"]
  ValidCode -->|"Yes"| ProfileReview["Review and update player profile"]

  Prefill --> ProfileReview
  ProfileReview --> RequiredFields["Required onboarding fields"]
  RequiredFields --> KitSock["Kit size / sock size with guide"]
  RequiredFields --> Conduct["Terms and code of conduct"]
  RequiredFields --> Documents["Required documents"]
  RequiredFields --> Medical["Medical, emergency contact, guardian details"]

  Medical --> PaymentChoice{"Payment option"}
  PaymentChoice -->|"Monthly debit order"| MandateCheck{"Existing active mandate?"}
  MandateCheck -->|"Yes"| OneClickMandate["One-click confirm updated amount"]
  MandateCheck -->|"No"| ElectronicMandate["Electronic debit order mandate"]
  ElectronicMandate --> FallbackUpload["Print/sign/upload fallback"]

  PaymentChoice -->|"Annual upfront"| AnnualDiscount["Apply 8% tuition discount, registration fee not discounted"]

  OneClickMandate --> Checkout["Checkout / payment confirmation"]
  ElectronicMandate --> Checkout
  FallbackUpload --> Checkout
  AnnualDiscount --> Checkout
  Checkout --> Complete["Passport number / onboarding complete"]

  Complete --> ReminderStop["Stop incomplete reminders"]
  ValidCode --> ReminderTimer["14-day offer expiry and 7-day reminder"]
  ReminderTimer --> AdminAssist["Admin please assist request"]

  classDef partial fill:#fff6db,stroke:#9a6b00,color:#3f2c00
  classDef planned fill:#eef3ff,stroke:#315fbd,color:#172b55
  classDef risk fill:#ffe8e8,stroke:#b42318,color:#5f1510

  class CodeEntry,ValidateCode,ValidCode,PaymentChoice,Checkout,Complete partial
  class RenewalCode,Prefill,RequiredFields,KitSock,Conduct,Documents,Medical,MandateCheck,OneClickMandate,ElectronicMandate,FallbackUpload,AnnualDiscount,ReminderTimer,AdminAssist,ReminderStop planned
  class CodeHelp risk
```

## 7. Admin Back Office UI Flow

```mermaid
flowchart TD
  AdminLogin["Admin login"] --> AdminHome["Admin dashboard"]

  AdminHome --> SummaryCards["Summary cards"]
  AdminHome --> TrialTables["Trial and club invite tables"]
  AdminHome --> InviteManager["Club invite code manager"]
  AdminHome --> PlayerManager["Player Passport manager"]
  AdminHome --> TrialWindowManager["Trial window and capacity manager"]
  AdminHome --> RenewalManager["Renewal selection manager"]
  AdminHome --> PaymentManager["Payments, refunds, renewal status"]
  AdminHome --> EmailMatrix["Email matrix and logs"]
  AdminHome --> ExportReset["Export CSV / reset testing data"]

  TrialTables --> BirthCertPreview["View birth certificate"]
  TrialTables --> InfoCheck["Information check email"]
  TrialTables --> FinalReview["Qualification review"]
  InfoCheck --> RichComposer["Rich text email composer"]
  FinalReview --> RichComposer
  RichComposer --> EmailLog["Email status and log"]

  InviteManager --> GenerateInvite["Generate membership + invite code"]
  GenerateInvite --> SendInvite["Send invite email"]

  TrialWindowManager --> WindowConfig["Configure age group, date, capacity, arrival time"]
  WindowConfig --> RemainingSpots["Feeds remaining spots on trial form"]

  RenewalManager --> InviteRenewal["Invite to renew"]
  RenewalManager --> NotRenewing["Mark not renewing"]
  InviteRenewal --> RenewalEmail["Renewal email / code"]
  NotRenewing --> NotRenewingEmail["Not renewing email"]

  PaymentManager --> RefundPolicy["Refund and 20% admin fee policy"]
  PaymentManager --> PayFastRefund["PayFast refund action"]

  classDef done fill:#e8f7ee,stroke:#1f7a45,color:#173b27
  classDef partial fill:#fff6db,stroke:#9a6b00,color:#3f2c00
  classDef planned fill:#eef3ff,stroke:#315fbd,color:#172b55
  classDef risk fill:#ffe8e8,stroke:#b42318,color:#5f1510

  class AdminLogin,AdminHome,SummaryCards,TrialTables,InviteManager,ExportReset,BirthCertPreview,InfoCheck,FinalReview,RichComposer,EmailLog,GenerateInvite done
  class PlayerManager,EmailMatrix partial
  class TrialWindowManager,RenewalManager,PaymentManager,SendInvite,WindowConfig,RemainingSpots,InviteRenewal,NotRenewing,RenewalEmail,NotRenewingEmail,PayFastRefund planned
  class RefundPolicy risk
```

## 8. Operations UI Flow

```mermaid
flowchart TD
  OpsEntry["Operations entry"] --> Role{"User role"}
  Role -->|"Admin / staff"| CheckIn["Trial check-in"]
  Role -->|"Assessor"| Assessment["Assessment app"]

  CheckIn --> SearchPlayer["Search by bib, membership, player name"]
  SearchPlayer --> CheckInResult{"Found?"}
  CheckInResult -->|"No"| ManualHelp["Manual lookup / admin assist"]
  CheckInResult -->|"Yes"| AttendanceAction["Mark attended or absent"]
  AttendanceAction --> NoShowPolicy["If absent: show fee forfeited policy"]
  AttendanceAction --> CheckInAudit["Write audit log"]

  Assessment --> SelectEvent["Select trial event"]
  SelectEvent --> BibList["Bib list"]
  BibList --> ScorePlayer["Score player by drill"]
  ScorePlayer --> DuplicateGuard["Prevent duplicate assessor score"]
  DuplicateGuard --> ScoreSummary["Total score and drill-down"]
  ScoreSummary --> FinalReviewQueue["Feeds admin final review queue"]

  classDef planned fill:#eef3ff,stroke:#315fbd,color:#172b55
  classDef risk fill:#ffe8e8,stroke:#b42318,color:#5f1510

  class OpsEntry,Role,CheckIn,Assessment,SearchPlayer,AttendanceAction,CheckInAudit,SelectEvent,BibList,ScorePlayer,DuplicateGuard,ScoreSummary,FinalReviewQueue planned
  class CheckInResult,ManualHelp,NoShowPolicy risk
```

## 9. Screen-To-Requirement Coverage

| UI area | Current state | Key requirements |
| --- | --- | --- |
| Public player registration | Partially implemented | R-004, R-005, R-006, R-008, R-010, R-013, R-014, R-021, R-022 |
| Player OTP login | Planned | W-NEW-001, R-018 |
| Player dashboard | Planned | W-NEW-002, W-NEW-013, R-019, R-024 |
| New Trial form | Partially implemented | R-002, R-004, R-006, R-008, R-014, W-NEW-004, W-NEW-005, W-NEW-006, W-NEW-007 |
| Club Invite Trial | Mostly implemented | R-005, R-007, D-008 to D-017, W-OPT-007 |
| First Touch / Little Warriors | Planned | R-013, W-NEW-013, W-OPT-008 |
| Onboarding | Partially implemented | R-015, R-016, R-017, W-NEW-014, W-NEW-015, W-OPT-009 |
| Renewal | Planned / partially scaffolded | R-020, W-NEW-011, W-NEW-012 |
| Admin dashboard | Mostly implemented for MVP | R-007, R-009, D-023 to D-027, W-NEW-017, W-NEW-018 |
| Trial check-in / no-show | Planned | R-023, W-NEW-008 |
| Trial assessment | Planned | W-NEW-009 |
| Payments / refunds | Planned beyond simulation | W-NEW-006, W-NEW-010 |
| Support and mobile QA | Planned | R-019, R-021 |

## Product Design Notes

- The target UI should move from public tabs toward a player passport dashboard once OTP login exists. Public tabs can remain as acquisition entry points, but authenticated users should land in a task-focused dashboard.
- Trial registration needs a stronger pre-payment decision surface: age group, trial window, remaining spots, fee policy, arrival time, and support contact should be visible before checkout.
- Onboarding and renewal should share a profile-review pattern: prefill known data, ask only what changed or is missing, then move to mandate/payment.
- Admin email actions should continue to use a confirmation composer, because the business frequently needs to tailor communication before sending.
- Support should be a persistent but quiet element on user-side flows, especially OTP, payment, onboarding, and age mismatch screens.
