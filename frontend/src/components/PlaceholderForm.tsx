import { type FormEvent, useState } from "react";
import type {
  SimpleRegistrationConfig,
  SimpleRegistrationRecord,
} from "../types";
import { postSimpleRegistration } from "../utils/api";
import { isEmail, isRequired, isTenDigitPhone } from "../utils/validation";
import FormField from "./FormField";

type PlaceholderFormProps = {
  config: SimpleRegistrationConfig;
  onSubmitRegistration: (record: SimpleRegistrationRecord) => void;
};

type BaseValues = {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  parentGuardian: string;
};

const initialBaseValues: BaseValues = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  parentGuardian: "",
};

function PlaceholderForm({ config, onSubmitRegistration }: PlaceholderFormProps) {
  const [baseValues, setBaseValues] = useState<BaseValues>(initialBaseValues);
  const [specificValues, setSpecificValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!isRequired(baseValues.fullName)) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!isEmail(baseValues.email)) {
      nextErrors.email = "Enter a valid email.";
    }

    if (!isTenDigitPhone(baseValues.phone)) {
      nextErrors.phone = "Enter a 10 digit phone number.";
    }

    if (config.dateOfBirthRelevant && !isRequired(baseValues.dateOfBirth)) {
      nextErrors.dateOfBirth = "Date of birth is required.";
    }

    if (config.parentGuardianRelevant && !isRequired(baseValues.parentGuardian)) {
      nextErrors.parentGuardian = "Parent/guardian is required.";
    }

    config.fields.forEach((field) => {
      if (field.required && !isRequired(specificValues[field.name] ?? "")) {
        nextErrors[field.name] = `${field.label} is required.`;
      }
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setConfirmation("");
      return;
    }

    setIsSubmitting(true);
    setConfirmation("");

    try {
      const result = await postSimpleRegistration({
        type: config.type,
        fullName: baseValues.fullName,
        email: baseValues.email,
        phone: baseValues.phone,
        dateOfBirth: config.dateOfBirthRelevant ? baseValues.dateOfBirth : undefined,
        parentGuardian: config.parentGuardianRelevant
          ? baseValues.parentGuardian
          : undefined,
        specificFields: specificValues,
      });
      const record: SimpleRegistrationRecord = {
        id: result.id,
        type: config.type,
        referenceNumber: result.referenceNumber,
        fullName: baseValues.fullName,
        email: baseValues.email,
        phone: baseValues.phone,
        dateOfBirth: config.dateOfBirthRelevant ? baseValues.dateOfBirth : undefined,
        parentGuardian: config.parentGuardianRelevant
          ? baseValues.parentGuardian
          : undefined,
        specificFields: specificValues,
        submittedAt: result.submittedAt,
        emailSimulatedAt: result.emailSimulatedAt,
      };

      onSubmitRegistration(record);
      setConfirmation(
        `Reference ${result.referenceNumber} returned by backend. Confirmation email logged for ${baseValues.email}.`,
      );
      setBaseValues(initialBaseValues);
      setSpecificValues({});
    } catch (error) {
      setConfirmation(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="form-card">
      <div className="intro-panel">
        <p>{config.intro}</p>
      </div>
      <form className="registration-form" onSubmit={handleSubmit} noValidate>
        {confirmation && <p className="success-message">{confirmation}</p>}

        <fieldset className="form-section">
          <legend>{config.title}</legend>
          <div className="section-grid">
            <FormField label="Full Name" htmlFor={`${config.type}-fullName`} error={errors.fullName} required>
              <input
                id={`${config.type}-fullName`}
                value={baseValues.fullName}
                onChange={(event) =>
                  setBaseValues({ ...baseValues, fullName: event.target.value })
                }
              />
            </FormField>
            <FormField label="Email" htmlFor={`${config.type}-email`} error={errors.email} required>
              <input
                id={`${config.type}-email`}
                type="email"
                value={baseValues.email}
                onChange={(event) =>
                  setBaseValues({ ...baseValues, email: event.target.value })
                }
              />
            </FormField>
            <FormField label="Phone" htmlFor={`${config.type}-phone`} error={errors.phone} required>
              <input
                id={`${config.type}-phone`}
                maxLength={10}
                value={baseValues.phone}
                onChange={(event) =>
                  setBaseValues({ ...baseValues, phone: event.target.value })
                }
              />
            </FormField>

            {config.dateOfBirthRelevant && (
              <FormField
                label="Date of Birth"
                htmlFor={`${config.type}-dob`}
                error={errors.dateOfBirth}
                required
              >
                <input
                  id={`${config.type}-dob`}
                  type="date"
                  value={baseValues.dateOfBirth}
                  onChange={(event) =>
                    setBaseValues({ ...baseValues, dateOfBirth: event.target.value })
                  }
                />
              </FormField>
            )}

            {config.parentGuardianRelevant && (
              <FormField
                label="Parent / Guardian"
                htmlFor={`${config.type}-guardian`}
                error={errors.parentGuardian}
                required
              >
                <input
                  id={`${config.type}-guardian`}
                  value={baseValues.parentGuardian}
                  onChange={(event) =>
                    setBaseValues({
                      ...baseValues,
                      parentGuardian: event.target.value,
                    })
                  }
                />
              </FormField>
            )}

            {config.fields.map((field) => (
              <FormField
                label={field.label}
                htmlFor={`${config.type}-${field.name}`}
                error={errors[field.name]}
                required={field.required}
                key={field.name}
                className={field.type === "textarea" ? "full-width" : ""}
              >
                {field.type === "select" && (
                  <select
                    id={`${config.type}-${field.name}`}
                    value={specificValues[field.name] ?? ""}
                    onChange={(event) =>
                      setSpecificValues({
                        ...specificValues,
                        [field.name]: event.target.value,
                      })
                    }
                  >
                    <option value="">Select an option</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === "textarea" && (
                  <textarea
                    id={`${config.type}-${field.name}`}
                    value={specificValues[field.name] ?? ""}
                    onChange={(event) =>
                      setSpecificValues({
                        ...specificValues,
                        [field.name]: event.target.value,
                      })
                    }
                    rows={4}
                  />
                )}

                {(field.type === "text" ||
                  field.type === "number" ||
                  field.type === "date") && (
                  <input
                    id={`${config.type}-${field.name}`}
                    type={field.type}
                    value={specificValues[field.name] ?? ""}
                    onChange={(event) =>
                      setSpecificValues({
                        ...specificValues,
                        [field.name]: event.target.value,
                      })
                    }
                  />
                )}
              </FormField>
            ))}
          </div>
        </fieldset>

        <button className="submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Submit Registration"}
        </button>
      </form>
    </section>
  );
}

export default PlaceholderForm;
