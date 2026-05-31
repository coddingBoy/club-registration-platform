import { type ChangeEvent, type FormEvent, useState } from "react";
import {
  birthYearOptions,
  genderOptions,
  kitSizeOptions,
  provinceOptions,
  socksSizeOptions,
} from "../data/options";
import type { FormErrors, Option, RegistrationFormValues } from "../types";
import FormField from "./FormField";

const initialValues: RegistrationFormValues = {
  playerName: "",
  playerSurname: "",
  dateOfBirth: "",
  birthYearCategory: "",
  idPassportNumber: "",
  birthCertificate: null,
  gender: "",
  kitSize: "",
  socksSize: "",
  parentName: "",
  parentSurname: "",
  relationToPlayer: "",
  streetAddress: "",
  city: "",
  province: "",
  contactNumber: "",
  email: "",
  confirmEmail: "",
  medicalAidName: "",
  medicalAidNumber: "",
  mainMemberName: "",
  mainMemberContactNumber: "",
  emergencyContactName: "",
  emergencyRelationToPlayer: "",
  emergencyContactNumber: "",
  allergiesOrConditions: "",
  consent: false,
};

const requiredFields: Array<keyof RegistrationFormValues> = [
  "playerName",
  "playerSurname",
  "birthYearCategory",
  "idPassportNumber",
  "birthCertificate",
  "gender",
  "kitSize",
  "socksSize",
  "parentName",
  "parentSurname",
  "relationToPlayer",
  "streetAddress",
  "city",
  "province",
  "contactNumber",
  "email",
  "confirmEmail",
  "emergencyContactName",
  "emergencyRelationToPlayer",
  "emergencyContactNumber",
  "allergiesOrConditions",
  "consent",
];

