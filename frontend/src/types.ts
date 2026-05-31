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

export type PlayerAccount = {
  playerName: string;
  playerSurname: string;
  idNumber: string;
  dateOfBirth: string;
  age: number | null;
  gender: string;
  guardianName: string;
  guardianEmail: string;
  guardianCell: string;
  medicalAidDetails: string;
  emergencyContact: string;
  allergiesOrConditions: string;
  notifications: string[];
  password: string;
  passportNumber: string;
};

export type ProgrammeType = "academy" | "foundation" | "holiday-camp" | "trial";

export type Programme = {
  id: ProgrammeType;
  title: string;
  category: string;
  price: string;
  description: string;
  requiresTrial: boolean;
  placesAvailable: number;
  capacity: number;
};
