import { type FormEvent, useMemo, useState } from "react";
import ProductSummary from "./components/ProductSummary";
import RegistrationForm from "./components/RegistrationForm";
import FormField from "./components/FormField";
import { genderOptions, notificationOptions } from "./data/options";
import type { PlayerAccount, Programme } from "./types";

type Step = "register" | "login" | "dashboard" | "application" | "checkout" | "trials";

type AccountDraft = Omit<PlayerAccount, "passportNumber"> & {
  confirmPassword: string;
};

const programmes: Programme[] = [
  {
    id: "academy",
    title: "Academy Programme",
    category: "Programme",
    price: "R 2,600.00",
    description: "Season programme with registration fee, monthly tuition, kit, and coaching.",
    requiresTrial: true,
    placesAvailable: 84,
    capacity: 100,
  },
  {
    id: "foundation",
    title: "Foundation Programme",
    category: "Programme",
    price: "R 2,600.00",
    description: "Foundation pathway registration without trial approval requirement.",
    requiresTrial: false,
    placesAvailable: 41,
    capacity: 60,
  },
  {
    id: "holiday-camp",
    title: "Holiday Camp",
    category: "Once-off Event",
    price: "R 950.00",
    description: "Short once-off camp booking with direct checkout.",
    requiresTrial: false,
    placesAvailable: 25,
    capacity: 50,
  },
  {
    id: "trial",
    title: "Academy Trials",
    category: "Trial",
    price: "R 500.00",
    description: "Trial application, assessor scoring, and academy programme invitation flow.",
    requiresTrial: false,
    placesAvailable: 16,
    capacity: 100,
  },
];

const initialAccount: AccountDraft = {
  playerName: "",
  playerSurname: "",
  idNumber: "",
  dateOfBirth: "",
  age: null,
  gender: "",
  guardianName: "",
  guardianEmail: "",
  guardianCell: "",
  medicalAidDetails: "",
  emergencyContact: "",
  allergiesOrConditions: "",
  notifications: [],
  password: "",
  confirmPassword: "",
};

function App() {
  const [step, setStep] = useState<Step>("register");
  const [account, setAccount] = useState<PlayerAccount | null>(null);
  const [selectedProgramme, setSelectedProgramme] = useState<Programme>(programmes[0]);
  const [basketReady, setBasketReady] = useState(false);

  const summaryDetails = useMemo(
    () => getSummaryDetails(selectedProgramme),
    [selectedProgramme],
  );

  const goToProgramme = (programme: Programme) => {
    setSelectedProgramme(programme);
    setBasketReady(false);
    setStep(programme.id === "trial" ? "trials" : "application");
  };

  const completeAccount = (createdAccount: PlayerAccount) => {
    setAccount(createdAccount);
    setStep("login");
  };

  const completeLogin = () => {
    setStep("dashboard");
  };

  return (
    <div className="site-shell">
      <header className="club-header">
        <div className="header-inner">
          <div className="club-mark" aria-hidden="true">
            CTS
          </div>
          <div>
            <p className="header-kicker">Cape Town Spurs Academy</p>
            <h1>Academy Registration Portal</h1>
          </div>
        </div>
      </header>

      <main className="flow-layout">
        <section className="flow-main">
          <FlowNav currentStep={step} setStep={setStep} account={account} />

          {step === "register" && <AccountRegistration onComplete={completeAccount} />}

          {step === "login" && (
            <LoginPanel account={account} onLogin={completeLogin} onBack={() => setStep("register")} />
          )}

          {step === "dashboard" && (
            <Dashboard
              account={account}
              programmes={programmes}
              onSelect={goToProgramme}
              onOpenTrials={() => setStep("trials")}
            />
          )}

          {step === "application" && (
            <ApplicationStep
              account={account}
              programme={selectedProgramme}
              onBack={() => setStep("dashboard")}
              onComplete={() => {
                setBasketReady(true);
                setStep("checkout");
              }}
            />
          )}

          {step === "checkout" && (
            <CheckoutStep
              programme={selectedProgramme}
              basketReady={basketReady}
              onBack={() => setStep("application")}
            />
          )}

          {step === "trials" && (
            <TrialsStep
              account={account}
              programme={programmes.find((programme) => programme.id === "trial") ?? programmes[3]}
              onBack={() => setStep("dashboard")}
              onCheckout={() => {
                setSelectedProgramme(programmes[3]);
                setBasketReady(true);
                setStep("checkout");
              }}
            />
          )}
        </section>

        <aside className="summary-column" aria-label="Product summary">
          <ProductSummary
            label={selectedProgramme.category}
            title={selectedProgramme.title}
            price={selectedProgramme.price}
            details={summaryDetails}
          />
        </aside>
      </main>
    </div>
  );
}

