import { type FormEvent, useState } from "react";
import { trialFeeAmount } from "../services/paymentService";
import { buildTrialApplicationFromResponse } from "../services/trialService";
import {
  isTrialRegistrationComplete,
  validateTrialRegistration,
} from "../services/validationService";
import type {
  TrialApplication,
  TrialRegistration as TrialRegistrationData,
} from "../types";
import { postTrialApplication } from "../utils/api";
import { calculateAge, formatCurrency } from "../utils/validation";
import FormField from "./FormField";

type TrialRegistrationProps = {
  onApplicationSaved: (application: TrialApplication) => void;
};

const initialValues: TrialRegistrationData = {
  playerName: "",
  playerSurname: "",
  dateOfBirth: "",
  guardianName: "",
  guardianEmail: "",
  guardianPhone: "",
};

function TrialRegistration({ onApplicationSaved }: TrialRegistrationProps) {
  const [values, setValues] = useState(initialValues);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<keyof TrialRegistrationData, string>>
  >({});

  const age = calculateAge(values.dateOfBirth, new Date("2026-01-01"));
  const formIsComplete = isTrialRegistrationComplete(values);

  const simulatePayment = () => {
    const nextErrors = validateTrialRegistration(values);
    setErrors(nextErrors);

    if (!formIsComplete) {
      setMessage("Complete the trial form before simulating the R500 payment.");
      return;
    }

    setPaymentConfirmed(true);
    setMessage("Payment simulated. Trial application can now be saved.");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateTrialRegistration(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage("Complete all required trial details before saving.");
      return;
    }

    if (!paymentConfirmed) {
      setMessage("Click Pay R500 before saving the trial application.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const result = await postTrialApplication(values);
      const application: TrialApplication = buildTrialApplicationFromResponse(
        values,
        result,
      );

      onApplicationSaved(application);
      setValues(initialValues);
      setPaymentConfirmed(false);
      setErrors({});
      setMessage(
        `Trial application saved. Simulated R500 payment confirmed for admin review.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Trial application failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="form-card">
      <div className="intro-panel">
        <p>
          New players apply through trials first. They complete the form, pay the
          simulated R500 fee, and wait for admin review.
        </p>
      </div>
      <form className="registration-form" onSubmit={handleSubmit} noValidate>
        {message && <p className="success-message">{message}</p>}
        <div className="section-grid">
          <FormField
            label="Player Name"
            htmlFor="trialPlayerName"
            error={errors.playerName}
            required
          >
            <input
              id="trialPlayerName"
              value={values.playerName}
              onChange={(event) =>
                setValues({ ...values, playerName: event.target.value })
              }
            />
          </FormField>
          <FormField
            label="Player Surname"
            htmlFor="trialPlayerSurname"
            error={errors.playerSurname}
            required
          >
            <input
              id="trialPlayerSurname"
              value={values.playerSurname}
              onChange={(event) =>
                setValues({ ...values, playerSurname: event.target.value })
              }
            />
          </FormField>
          <FormField label="Date of Birth" htmlFor="trialDob">
            <input
              id="trialDob"
              type="date"
              value={values.dateOfBirth}
              onChange={(event) =>
                setValues({ ...values, dateOfBirth: event.target.value })
              }
            />
            <span className="field-hint">
              Age as at 1 January 2026: {age === null ? "not calculated" : age}
            </span>
          </FormField>
          <FormField
            label="Guardian Name"
            htmlFor="trialGuardian"
            error={errors.guardianName}
            required
          >
            <input
              id="trialGuardian"
              value={values.guardianName}
              onChange={(event) =>
                setValues({ ...values, guardianName: event.target.value })
              }
            />
          </FormField>
          <FormField
            label="Guardian Email"
            htmlFor="trialEmail"
            error={errors.guardianEmail}
            required
          >
            <input
              id="trialEmail"
              type="email"
              value={values.guardianEmail}
              onChange={(event) =>
                setValues({ ...values, guardianEmail: event.target.value })
              }
            />
          </FormField>
          <FormField
            label="Guardian Cell"
            htmlFor="trialPhone"
            error={errors.guardianPhone}
            required
          >
            <input
              id="trialPhone"
              maxLength={10}
              value={values.guardianPhone}
              onChange={(event) =>
                setValues({ ...values, guardianPhone: event.target.value })
              }
            />
          </FormField>
        </div>

        <div className="trial-payment">
          <button className="secondary-button" type="button" onClick={simulatePayment}>
            Pay {formatCurrency(trialFeeAmount)}
          </button>
          <p className={paymentConfirmed ? "open-message" : "capacity-copy"}>
            {paymentConfirmed ? "Payment simulated" : "Payment pending"}
          </p>
        </div>

        <button className="submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Save Trial Application"}
        </button>
      </form>
    </section>
  );
}

export default TrialRegistration;