const fieldLabels: Partial<Record<keyof RegistrationFormValues, string>> = {
  playerName: "Name",
  playerSurname: "Surname",
  birthYearCategory: "Date of Birth as of 1 January 2026",
  idPassportNumber: "ID/Passport Number",
  birthCertificate: "Upload Birth Certificate",
  gender: "Gender",
  kitSize: "Kit Size",
  socksSize: "Socks",
  parentName: "Parent Name",
  parentSurname: "Parent Surname",
  relationToPlayer: "Relation to Player",
  streetAddress: "Street Address",
  city: "City",
  province: "Province",
  contactNumber: "Contact Number",
  email: "Email Address",
  confirmEmail: "Confirm Email Address",
  emergencyContactName: "Emergency Contact Name",
  emergencyRelationToPlayer: "Relation to Player",
  emergencyContactNumber: "Emergency Contact Number",
  allergiesOrConditions: "Allergies or Conditions",
  consent: "Consent",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\d{10}$/;
const maxFileSize = 2 * 1024 * 1024;
const allowedFileTypes = ["image/jpeg", "application/pdf"];

function validate(values: RegistrationFormValues): FormErrors {
  const errors: FormErrors = {};

  requiredFields.forEach((field) => {
    const value = values[field];

    if (field === "birthCertificate" && !value) {
      errors[field] = "Please upload a JPEG or PDF birth certificate.";
      return;
    }

    if (field === "consent" && value !== true) {
      errors[field] = "You must agree before continuing.";
      return;
    }

    if (typeof value === "string" && value.trim() === "") {
      errors[field] = `${fieldLabels[field] ?? "This field"} is required.`;
    }
  });

  if (values.email && !emailPattern.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (values.confirmEmail && values.confirmEmail !== values.email) {
    errors.confirmEmail = "Email addresses must match.";
  }

  if (values.contactNumber && !phonePattern.test(values.contactNumber)) {
    errors.contactNumber = "Enter exactly 10 digits.";
  }

  if (
    values.mainMemberContactNumber &&
    !phonePattern.test(values.mainMemberContactNumber)
  ) {
    errors.mainMemberContactNumber = "Enter exactly 10 digits.";
  }

  if (
    values.emergencyContactNumber &&
    !phonePattern.test(values.emergencyContactNumber)
  ) {
    errors.emergencyContactNumber = "Enter exactly 10 digits.";
  }

  if (values.idPassportNumber.length > 20) {
    errors.idPassportNumber = "Use 20 characters or fewer.";
  }

  if (values.birthCertificate) {
    if (!allowedFileTypes.includes(values.birthCertificate.type)) {
      errors.birthCertificate = "Only JPEG and PDF files are accepted.";
    } else if (values.birthCertificate.size > maxFileSize) {
      errors.birthCertificate = "File size must be 2MB or less.";
    }
  }

  return errors;
}

function getPayload(values: RegistrationFormValues) {
  return {
    ...values,
    birthCertificate: values.birthCertificate
      ? {
          name: values.birthCertificate.name,
          size: values.birthCertificate.size,
          type: values.birthCertificate.type,
        }
      : null,
  };
}

function RegistrationForm() {
  const [values, setValues] = useState<RegistrationFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const updateValue = <K extends keyof RegistrationFormValues>(
    name: K,
    value: RegistrationFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitted(false);
  };

  const handleTextChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    updateValue(name as keyof RegistrationFormValues, value as never);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateValue("birthCertificate", event.target.files?.[0] ?? null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitted(false);
      return;
    }

    const payload = getPayload(values);
    console.log("First Touch Programme registration payload", payload);
    setSubmitted(true);
  };

  return (
    <form className="registration-form" onSubmit={handleSubmit} noValidate>
      {submitted && (
        <div className="success-message" role="status">
          Registration details captured. You can continue to checkout.
        </div>
      )}

      <FormSection title="Player Details">
        <TextInput
          label="Name"
          name="playerName"
          value={values.playerName}
          error={errors.playerName}
          onChange={handleTextChange}
          required
        />
        <TextInput
          label="Surname"
          name="playerSurname"
          value={values.playerSurname}
          error={errors.playerSurname}
          onChange={handleTextChange}
          required
        />
        <TextInput
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          value={values.dateOfBirth}
          error={errors.dateOfBirth}
          onChange={handleTextChange}
        />
        <TextInput
          label="ID/Passport Number"
          name="idPassportNumber"
          value={values.idPassportNumber}
          error={errors.idPassportNumber}
          onChange={handleTextChange}
          maxLength={20}
          required
        />
        <SelectInput
          label="Date of Birth as of 1 January 2026"
          name="birthYearCategory"
          value={values.birthYearCategory}
          error={errors.birthYearCategory}
          options={birthYearOptions}
          onChange={handleTextChange}
          required
        />
        <FormField
          label="Upload Birth Certificate"
          htmlFor="birthCertificate"
          error={errors.birthCertificate}
          required
        >
          <input
            id="birthCertificate"
            name="birthCertificate"
            type="file"
            accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf"
            aria-describedby={errors.birthCertificate ? "birthCertificate-error" : undefined}
            onChange={handleFileChange}
          />
          <span className="field-hint">JPEG or PDF, maximum 2MB.</span>
        </FormField>
        <RadioGroup
          label="Gender"
          name="gender"
          value={values.gender}
          error={errors.gender}
          options={genderOptions}
          onChange={(value) => updateValue("gender", value)}
          required
        />
        <SelectInput
          label="Kit Size"
          name="kitSize"
          value={values.kitSize}
          error={errors.kitSize}
          options={kitSizeOptions}
          onChange={handleTextChange}
          required
        />
        <SelectInput
          label="Socks"
          name="socksSize"
          value={values.socksSize}
          error={errors.socksSize}
          options={socksSizeOptions}
          onChange={handleTextChange}
          required
        />
      </FormSection>

      <FormSection title="Parent / Guardian Details">
        <TextInput
          label="Parent Name"
          name="parentName"
          value={values.parentName}
          error={errors.parentName}
          onChange={handleTextChange}
          required
        />
        <TextInput
          label="Parent Surname"
          name="parentSurname"
          value={values.parentSurname}
          error={errors.parentSurname}
          onChange={handleTextChange}
          required
        />
        <TextInput
          label="Relation to Player"
          name="relationToPlayer"
          value={values.relationToPlayer}
          error={errors.relationToPlayer}
          onChange={handleTextChange}
          required
        />
        <TextInput
          label="Street Address"
          name="streetAddress"
          value={values.streetAddress}
          error={errors.streetAddress}
          onChange={handleTextChange}
          required
          fullWidth
        />
        <TextInput
          label="City"
          name="city"
          value={values.city}
          error={errors.city}
          onChange={handleTextChange}
          required
        />
        <SelectInput
          label="Province"
          name="province"
          value={values.province}
          error={errors.province}
          options={provinceOptions}
          onChange={handleTextChange}
          required
        />
        <TextInput
          label="Contact Number"
          name="contactNumber"
          value={values.contactNumber}
          error={errors.contactNumber}
          onChange={handleTextChange}
          maxLength={10}
          inputMode="numeric"
          required
        />
        <TextInput
          label="Email Address"
          name="email"
          type="email"
          value={values.email}
          error={errors.email}
          onChange={handleTextChange}
          required
        />
        <TextInput
          label="Confirm Email Address"
          name="confirmEmail"
          type="email"
          value={values.confirmEmail}
          error={errors.confirmEmail}
          onChange={handleTextChange}
          required
        />
      </FormSection>

      <FormSection title="Medical Details">
        <TextInput
          label="Medical Aid Name"
          name="medicalAidName"
          value={values.medicalAidName}
          error={errors.medicalAidName}
          onChange={handleTextChange}
        />
        <TextInput
          label="Medical Aid Number"
          name="medicalAidNumber"
          value={values.medicalAidNumber}
          error={errors.medicalAidNumber}
          onChange={handleTextChange}
        />
        <TextInput
          label="Main Member Name"
          name="mainMemberName"
          value={values.mainMemberName}
          error={errors.mainMemberName}
          onChange={handleTextChange}
        />
        <TextInput
          label="Main Member Contact Number"
          name="mainMemberContactNumber"
          value={values.mainMemberContactNumber}
          error={errors.mainMemberContactNumber}
          onChange={handleTextChange}
          maxLength={10}
          inputMode="numeric"
        />
      </FormSection>

      <FormSection title="Emergency Contact Details">
        <TextInput
          label="Emergency Contact Name"
          name="emergencyContactName"
          value={values.emergencyContactName}
          error={errors.emergencyContactName}
          onChange={handleTextChange}
          required
        />
        <TextInput
          label="Relation to Player"
          name="emergencyRelationToPlayer"
          value={values.emergencyRelationToPlayer}
          error={errors.emergencyRelationToPlayer}
          onChange={handleTextChange}
          required
        />
        <TextInput
          label="Emergency Contact Number"
          name="emergencyContactNumber"
          value={values.emergencyContactNumber}
          error={errors.emergencyContactNumber}
          onChange={handleTextChange}
          maxLength={10}
          inputMode="numeric"
          required
        />
        <FormField
          label="Allergies or Conditions"
          htmlFor="allergiesOrConditions"
          error={errors.allergiesOrConditions}
          required
          className="full-width"
        >
          <textarea
            id="allergiesOrConditions"
            name="allergiesOrConditions"
            value={values.allergiesOrConditions}
            aria-describedby={
              errors.allergiesOrConditions ? "allergiesOrConditions-error" : undefined
            }
            onChange={handleTextChange}
            rows={4}
          />
        </FormField>
      </FormSection>

      <div className="consent-row">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          checked={values.consent}
          aria-describedby={errors.consent ? "consent-error" : undefined}
          onChange={(event) => updateValue("consent", event.target.checked)}
        />
        <label htmlFor="consent">
          Yes, I agree with the <strong>TERMS AND CONDITIONS & CODE OF CONDUCT</strong>
        </label>
      </div>
      {errors.consent && (
        <p className="field-error consent-error" id="consent-error">
          {errors.consent}
        </p>
      )}

      <button className="submit-button" type="submit">
        Add to Basket
      </button>
    </form>
  );
}

type FormSectionProps = {
  title: string;
  children: React.ReactNode;
};

function FormSection({ title, children }: FormSectionProps) {
  return (
    <fieldset className="form-section">
      <legend>{title}</legend>
      <div className="section-grid">{children}</div>
    </fieldset>
  );
}

type TextInputProps = {
  label: string;
  name: keyof RegistrationFormValues;
  value: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  inputMode?: "numeric";
  fullWidth?: boolean;
};

function TextInput({
  label,
  name,
  value,
  error,
  onChange,
  type = "text",
  required = false,
  maxLength,
  inputMode,
  fullWidth = false,
}: TextInputProps) {
  return (
    <FormField
      label={label}
      htmlFor={name}
      error={error}
      required={required}
      className={fullWidth ? "full-width" : ""}
    >
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        maxLength={maxLength}
        inputMode={inputMode}
        aria-describedby={error ? `${name}-error` : undefined}
        onChange={onChange}
      />
    </FormField>
  );
}

type SelectInputProps = {
  label: string;
  name: keyof RegistrationFormValues;
  value: string;
  error?: string;
  options: Option[];
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
};

function SelectInput({
  label,
  name,
  value,
  error,
  options,
  onChange,
  required = false,
}: SelectInputProps) {
  return (
    <FormField label={label} htmlFor={name} error={error} required={required}>
      <select
        id={name}
        name={name}
        value={value}
        aria-describedby={error ? `${name}-error` : undefined}
        onChange={onChange}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

type RadioGroupProps = {
  label: string;
  name: keyof RegistrationFormValues;
  value: string;
  error?: string;
  options: Option[];
  onChange: (value: string) => void;
  required?: boolean;
};

function RadioGroup({
  label,
  name,
  value,
  error,
  options,
  onChange,
  required = false,
}: RadioGroupProps) {
  return (
    <FormField label={label} error={error} required={required}>
      <div className="radio-row" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <label className="radio-option" key={option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </FormField>
  );
}

export default RegistrationForm;