function FlowNav({
  currentStep,
  setStep,
  account,
}: {
  currentStep: Step;
  setStep: (step: Step) => void;
  account: PlayerAccount | null;
}) {
  const items: Array<{ step: Step; label: string; disabled?: boolean }> = [
    { step: "register", label: "Register Player" },
    { step: "login", label: "Login", disabled: !account },
    { step: "dashboard", label: "Dashboard", disabled: !account },
    { step: "application", label: "Application", disabled: !account },
    { step: "checkout", label: "Checkout", disabled: !account },
  ];

  return (
    <nav className="flow-nav" aria-label="Registration process">
      {items.map((item) => (
        <button
          className={currentStep === item.step ? "active" : ""}
          disabled={item.disabled}
          key={item.step}
          type="button"
          onClick={() => setStep(item.step)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function AccountRegistration({
  onComplete,
}: {
  onComplete: (account: PlayerAccount) => void;
}) {
  const [values, setValues] = useState<AccountDraft>(initialAccount);
  const [errors, setErrors] = useState<Partial<Record<keyof AccountDraft, string>>>({});

  const age = calculateAge(values.dateOfBirth);

  const updateValue = <K extends keyof AccountDraft>(name: K, value: AccountDraft[K]) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateAccount(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const createdAccount: PlayerAccount = {
      ...values,
      age,
      passportNumber: createPassportNumber(values.playerName, values.playerSurname),
    };

    console.log("Created player account", {
      ...createdAccount,
      password: "[hidden in frontend demo]",
    });
    onComplete(createdAccount);
  };

  return (
    <section className="form-card">
      <div className="intro-panel">
        <p>
          Register the player once, then use their Cape Town Spurs Player Passport
          Number for trials, programmes, camps, and future events.
        </p>
      </div>

      <form className="registration-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="form-section">
          <legend>Player Account</legend>
          <div className="section-grid">
            <SimpleInput
              label="Name"
              name="playerName"
              value={values.playerName}
              error={errors.playerName}
              onChange={(value) => updateValue("playerName", value)}
              required
            />
            <SimpleInput
              label="Surname"
              name="playerSurname"
              value={values.playerSurname}
              error={errors.playerSurname}
              onChange={(value) => updateValue("playerSurname", value)}
              required
            />
            <SimpleInput
              label="ID Number"
              name="idNumber"
              value={values.idNumber}
              error={errors.idNumber}
              maxLength={20}
              onChange={(value) => updateValue("idNumber", value)}
              required
            />
            <SimpleInput
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={values.dateOfBirth}
              error={errors.dateOfBirth}
              onChange={(value) => updateValue("dateOfBirth", value)}
              required
            />
            <div className="calculated-panel">
              <span>Calculated Age</span>
              <strong>{age === null ? "Select DOB" : `${age} years`}</strong>
            </div>
            <FormField label="Gender" required error={errors.gender}>
              <div className="radio-row" role="radiogroup" aria-label="Gender">
                {genderOptions.map((option) => (
                  <label className="radio-option" key={option.value}>
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={values.gender === option.value}
                      onChange={() => updateValue("gender", option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </FormField>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Guardian, Medical and Emergency Details</legend>
          <div className="section-grid">
            <SimpleInput
              label="Primary Contact Name"
              name="guardianName"
              value={values.guardianName}
              error={errors.guardianName}
              onChange={(value) => updateValue("guardianName", value)}
              required
            />
            <SimpleInput
              label="Primary Contact Email Address"
              name="guardianEmail"
              type="email"
              value={values.guardianEmail}
              error={errors.guardianEmail}
              onChange={(value) => updateValue("guardianEmail", value)}
              required
            />
            <SimpleInput
              label="Primary Contact Cell Number"
              name="guardianCell"
              value={values.guardianCell}
              error={errors.guardianCell}
              maxLength={10}
              onChange={(value) => updateValue("guardianCell", value)}
              required
            />
            <SimpleInput
              label="Medical Aid Details"
              name="medicalAidDetails"
              value={values.medicalAidDetails}
              error={errors.medicalAidDetails}
              onChange={(value) => updateValue("medicalAidDetails", value)}
            />
            <SimpleInput
              label="Emergency Contact Details"
              name="emergencyContact"
              value={values.emergencyContact}
              error={errors.emergencyContact}
              onChange={(value) => updateValue("emergencyContact", value)}
              required
            />
            <FormField
              label="Allergies or Conditions"
              htmlFor="accountAllergies"
              error={errors.allergiesOrConditions}
              className="full-width"
              required
            >
              <textarea
                id="accountAllergies"
                value={values.allergiesOrConditions}
                onChange={(event) =>
                  updateValue("allergiesOrConditions", event.target.value)
                }
                rows={3}
              />
            </FormField>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Notifications and Login</legend>
          <div className="section-grid">
            <FormField label="Opt in for Notifications" className="full-width">
              <div className="check-grid">
                {notificationOptions.map((option) => (
                  <label className="check-option" key={option.value}>
                    <input
                      type="checkbox"
                      checked={values.notifications.includes(option.value)}
                      onChange={() =>
                        updateValue(
                          "notifications",
                          toggleListValue(values.notifications, option.value),
                        )
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </FormField>
            <SimpleInput
              label="Create Password"
              name="password"
              type="password"
              value={values.password}
              error={errors.password}
              onChange={(value) => updateValue("password", value)}
              required
            />
            <SimpleInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={values.confirmPassword}
              error={errors.confirmPassword}
              onChange={(value) => updateValue("confirmPassword", value)}
              required
            />
          </div>
        </fieldset>

        <button className="submit-button" type="submit">
          Create Player Passport
        </button>
      </form>
    </section>
  );
}

function LoginPanel({
  account,
  onLogin,
  onBack,
}: {
  account: PlayerAccount | null;
  onLogin: () => void;
  onBack: () => void;
}) {
  const [passportNumber, setPassportNumber] = useState(account?.passportNumber ?? "");
  const [email, setEmail] = useState(account?.guardianEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!account) {
      setError("Create a player account first.");
      return;
    }

    if (
      passportNumber !== account.passportNumber ||
      email !== account.guardianEmail ||
      password !== account.password
    ) {
      setError("Use the generated passport number, guardian email, and password.");
      return;
    }

    console.log("Academy login successful", {
      passportNumber,
      email,
    });
    onLogin();
  };

  return (
    <section className="form-card compact-card">
      <div className="intro-panel">
        <p>Login to the Academy with the generated Player Passport Number.</p>
        {account && (
          <p>
            Demo Passport Number: <strong>{account.passportNumber}</strong>
          </p>
        )}
      </div>
      <form className="registration-form" onSubmit={handleLogin} noValidate>
        {error && <p className="field-error panel-error">{error}</p>}
        <div className="section-grid">
          <SimpleInput
            label="Cape Town Spurs Player Passport Number"
            name="passportNumber"
            value={passportNumber}
            onChange={setPassportNumber}
            required
          />
          <SimpleInput
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={setEmail}
            required
          />
          <SimpleInput
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={setPassword}
            required
          />
        </div>
        <div className="action-row">
          <button className="secondary-button" type="button" onClick={onBack}>
            Back
          </button>
          <button className="submit-button inline-submit" type="submit">
            Login to Academy
          </button>
        </div>
      </form>
    </section>
  );
}

function Dashboard({
  account,
  programmes,
  onSelect,
  onOpenTrials,
}: {
  account: PlayerAccount | null;
  programmes: Programme[];
  onSelect: (programme: Programme) => void;
  onOpenTrials: () => void;
}) {
  return (
    <section className="form-card">
      <div className="dashboard-hero">
        <div>
          <p className="header-kicker">Player Dashboard</p>
          <h2>{account ? `${account.playerName} ${account.playerSurname}` : "Player"}</h2>
          <p>
            Passport Number: <strong>{account?.passportNumber ?? "Pending"}</strong>
          </p>
        </div>
        <button className="secondary-button light" type="button" onClick={onOpenTrials}>
          Trial Assessment Preview
        </button>
      </div>

      <div className="status-strip">
        <StatusCard label="Academy Trial" value="Required before academy programme" />
        <StatusCard label="Foundation" value="Direct registration" />
        <StatusCard label="Payment" value="Payfast and debit order placeholders" />
      </div>

      <div className="programme-grid">
        {programmes.map((programme) => (
          <article className="programme-card" key={programme.id}>
            <p className="product-label">{programme.category}</p>
            <h3>{programme.title}</h3>
            <p>{programme.description}</p>
            <div className="capacity-meter" aria-label="Available places">
              <span
                style={{
                  width: `${Math.round(
                    ((programme.capacity - programme.placesAvailable) / programme.capacity) *
                      100,
                  )}%`,
                }}
              />
            </div>
            <p className="capacity-copy">
              {programme.placesAvailable} of {programme.capacity} places available
            </p>
            {programme.requiresTrial && (
              <p className="requirement-badge">Trial required before checkout</p>
            )}
            <button type="button" onClick={() => onSelect(programme)}>
              Select
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ApplicationStep({
  account,
  programme,
  onBack,
  onComplete,
}: {
  account: PlayerAccount | null;
  programme: Programme;
  onBack: () => void;
  onComplete: () => void;
}) {
  return (
    <section className="form-card">
      <div className="intro-panel">
        <p>
          Complete the application details for <strong>{programme.title}</strong>.
          {programme.requiresTrial
            ? " Academy programmes show the trial requirement before checkout."
            : " This programme can proceed directly to checkout."}
        </p>
        {account && (
          <p>
            Applying with Passport Number: <strong>{account.passportNumber}</strong>
          </p>
        )}
      </div>
      <RegistrationForm onComplete={onComplete} submitLabel="Continue to Checkout" />
      <div className="inline-back">
        <button className="secondary-button" type="button" onClick={onBack}>
          Back to Dashboard
        </button>
      </div>
    </section>
  );
}

function CheckoutStep({
  programme,
  basketReady,
  onBack,
}: {
  programme: Programme;
  basketReady: boolean;
  onBack: () => void;
}) {
  const [paymentMode, setPaymentMode] = useState("monthly");
  const [debitOrderFile, setDebitOrderFile] = useState<File | null>(null);

  return (
    <section className="form-card">
      <div className="intro-panel">
        <p>
          Checkout is a frontend placeholder. Payfast, debit order uploads, and
          refunds would be connected to backend services.
        </p>
      </div>
      <div className="checkout-panel">
        {!basketReady && (
          <p className="field-error panel-error">
            Complete an application or trial selection before checkout.
          </p>
        )}
        <h2>{programme.title}</h2>
        <p className="product-price">{programme.price}</p>

        <div className="payment-options">
          <label className="check-option">
            <input
              type="radio"
              name="paymentMode"
              checked={paymentMode === "monthly"}
              onChange={() => setPaymentMode("monthly")}
            />
            Registration fee plus first month via Payfast, balance by debit order
          </label>
          <label className="check-option">
            <input
              type="radio"
              name="paymentMode"
              checked={paymentMode === "upfront"}
              onChange={() => setPaymentMode("upfront")}
            />
            Pay all annual fees upfront via Payfast and apply 8% tuition discount
          </label>
        </div>

        {paymentMode === "monthly" && (
          <FormField label="Signed Debit Order Form" htmlFor="debitOrderFile" required>
            <input
              id="debitOrderFile"
              type="file"
              accept=".pdf,.jpg,.jpeg,image/jpeg,application/pdf"
              onChange={(event) => setDebitOrderFile(event.target.files?.[0] ?? null)}
            />
            <span className="field-hint">
              Demo upload only. Selected: {debitOrderFile?.name ?? "none"}
            </span>
          </FormField>
        )}

        <div className="checkout-actions">
          <button className="secondary-button" type="button" onClick={onBack}>
            Back
          </button>
          <button
            className="submit-button inline-submit"
            type="button"
            disabled={!basketReady}
            onClick={() =>
              console.log("Checkout payload", {
                programme,
                paymentMode,
                debitOrderFile: debitOrderFile?.name ?? null,
              })
            }
          >
            Proceed to Payfast
          </button>
        </div>
      </div>
    </section>
  );
}

function TrialsStep({
  account,
  programme,
  onBack,
  onCheckout,
}: {
  account: PlayerAccount | null;
  programme: Programme;
  onBack: () => void;
  onCheckout: () => void;
}) {
  const assessors = ["Technique", "Insight", "Personality", "Communication", "Leadership"];
  const trialClosed = programme.placesAvailable <= 0;

  return (
    <section className="form-card">
      <div className="intro-panel">
        <p>
          Academy trials are once-off events. Applicants can be assigned a numbered,
          colour-coded bib and scored by assessors.
        </p>
      </div>
      <div className="trials-panel">
        <div className="bib-card">
          <span>Bib Allocation</span>
          <strong>Red No 5</strong>
          <p>{account?.passportNumber ?? "CTS Pending"}</p>
        </div>

        <div>
          <p className={trialClosed ? "closed-message" : "open-message"}>
            {trialClosed
              ? "Applications are closed."
              : `${programme.placesAvailable} trial places remain.`}
          </p>
          <p>
            Trial fee: <strong>R 500.00</strong>. Refunds are marked as backend/Payfast
            logic and would deduct the 20% administration fee.
          </p>
        </div>

        <div className="score-table-wrap">
          <table className="score-table">
            <thead>
              <tr>
                <th>Assessor Criteria</th>
                <th>Score / 5</th>
              </tr>
            </thead>
            <tbody>
              {assessors.map((criterion, index) => (
                <tr key={criterion}>
                  <td>{criterion}</td>
                  <td>{index + 1}</td>
                </tr>
              ))}
              <tr>
                <td>Speed - Mental</td>
                <td>4</td>
              </tr>
              <tr>
                <td>Speed - Physical</td>
                <td>4</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="checkout-actions">
          <button className="secondary-button" type="button" onClick={onBack}>
            Back to Dashboard
          </button>
          <button
            className="submit-button inline-submit"
            type="button"
            disabled={trialClosed}
            onClick={onCheckout}
          >
            Add Trial to Basket
          </button>
        </div>
      </div>
    </section>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SimpleInput({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  required = false,
  maxLength,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <FormField label={label} htmlFor={name} error={error} required={required}>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}

function validateAccount(values: AccountDraft) {
  const errors: Partial<Record<keyof AccountDraft, string>> = {};
  const required: Array<keyof AccountDraft> = [
    "playerName",
    "playerSurname",
    "idNumber",
    "dateOfBirth",
    "gender",
    "guardianName",
    "guardianEmail",
    "guardianCell",
    "emergencyContact",
    "allergiesOrConditions",
    "password",
    "confirmPassword",
  ];

  required.forEach((field) => {
    const value = values[field];
    if (typeof value === "string" && value.trim() === "") {
      errors[field] = "This field is required.";
    }
  });

  if (values.idNumber.length > 20) {
    errors.idNumber = "Use 20 characters or fewer.";
  }

  if (values.guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.guardianEmail)) {
    errors.guardianEmail = "Enter a valid email address.";
  }

  if (values.guardianCell && !/^\d{10}$/.test(values.guardianCell)) {
    errors.guardianCell = "Enter exactly 10 digits.";
  }

  if (values.password && values.password.length < 6) {
    errors.password = "Use at least 6 characters.";
  }

  if (values.confirmPassword && values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords must match.";
  }

  return errors;
}

function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(dateOfBirth);
  const referenceDate = new Date("2026-01-01T00:00:00");
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const hasHadBirthday =
    referenceDate.getMonth() > birthDate.getMonth() ||
    (referenceDate.getMonth() === birthDate.getMonth() &&
      referenceDate.getDate() >= birthDate.getDate());

  if (!hasHadBirthday) {
    age -= 1;
  }

  return Number.isNaN(age) ? null : age;
}

function createPassportNumber(firstName: string, surname: string) {
  const initials = `${firstName[0] ?? "P"}${surname[0] ?? "S"}`.toUpperCase();
  return `CTS-${initials}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function toggleListValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function getSummaryDetails(programme: Programme) {
  if (programme.id === "trial") {
    return [
      "Trial application fee: R 500-00 through Payfast",
      "Successful players receive an email link to register for the academy programme",
      "Applicants may be assigned a colour-coded numbered bib",
      "Limited places are checked before applications are accepted",
      "Refunds are less a 20% administration fee",
    ];
  }

  if (programme.id === "holiday-camp") {
    return [
      "Once-off holiday camp booking",
      "No trial requirement",
      "Direct Payfast checkout placeholder",
      "Programme capacity shown before basket",
    ];
  }

  if (programme.id === "foundation") {
    return [
      "Foundation programme registration",
      "No trials required",
      "Kit size and sock size captured before checkout",
      "Terms and conditions acceptance required",
    ];
  }

  return [
    "Academy programme requires trial registration first",
    "Age is checked against programme rules",
    "Annual registration plus first month tuition fee",
    "Monthly debit order or upfront annual payment option",
    "Kit size, sock size, signed debit order, and documents required",
  ];
}

export default App;
