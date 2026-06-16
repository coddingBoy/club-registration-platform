import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { getTrialWindowCapacity } from "../data/trialWindows";
import type {
  TrialApplication,
  TrialRegistration as TrialRegistrationData,
} from "../types";
import {
  getClubInviteTrialLookup,
  postTrialApplication,
  uploadTrialBirthCertificate,
} from "../utils/api";
import { isEmail, isRequired, isTenDigitPhone } from "../utils/validation";
import FormField from "./FormField";

type TrialRegistrationProps = {
  onApplicationSaved: (application: TrialApplication) => void;
  mode?: "new-trial" | "club-invite-trial";
};

const initialValues: TrialRegistrationData = {
  membershipCode: "",
  clubInviteCode: "",
  playerName: "",
  playerSurname: "",
  dateOfBirth: "",
  ageGroup: "",
  gender: "",
  guardianName: "",
  guardianSurname: "",
  guardianRelation: "",
  guardianEmail: "",
  guardianEmailConfirm: "",
  guardianPhone: "",
  province: "",
  allergiesOrConditions: "",
  birthCertificateFileName: "",
};

const provinces = [
  "Western Cape",
  "Eastern Cape",
  "Northern Cape",
  "Gauteng",
  "KwaZulu-Natal",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
];

const relations = ["Father", "Mother", "Guardian", "Grandparent", "Other"];
const genders = ["Male", "Female"];
const maxBirthCertificateSize = 2 * 1024 * 1024;
const allowedBirthCertificateTypes = ["image/jpeg", "application/pdf"];

