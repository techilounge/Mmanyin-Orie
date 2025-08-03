export interface Member {
  id: number;
  name: string;
  firstName: string;
  middleName: string;
  lastName: string;
  yearOfBirth: number;
  family: string;
  email: string;
  phone: string;
  age: number;
  tier: string;
  contribution: number;
  useCustomContribution: boolean;
  customContribution: number | null;
  paidAmount: number;
}

export type Family = string;

export interface Settings {
  tier1Age: number;
  tier2Age: number;
  tier1Contribution: number;
  tier2Contribution: number;
}

export interface CustomContribution {
  id: number;
  name: string;
  amount: number;
  description?: string;
}

export type NewMemberData = Omit<Member, 'id' | 'name' | 'age' | 'tier' | 'contribution' | 'paidAmount'>;

export type NewCustomContributionData = Omit<CustomContribution, 'id'>;
