import { type FormEvent, useMemo, useState } from "react";
import { fees } from "../data/fees";
import { programmes } from "../data/programmes";
import type {
  GeneratedCode,
  OnboardingCompletion,
  OnboardingRegistration,
  TrialOnboardingCredentials,
} from "../types";
import { postOnboarding, validateCode } from "../utils/api";
import { formatCurrency, isEmail, isRequired } from "../utils/validation";
import FormField from "./FormField";

type UrbanWarriorOnboardingProps = {
  codes: GeneratedCode[];
  prefill?: TrialOnboardingCredentials | null;
  onUseCode: (code: string) => void;
  onComplete: (record: OnboardingCompletion) => void;
};

const initialValues: OnboardingRegistration = {
  authorisationCode: "",
  membershipNumber: "",
  programmeId: programmes[0]?.id ?? "",
  playerName: "",
  playerSurname: "",
  idNumber: "",
  guardianName: "",
  guardianEmail: "",
  debitOrderAccepted: false,
  codeOfConductAccepted: false,
  paymentOption: "monthly-debit-order",
};

const steps = [
  "Confirm Details",
  "Code of Conduct",
  "Debit Order",
  "Payment",
  "Completion",
];

function UrbanWarriorOnboarding({
  codes,
  prefill,
  onUseCode,
  onComplete,
}: UrbanWarriorOnboardingProps) {
  const [values, setValues] = useState<OnboardingRegistration>(() => ({
    ...initialValues,
    authorisationCode: prefill?.authorisationCode ?? "",
    membershipNumber: prefill?.membershipNumber ?? "",
    playerName: prefill?.playerName ?? "",
    playerSurname: prefill?.playerSurname ?? "",
    guardianName: prefill?.guardianName ?? "",
    guardianEmail: prefill?.guardianEmail ?? "",
  }));
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState(
    prefill
      ? "Trial application details have been filled in. Complete the remaining required fields."
      : "",
  );
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [validatedCodeType, setValidatedCodeType] = useState<
    "trial-authorisation" | "renewal" | ""
  >("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const matchingCode = useMemo(
    () => codes.find((code) => code.code === values.authorisationCode.trim() && !code.used),
    [codes, values.authorisationCode],
  );
  const selectedProgramme =
    programmes.find((programme) => programme.id === values.programmeId) ?? programmes[0];
  const trialFee = fees.find((fee) => fee.id === "trial")?.amount ?? 500;
  const effectiveCodeType = validatedCodeType || matchingCode?.type || "";
  const trialCredit = effectiveCodeType === "trial-authorisation" ? trialFee : 0;
  const amountDue = Math.max((selectedProgramme?.registrationFee ?? 0) - trialCredit, 0);

  const goNext = async () => {
    const error = getStepError(step, values);

    if (error) {
      setMessage(error);
      return;
    }

    if (step === 0) {
      setIsSubmitting(true);
      setMessage("");

      try {
        const result = await validateCode({
          code: values.authorisationCode.trim(),
          membershipNumber: values.membershipNumber.trim() || undefined,
        });
        setValidatedCodeType(
          result.type === "TRIAL_AUTHORISATION" ? "trial-authorisation" : "renewal",
        );
        const eligibilityError = getProgrammeEligibilityError(
          values.programmeId,
          result.playerDateOfBirth,
        );

        if (eligibilityError) {
          setMessage(eligibilityError);
          setIsSubmitting(false);
          return;
        }
      } catch (apiError) {
        setMessage(apiError instanceof Error ? apiError.message : "Invalid code.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
    }

    setMessage("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setMessage("");
    setStep((current) => Math.max(current - 1, 0));
  };

  const completeOnboarding = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = getStepError(3, values);

    if (error) {
      setMessage(error);
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const result = await postOnboarding({
        code: values.authorisationCode.trim(),
        membershipNumber: values.membershipNumber.trim() || undefined,
        programmeId: values.programmeId,
        playerName: values.playerName,
        playerSurname: values.playerSurname,
        idNumber: values.idNumber,
        guardianName: values.guardianName,
        guardianEmail: values.guardianEmail,
        debitOrderAccepted: values.debitOrderAccepted,
        codeOfConductAccepted: values.codeOfConductAccepted,
        paymentOption: values.paymentOption,
      });
      const generatedPassport = result.onboardingRecord.passportNumber;
      const confirmation = `Onboarding created in backend for ${values.guardianEmail}. Programme: ${result.onboardingRecord.programmeTitle}. Passport number: ${generatedPassport}. Amount due: ${formatCurrency(result.onboardingRecord.amountDue)}.`;
      onUseCode(values.authorisationCode);
      setPassportNumber(generatedPassport);
      setConfirmationEmail(confirmation);
      onComplete({
        id: result.onboardingRecord.id,
        completedAt: result.onboardingRecord.createdAt,
        passportNumber: generatedPassport,
        programmeId: result.onboardingRecord.programmeId,
        programmeTitle: result.onboardingRecord.programmeTitle,
        playerName: result.onboardingRecord.playerName,
        playerSurname: result.onboardingRecord.playerSurname,
        guardianEmail: result.onboardingRecord.guardianEmail,
        codeUsed: values.authorisationCode,
        codeType: effectiveCodeType === "trial-authorisation" ? "trial-authorisation" : "renewal",
        trialCredit: result.onboardingRecord.trialCreditAmount,
        amountPaid: result.onboardingRecord.amountDue,
        paymentOption: result.onboardingRecord.paymentOption,
        confirmationEmail: confirmation,
      });
      setStep(4);
    } catch (apiError) {
      setMessage(apiError instanceof Error ? apiError.message : "Onboarding failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="form-card">
      <div className="intro-panel">
        <p>
          Urban Warrior onboarding is unlocked by an unused trial authorisation or
          renewal code.
        </p>
      </div>
      <form className="registration-form" onSubmit={completeOnboarding} noValidate>
        <div className="wizard-steps" aria-label="Onboarding steps">
          {steps.map((label, index) => (
            <span className={index === step ? "active" : ""} key={label}>
              {index + 1}. {label}
            </span>
          ))}
        </div>

        {message && <p className="field-error panel-error">{message}</p>}

        {step === 0 && (
          <div className="section-grid">
            <FormField label="Authorisation / Renewal Code" htmlFor="authCode" required>
              <input
                id="authCode"
                value={values.authorisationCode}
                onChange={(event) =>
                  setValues({ ...values, authorisationCode: event.target.value })
                }
              />
              <span className="field-hint">
                Code can only be used once. Trial codes receive a R500 credit.
              </span>
            </FormField>
            <FormField label="Membership Number" htmlFor="onboardMembership">
              <input
                id="onboardMembership"
                value={values.membershipNumber}
                onChange={(event) =>
                  setValues({ ...values, membershipNumber: event.target.value })
                }
                placeholder="Required for renewal codes"
              />
            </FormField>
            <FormField label="Programme" htmlFor="onboardProgramme" required>
              <select
                id="onboardProgramme"
                value={values.programmeId}
                onChange={(event) =>
                  setValues({ ...values, programmeId: event.target.value })
                }
              >
                {programmes.map((programme) => (
                  <option key={programme.id} value={programme.id}>
                    {programme.title} - {formatCurrency(programme.registrationFee)}
                  </option>
                ))}
              </select>
              <span className="field-hint">
                Monthly tuition:{" "}
                {selectedProgramme
                  ? formatCurrency(selectedProgramme.monthlyFee)
                  : formatCurrency(0)}
              </span>
            </FormField>
            <FormField label="Player Name" htmlFor="onboardName" required>
              <input
                id="onboardName"
                value={values.playerName}
                onChange={(event) =>
                  setValues({ ...values, playerName: event.target.value })
                }
              />
            </FormField>
            <FormField label="Player Surname" htmlFor="onboardSurname" required>
              <input
                id="onboardSurname"
                value={values.playerSurname}
                onChange={(event) =>
                  setValues({ ...values, playerSurname: event.target.value })
                }
              />
            </FormField>
            <FormField label="ID / Passport Number" htmlFor="onboardId" required>
              <input
                id="onboardId"
                maxLength={20}
                value={values.idNumber}
                onChange={(event) => setValues({ ...values, idNumber: event.target.value })}
              />
            </FormField>
            <FormField label="Guardian Name" htmlFor="onboardGuardian" required>
              <input
                id="onboardGuardian"
                value={values.guardianName}
                onChange={(event) =>
                  setValues({ ...values, guardianName: event.target.value })
                }
              />
            </FormField>
            <FormField label="Guardian Email" htmlFor="onboardEmail" required>
              <input
                id="onboardEmail"
                type="email"
                value={values.guardianEmail}
                onChange={(event) =>
                  setValues({ ...values, guardianEmail: event.target.value })
                }
              />
            </FormField>
          </div>
        )}

        {step === 1 && (
          <div className="path-panel">
            <h2>Code of Conduct</h2>
            <p>
              Player and guardian agree to follow academy conduct, training,
              communication, and attendance expectations.
            </p>
            <label className="check-option">
              <input
                type="checkbox"
                checked={values.codeOfConductAccepted}
                onChange={(event) =>
                  setValues({ ...values, codeOfConductAccepted: event.target.checked })
                }
              />
              Accept Code of Conduct
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="path-panel">
            <h2>Debit Order Authorisation</h2>
            <p>
              Debit order capture is simulated for this MVP. Backend document and
              bank mandate handling will be added later.
            </p>
            <label className="check-option">
              <input
                type="checkbox"
                checked={values.debitOrderAccepted}
                onChange={(event) =>
                  setValues({ ...values, debitOrderAccepted: event.target.checked })
                }
              />
              Authorise debit order placeholder
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="path-panel">
            <h2>Payment</h2>
            <div className="payment-summary">
              <p>Programme: {selectedProgramme?.title}</p>
              <p>
                Registration plus first month:{" "}
                {formatCurrency(selectedProgramme?.registrationFee ?? 0)}
              </p>
              <p>
                Monthly tuition after onboarding:{" "}
                {formatCurrency(selectedProgramme?.monthlyFee ?? 0)}
              </p>
              <p>
                Trial credit:{" "}
                {trialCredit > 0 ? `- ${formatCurrency(trialCredit)}` : formatCurrency(0)}
              </p>
              <strong>Amount due now: {formatCurrency(amountDue)}</strong>
            </div>
            <div className="payment-options">
              <label className="check-option">
                <input
                  type="radio"
                  checked={values.paymentOption === "monthly-debit-order"}
                  onChange={() =>
                    setValues({ ...values, paymentOption: "monthly-debit-order" })
                  }
                />
                Monthly debit order
              </label>
              <label className="check-option">
                <input
                  type="radio"
                  checked={values.paymentOption === "annual-upfront"}
                  onChange={() => setValues({ ...values, paymentOption: "annual-upfront" })}
                />
                Annual upfront payment
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="completion-panel">
            <h2>Onboarding Complete</h2>
            <p>{confirmationEmail}</p>
            <p>
              New Passport Number: <strong>{passportNumber}</strong>
            </p>
          </div>
        )}

        {step < 4 && (
          <div className="checkout-actions">
            {step > 0 && (
              <button className="secondary-button" type="button" onClick={goBack}>
                Back
              </button>
            )}
            {step < 3 && (
              <button
                className="submit-button inline-submit"
                type="button"
                onClick={goNext}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Checking..." : "Continue"}
              </button>
            )}
            {step === 3 && (
              <button
                className="submit-button inline-submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Complete Payment"}
              </button>
            )}
          </div>
        )}
      </form>
    </section>
  );
}

function getStepError(
  step: number,
  values: OnboardingRegistration,
) {
  if (step === 0) {
    if (
      !isRequired(values.authorisationCode) ||
      !isRequired(values.programmeId) ||
      !isRequired(values.playerName) ||
      !isRequired(values.playerSurname) ||
      !isRequired(values.idNumber) ||
      !isRequired(values.guardianName) ||
      !isEmail(values.guardianEmail)
    ) {
      return "Complete all required personal details.";
    }
  }

  if (step === 1 && !values.codeOfConductAccepted) {
    return "Accept the Code of Conduct before continuing.";
  }

  if (step === 2 && !values.debitOrderAccepted) {
    return "Authorise the debit order placeholder before continuing.";
  }

  if (step === 3 && !values.paymentOption) {
    return "Select a payment option.";
  }

  return "";
}

function getProgrammeEligibilityError(
  programmeId: string,
  dateOfBirth?: string | null,
) {
  if (!dateOfBirth) return "";

  const programme = programmes.find((item) => item.id === programmeId);
  const seasonYear = new Date().getFullYear();
  const birthYear = new Date(dateOfBirth).getFullYear();
  const age = seasonYear - birthYear;

  if (programmeId === "first-touch" && age > 7) {
    return `${programme?.title || "First Touch"} is for players aged 7 and below in ${seasonYear}. This player is ${age}. Suggested pathway: ${getProgrammeSuggestionForAge(age)}. If you are unsure, contact support@capetownspurs.co.za.`;
  }

  if (programmeId === "little-warriors" && (age < 8 || age > 10)) {
    return `${programme?.title || "Little Warriors"} is for players aged 8 to 10 in ${seasonYear}. This player is ${age}. Suggested pathway: ${getProgrammeSuggestionForAge(age)}. If you are unsure, contact support@capetownspurs.co.za.`;
  }

  return "";
}

function getProgrammeSuggestionForAge(age: number) {
  if (age <= 7) return "First Touch";
  if (age >= 8 && age <= 10) return "Little Warriors";
  return "Academy trial / Urban Warrior programme pathway";
}

export default UrbanWarriorOnboarding;
