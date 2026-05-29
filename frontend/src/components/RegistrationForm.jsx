import { useState } from "react";
import api from "../api/client";
import InputField from "./InputField.jsx";

const initialState = {
  playerName: "",
  dateOfBirth: "",
  ageGroup: "U8",
  parentName: "",
  email: "",
  phone: "",
  medicalNotes: "",
  paymentReference: "",
};

function RegistrationForm() {
  const [form, setForm] = useState(initialState);
  const [paymentProof, setPaymentProof] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));

      if (paymentProof) {
        payload.append("paymentProof", paymentProof);
      }

      await api.post("/registrations", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setForm(initialState);
      setPaymentProof(null);
      setMessage("Registration submitted. The school will review it shortly.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Something went wrong while sending the registration."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur md:grid-cols-2 md:p-8"
    >
      <InputField
        label="Player name"
        name="playerName"
        value={form.playerName}
        onChange={handleChange}
        required
        placeholder="Noah Smith"
      />
      <InputField
        label="Date of birth"
        name="dateOfBirth"
        type="date"
        value={form.dateOfBirth}
        onChange={handleChange}
        required
      />
      <InputField
        label="Age group"
        name="ageGroup"
        as="select"
        value={form.ageGroup}
        onChange={handleChange}
      >
        {["U6", "U8", "U10", "U12", "U14", "U16"].map((group) => (
          <option key={group} value={group}>
            {group}
          </option>
        ))}
      </InputField>
      <InputField
        label="Parent or guardian"
        name="parentName"
        value={form.parentName}
        onChange={handleChange}
        required
        placeholder="Jordan Smith"
      />
      <InputField
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        required
        placeholder="family@example.com"
      />
      <InputField
        label="Phone"
        name="phone"
        value={form.phone}
        onChange={handleChange}
        required
        placeholder="+1 555 010 2030"
      />
      <InputField
        label="Payment reference"
        name="paymentReference"
        value={form.paymentReference}
        onChange={handleChange}
        placeholder="Bank transfer / transaction ID"
        className="md:col-span-2"
      />
      <InputField
        label="Medical notes"
        name="medicalNotes"
        as="textarea"
        rows="4"
        value={form.medicalNotes}
        onChange={handleChange}
        placeholder="Optional allergies, injuries, or support notes"
        className="md:col-span-2"
      />
      <label className="flex flex-col gap-2 md:col-span-2">
        <span className="text-sm font-semibold text-slate-700">
          Proof of payment
        </span>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={(event) => setPaymentProof(event.target.files?.[0] || null)}
          className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600"
        />
        <span className="text-xs text-slate-500">
          Optional. Upload JPG, PNG, WEBP, or PDF up to 5MB.
        </span>
      </label>
      {message ? (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:col-span-2">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
      >
        {isSubmitting ? "Submitting..." : "Submit registration"}
      </button>
    </form>
  );
}

export default RegistrationForm;
