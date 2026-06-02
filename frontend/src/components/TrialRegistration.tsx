import { type FormEvent, useState } from "react";
import { fees } from "../data/fees";
import type {
  TrialApplication,
  TrialRegistration as TrialRegistrationData,
} from "../types";
import { postTrialApplication } from "../utils/api";
import {
  calculateAge,
  formatCurrency,
  isEmail,
  isRequired,
  isTenDigitPhone,
} from "../utils/validation";
import FormField from "./FormField";

type TrialRegistrationProps = {
  onApplicationSaved: (application: TrialApplication) => void;
};

const trialFee = fees.find((fee) => fee.id === "trial");

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

  const age = calculateAge(values.dateOfBirth, new Date("2026-01-01"));
  const formIsComplete =
    isRequired(values.playerName) &&
    isRequired(values.playerSurname) &&
    isRequired(values.guardianName) &&
    isEmail(values.guardianEmail) &&
    isTenDigitPhone(values.guardianPhone);

  const simulatePayment = () => {
    if (!formIsComplete) {
      setMessage("Complete the trial form before simulating the R500 payment.");
      return;
    }

    setPaymentConfirmed(true);
    setMessage("Payment simulated. Trial application can now be saved.");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formIsComplete) {
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
      const application: TrialApplication = {
        ...values,
        id: result.trialApplication.id,
        submittedAt: result.trialApplication.createdAt,
        status: mapTrialStatus(result.trialApplication.status),
        paymentConfirmed: result.payment.status === "PAID",
      };

      onApplicationSaved(application);
      setValues(initialValues);
      setPaymentConfirmed(false);
      setMessage(
        `Trial application sent to backend. Payment checkout created: ${result.payment.id}.`,
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
          <FormField label="Player Name" htmlFor="trialPlayerName" required>
            <input
              id="trialPlayerName"
              value={values.playerName}
              onChange={(event) =>
                setValues({ ...values, playerName: event.target.value })
              }
            />
          </FormField>
          <FormField label="Player Surname" htmlFor="trialPlayerSurname" required>
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
          <FormField label="Guardian Name" htmlFor="trialGuardian" required>
            <input
              id="trialGuardian"
              value={values.guardianName}
              onChange={(event) =>
                setValues({ ...values, guardianName: event.target.value })
              }
            />
          </FormField>
          <FormField label="Guardian Email" htmlFor="trialEmail" required>
            <input
              id="trialEmail"
              type="email"
              value={values.guardianEmail}
              onChange={(event) =>
                setValues({ ...values, guardianEmail: event.target.value })
              }
            />
          </FormField>
          <FormField label="Guardian Cell" htmlFor="trialPhone" required>
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
            Pay {formatCurrency(trialFee?.amount ?? 500)}
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

function mapTrialStatus(status: string): TrialApplication["status"] {
  if (status === "PAYMENT_PENDING") return "payment-pending";
  if (status === "SUCCESSFUL") return "successful";
  if (status === "UNSUCCESSFUL") return "unsuccessful";
  return "paid";
}

export default TrialRegistration;
