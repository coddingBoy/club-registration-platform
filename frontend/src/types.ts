export type RegistrationFormValues = {
  playerName: string;
  playerSurname: string;
  dateOfBirth: string;
  birthYearCategory: string;
  idPassportNumber: string;
  birthCertificate: File | null;
  gender: string;
  kitSize: string;
  socksSize: string;
  parentName: string;
  parentSurname: string;
  relationToPlayer: string;
  streetAddress: string;
  city: string;
  province: string;
  contactNumber: string;
  email: string;
  confirmEmail: string;
  medicalAidName: string;
  medicalAidNumber: string;
  mainMemberName: string;
  mainMemberContactNumber: string;
  emergencyContactName: string;
  emergencyRelationToPlayer: string;
  emergencyContactNumber: string;
  allergiesOrConditions: string;
  consent: boolean;
};

export type FormErrors = Partial<Record<keyof RegistrationFormValues, string>>;

export type Option = {
  label: string;
  value: string;
};