function TrialRegistration({
  onApplicationSaved,
  mode = "new-trial",
}: TrialRegistrationProps) {
  const [values, setValues] = useState(initialValues);
  const [birthCertificate, setBirthCertificate] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUpInvite, setIsLookingUpInvite] = useState(false);
  const [message, setMessage] = useState("");
  const seasonYear = getTrialSeasonYear();
  const isClubInviteTrial = mode === "club-invite-trial";
  const dateBounds = getTrialDateBounds(seasonYear);

  const ageGroup = useMemo(
    () => getTrialAgeGroup(values.dateOfBirth, seasonYear),
    [seasonYear, values.dateOfBirth],
  );
  const trialCapacity = useMemo(
    () => getTrialWindowCapacity(ageGroup.label),
    [ageGroup.label],
  );
  const trialSpotsRemaining = trialCapacity
    ? Math.max(trialCapacity.capacity - trialCapacity.registeredCount, 0)
    : null;

  const updateValue = (name: keyof TrialRegistrationData, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const updateDateOfBirth = (dateOfBirth: string) => {
    const nextAgeGroup = getTrialAgeGroup(dateOfBirth, seasonYear);
    setValues((current) => ({
      ...current,
      dateOfBirth,
      ageGroup: nextAgeGroup.label,
    }));
    setErrors((current) => ({ ...current, dateOfBirth: "", ageGroup: "" }));
  };

  const lookupClubInvite = async () => {
    const membershipCode = values.membershipCode?.trim() || "";

    if (!membershipCode) {
      setErrors((current) => ({
        ...current,
        membershipCode: "Membership code is required.",
      }));
      return;
    }

    setIsLookingUpInvite(true);
    setMessage("");

    try {
      const invite = await getClubInviteTrialLookup(membershipCode);
      const { playerName, playerSurname } = splitPlayerName(invite.playerName);

      setValues((current) => ({
        ...current,
        membershipCode: invite.membershipCode,
        clubInviteCode: invite.inviteCode,
        playerName: playerName || current.playerName,
        playerSurname: playerSurname || current.playerSurname,
      }));
      setErrors((current) => ({
        ...current,
        membershipCode: "",
        clubInviteCode: "",
        playerName: "",
      }));
      setMessage("Club invite details found. Please complete the remaining trial form.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not find club invite details.",
      );
    } finally {
      setIsLookingUpInvite(false);
    }
  };

  const updateBirthCertificate = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setBirthCertificate(file);
    setValues((current) => ({
      ...current,
      birthCertificateFileName: file?.name ?? "",
    }));
    setErrors((current) => ({ ...current, birthCertificateFileName: "" }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateTrialForm(values, birthCertificate, mode);
    const currentCapacity = getTrialWindowCapacity(values.ageGroup);

    if (
      currentCapacity &&
      currentCapacity.capacity - currentCapacity.registeredCount <= 0
    ) {
      nextErrors.ageGroup = `${values.ageGroup} trial applications are currently full. Please contact the club for assistance.`;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage("Please fix the highlighted fields before saving.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const result = await postTrialApplication(values);
      const document = birthCertificate
        ? await uploadTrialBirthCertificate(result.trialApplication.id, birthCertificate)
        : null;

      const application: TrialApplication = {
        ...values,
        id: result.trialApplication.id,
        submittedAt: result.trialApplication.createdAt,
        status: mapTrialStatus(result.trialApplication.status),
        paymentConfirmed: false,
        membershipNumber: result.membershipNumber,
        birthCertificateDocumentId: document?.id,
        birthCertificateFileUrl: document?.fileUrl,
        emailStatus: result.emailStatus,
        emailError: result.emailError ?? undefined,
        emailSentAt: result.emailSentAt,
      };

      onApplicationSaved(application);
      setValues(initialValues);
      setBirthCertificate(null);
      setMessage(
        isClubInviteTrial
          ? `Club invite trial application saved. Membership number ${result.membershipNumber} is waiting for admin verification.`
          : `Trial application saved. Membership number ${result.membershipNumber} was created. The application is waiting for admin verification.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Trial application failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="form-card">
      <form className="registration-form" onSubmit={handleSubmit} noValidate>
        {message && <p className="success-message">{message}</p>}

        {isClubInviteTrial && (
          <fieldset className="form-section">
            <legend>Club Invite Details</legend>
            <div className="section-grid">
              <FormField
                label="Membership Code"
                htmlFor="clubInviteMembershipCode"
                error={errors.membershipCode}
                required
              >
                <input
                  id="clubInviteMembershipCode"
                  value={values.membershipCode || ""}
                  onChange={(event) =>
                    updateValue("membershipCode", event.target.value)
                  }
                  placeholder="Example: MEM-123456"
                />
              </FormField>
              <FormField
                label="Club Invite Trial Code"
                htmlFor="clubInviteCode"
                error={errors.clubInviteCode}
                required
              >
                <input
                  id="clubInviteCode"
                  value={values.clubInviteCode || ""}
                  onChange={(event) =>
                    updateValue("clubInviteCode", event.target.value)
                  }
                  placeholder="Code fills after lookup"
                  disabled
                />
                <span className="field-hint">
                  This is locked from the membership lookup.
                </span>
              </FormField>
              <div className="form-actions full-width">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={lookupClubInvite}
                  disabled={isLookingUpInvite}
                >
                  {isLookingUpInvite ? "Looking up..." : "Lookup Invite"}
                </button>
              </div>
            </div>
          </fieldset>
        )}

        <fieldset className="form-section">
          <legend>Player Details</legend>
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
                onChange={(event) => updateValue("playerName", event.target.value)}
                disabled={isClubInviteTrial}
              />
              {isClubInviteTrial && (
                <span className="field-hint">
                  This is locked from the club invite lookup.
                </span>
              )}
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
                onChange={(event) => updateValue("playerSurname", event.target.value)}
              />
            </FormField>
            <FormField
              label="Date of Birth"
              htmlFor="trialDob"
              error={errors.dateOfBirth || errors.ageGroup}
              required
            >
              <input
                id="trialDob"
                type="date"
                min={dateBounds.min}
                max={dateBounds.max}
                value={values.dateOfBirth}
                onChange={(event) => updateDateOfBirth(event.target.value)}
              />
              <span className="field-hint highlighted-field-hint">
                {ageGroup.label
                  ? `${seasonYear} age group: ${ageGroup.label}`
                  : `Select a date of birth to calculate the ${seasonYear} age group.`}
              </span>
              <div className="age-group-reminder" role="note">
                <strong>Age group reminder</strong>
                <span>
                  The system calculates the age group from the player's birth year for the {seasonYear} season. Please check the result before saving.
                </span>
              </div>
              {ageGroup.label && ageGroup.label !== "Outside Trial Age Groups" && (
                <div className="trial-capacity-note" role="status">
                  <strong>Trial places</strong>
                  {trialCapacity ? (
                    <span>
                      {trialSpotsRemaining} of {trialCapacity.capacity} places remaining for{" "}
                      {ageGroup.label}.
                    </span>
                  ) : (
                    <span>Capacity for {ageGroup.label} is still to be confirmed.</span>
                  )}
                </div>
              )}
            </FormField>
            <FormField label="Gender" htmlFor="trialGender" error={errors.gender} required>
              <select
                id="trialGender"
                value={values.gender}
                onChange={(event) => updateValue("gender", event.target.value)}
              >
                <option value="">Select gender</option>
                {genders.map((gender) => (
                  <option value={gender} key={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label="Upload Birth Certificate"
              htmlFor="trialBirthCertificate"
              error={errors.birthCertificateFileName}
              required
            >
              <input
                id="trialBirthCertificate"
                type="file"
                accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf"
                onChange={updateBirthCertificate}
              />
              <span className="field-hint">
                JPEG or PDF only. Maximum file size 2MB.
              </span>
            </FormField>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Parent / Guardian Details</legend>
          <div className="section-grid">
            <FormField
              label="Guardian Name"
              htmlFor="trialGuardian"
              error={errors.guardianName}
              required
            >
              <input
                id="trialGuardian"
                value={values.guardianName}
                onChange={(event) => updateValue("guardianName", event.target.value)}
              />
            </FormField>
            <FormField
              label="Guardian Surname"
              htmlFor="trialGuardianSurname"
              error={errors.guardianSurname}
              required
            >
              <input
                id="trialGuardianSurname"
                value={values.guardianSurname}
                onChange={(event) =>
                  updateValue("guardianSurname", event.target.value)
                }
              />
            </FormField>
            <FormField
              label="Relationship to Player"
              htmlFor="trialRelation"
              error={errors.guardianRelation}
              required
            >
              <select
                id="trialRelation"
                value={values.guardianRelation}
                onChange={(event) => updateValue("guardianRelation", event.target.value)}
              >
                <option value="">Select relationship</option>
                {relations.map((relation) => (
                  <option value={relation} key={relation}>
                    {relation}
                  </option>
                ))}
              </select>
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
                onChange={(event) => updateValue("guardianEmail", event.target.value)}
              />
            </FormField>
            <FormField
              label="Confirm Email Address"
              htmlFor="trialEmailConfirm"
              error={errors.guardianEmailConfirm}
              required
            >
              <input
                id="trialEmailConfirm"
                type="email"
                value={values.guardianEmailConfirm}
                onChange={(event) =>
                  updateValue("guardianEmailConfirm", event.target.value)
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
                  updateValue("guardianPhone", event.target.value.replace(/\D/g, ""))
                }
              />
            </FormField>
            <FormField
              label="Province"
              htmlFor="trialProvince"
              error={errors.province}
              required
            >
              <select
                id="trialProvince"
                value={values.province}
                onChange={(event) => updateValue("province", event.target.value)}
              >
                <option value="">Select province</option>
                {provinces.map((province) => (
                  <option value={province} key={province}>
                    {province}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label="Allergies or Medical Conditions"
              htmlFor="trialMedical"
              error={errors.allergiesOrConditions}
              className="full-width"
              required
            >
              <textarea
                id="trialMedical"
                rows={4}
                value={values.allergiesOrConditions}
                onChange={(event) =>
                  updateValue("allergiesOrConditions", event.target.value)
                }
              />
            </FormField>
          </div>
        </fieldset>

        {!isClubInviteTrial && (
          <div className="payment-note">
            <strong>Trial fee notice</strong>
            <p>R500 trial payment is not refundable.</p>
          </div>
        )}

        <button className="submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Save Trial Application"}
        </button>
      </form>
    </section>
  );
}

function validateTrialForm(
  values: TrialRegistrationData,
  birthCertificate: File | null,
  mode: TrialRegistrationProps["mode"] = "new-trial",
) {
  const nextErrors: Record<string, string> = {};
  const isClubInviteTrial = mode === "club-invite-trial";

  if (isClubInviteTrial && !isRequired(values.membershipCode || "")) {
    nextErrors.membershipCode = "Membership code is required.";
  }
  if (isClubInviteTrial && !isRequired(values.clubInviteCode || "")) {
    nextErrors.clubInviteCode = "Club invite trial code is required.";
  }

  if (!isRequired(values.playerName)) nextErrors.playerName = "Player name is required.";
  if (!isRequired(values.playerSurname)) {
    nextErrors.playerSurname = "Player surname is required.";
  }
  if (!isRequired(values.dateOfBirth)) {
    nextErrors.dateOfBirth = "Date of birth is required.";
  } else if (!values.ageGroup) {
    nextErrors.ageGroup = "Date of birth does not match a supported trial age group.";
  } else if (values.ageGroup === "Outside Trial Age Groups") {
    nextErrors.ageGroup = "Date of birth is outside the supported trial age groups.";
  }
  if (!isRequired(values.gender)) nextErrors.gender = "Gender is required.";
  if (!isRequired(values.guardianName)) {
    nextErrors.guardianName = "Guardian name is required.";
  }
  if (!isRequired(values.guardianSurname)) {
    nextErrors.guardianSurname = "Guardian surname is required.";
  }
  if (!isRequired(values.guardianRelation)) {
    nextErrors.guardianRelation = "Relationship is required.";
  }
  if (!isEmail(values.guardianEmail)) {
    nextErrors.guardianEmail = "Enter a valid guardian email.";
  }
  if (!isEmail(values.guardianEmailConfirm)) {
    nextErrors.guardianEmailConfirm = "Confirm the guardian email.";
  } else if (values.guardianEmail !== values.guardianEmailConfirm) {
    nextErrors.guardianEmailConfirm = "Email addresses must match.";
  }
  if (!isTenDigitPhone(values.guardianPhone)) {
    nextErrors.guardianPhone = "Enter a 10 digit phone number.";
  }
  if (!isRequired(values.province)) nextErrors.province = "Province is required.";
  if (!isRequired(values.allergiesOrConditions)) {
    nextErrors.allergiesOrConditions = "Enter allergies, conditions, or write None.";
  }

  if (!birthCertificate) {
    nextErrors.birthCertificateFileName = "Birth certificate is required.";
  } else if (!allowedBirthCertificateTypes.includes(birthCertificate.type)) {
    nextErrors.birthCertificateFileName = "Upload a JPEG or PDF file.";
  } else if (birthCertificate.size > maxBirthCertificateSize) {
    nextErrors.birthCertificateFileName = "File must be 2MB or smaller.";
  }

  return nextErrors;
}

function splitPlayerName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    playerName: parts[0] || "",
    playerSurname: parts.slice(1).join(" "),
  };
}

function getTrialAgeGroup(dateOfBirth: string, seasonYear: number) {
  if (!dateOfBirth) return { label: "", birthYear: null };

  const birthYear = new Date(dateOfBirth).getFullYear();
  const ranges = [
    { label: "Under 18", years: [seasonYear - 18, seasonYear - 17] },
    { label: "Under 16", years: [seasonYear - 16, seasonYear - 15] },
    { label: "Under 14", years: [seasonYear - 14, seasonYear - 13] },
    { label: "Under 12", years: [seasonYear - 12, seasonYear - 11] },
  ];

  const matchedRange = ranges.find(({ years }) => years.includes(birthYear));

  if (matchedRange) return { label: matchedRange.label, birthYear };
  if (birthYear >= seasonYear - 10 && birthYear <= seasonYear - 8) {
    return { label: "Little Warriors Programme", birthYear };
  }
  if (birthYear >= seasonYear - 7) {
    return { label: "First Touch Programme", birthYear };
  }

  return { label: "Outside Trial Age Groups", birthYear };
}

function getTrialSeasonYear() {
  return new Date().getFullYear();
}

function getTrialDateBounds(seasonYear: number) {
  const earliestYear = seasonYear - 18;
  const today = new Date();
  const latestDate =
    today.getFullYear() === seasonYear
      ? today
      : new Date(`${seasonYear}-12-31T00:00:00`);

  return {
    min: `${earliestYear}-01-01`,
    max: latestDate.toISOString().slice(0, 10),
  };
}

function mapTrialStatus(status: string): TrialApplication["status"] {
  if (status === "PAYMENT_PENDING") return "payment-pending";
  if (status === "SUCCESSFUL") return "successful";
  if (status === "UNSUCCESSFUL") return "unsuccessful";
  return "paid";
}

export default TrialRegistration;
