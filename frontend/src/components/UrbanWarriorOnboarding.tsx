import { type FormEvent, useMemo, useState } from "react";
import { programmes } from "../data/programmes";
import { findUnusedCode, getLocalCodeError } from "../services/codeService";
import { buildOnboardingConfirmationMessage } from "../services/emailService";
import { calculateOnboardingAmount } from "../services/paymentService";
import { validateOnboardingStep } from "../services/validationService";
import type {
  GeneratedCode,
  OnboardingCompletion,
  OnboardingRegistration,
} from "../types";
import { postOnboarding, validateCode } from "../utils/api";
import { generatePassportNumber } from "../utils/codeGenerator";
import { formatCurrency } from "../utils/validation";
import FormField from "./FormField";

type UrbanWarriorOnboardingProps = {
  codes: GeneratedCode[];
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
  onUseCode,
  onComplete,
}: UrbanWarriorOnboardingProps) {
  const [values, setValues] = useState(initialValues);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [validatedCodeType, setValidatedCodeType] = useState<
    "trial-authorisation" | "renewal" | ""
  >("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const matchingCode = useMemo(
    () => findUnusedCode(codes, values.authorisationCode),
    [codes, values.authorisationCode],
  );
  const effectiveCodeType = validatedCodeType || matchingCode?.type || "";
  const { programme: selectedProgramme, trialCredit, amountDue } =
    calculateOnboardingAmount(values.programmeId, effectiveCodeType);

  const goNext = async () => {
    const error = validateOnboardingStep(step, values);

    if (error) {
      setMessage(error);
      return;
    }

    if (step === 0) {
      setIsSubmitting(true);
      setMessage("");

      const localCodeError = getLocalCodeError(matchingCode, values);

      if (matchingCode && localCodeError) {
        setMessage(localCodeError);
        setIsSubmitting(false);
        return;
      }

      if (matchingCode) {
        setValidatedCodeType(matchingCode.type);
        setMessage("");
        setStep((current) => Math.min(current + 1, steps.length - 1));
        setIsSubmitting(false);
        return;
      }

      try {
        const result = await validateCode({
          code: values.authorisationCode.trim(),
          membershipNumber: values.membershipNumber.trim() || undefined,
        });
        setValidatedCodeType(
          result.type === "TRIAL_AUTHORISATION" ? "trial-authorisation" : "renewal",
        );
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
    const error = validateOnboardingStep(3, values);

    if (error) {
      setMessage(error);
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      if (matchingCode) {
        const localCodeError = getLocalCodeError(matchingCode, values);

        if (localCodeError) {
          setMessage(localCodeError);
          setIsSubmitting(false);
          return;
        }

        const generatedPassport = generatePassportNumber();
        const completedAt = new Date().toISOString();
        const confirmation = buildOnboardingConfirmationMessage({
          guardianEmail: values.guardianEmail,
          programmeTitle: selectedProgramme.title,
          passportNumber: generatedPassport,
          amountDue,
          source: "local",
        });

        onUseCode(values.authorisationCode.trim());
        setPassportNumber(generatedPassport);
        setConfirmationEmail(confirmation);
        onComplete({
          id: crypto.randomUUID(),
          completedAt,
          passportNumber: generatedPassport,
          programmeId: values.programmeId,
          programmeTitle: selectedProgramme.title,
          playerName: values.playerName,
          playerSurname: values.playerSurname,
          guardianEmail: values.guardianEmail,
          codeUsed: values.authorisationCode.trim(),
          codeType: matchingCode.type,
          trialCredit,
          amountPaid: amountDue,
          paymentOption: values.paymentOption,
          confirmationEmail: confirmation,
        });
        setStep(4);
        return;
      }

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
      const confirmation = buildOnboardingConfirmationMessage({
        guardianEmail: values.guardianEmail,
        programmeTitle: result.onboardingRecord.programmeTitle,
        passportNumber: generatedPassport,
        amountDue: result.onboardingRecord.amountDue,
        source: "backend",
      });
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
                Monthly tuition: {formatCurrency(selectedProgramme.monthlyFee)}
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
              <p>Programme: {selectedProgramme.title}</p>
              <p>
                Registration plus first month:{" "}
                {formatCurrency(selectedProgramme.registrationFee)}
              </p>
              <p>
                Monthly tuition after onboarding:{" "}
                {formatCurrency(selectedProgramme.monthlyFee)}
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

export default UrbanWarriorOnboarding;
