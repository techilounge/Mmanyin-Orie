
export interface Payment {
  id: string; // Firestore document ID
  contributionId: string; // Links payment to a specific CustomContribution
  amount: number;
  date: string; // ISO date string
  month?: number; // For monthly contributions, 0-indexed (0=Jan)
}

export interface Member {
  id: string; // Firestore document ID
  name: string;
  firstName: string;
  middleName: string;
  lastName: string;
  yearOfBirth: number;
  family: string; // Family name, will be used to group, but not a separate collection
  email: string;
  phone: string;
  phoneCountryCode: string; // e.g., '+1'
  age: number;
  tier: string;
  contribution: number;
  payments: Payment[];
  joinDate: string; // ISO date string
  role: 'owner' | 'admin' | 'user';
  status: 'active' | 'invited';
  uid: string | null; // Firebase Auth UID, null if invited but not yet signed up
}

export interface Family {
  id: string; // Family name
  name: string;
}

export interface Settings {
  tier1Age: number;
  tier2Age: number;
  currency: string;
}

export interface CustomContribution {
  id: string; // Firestore document ID
  name: string;
  amount: number;
  description?: string;
  tiers: string[];
  frequency: 'one-time' | 'monthly';
}

export interface AppUser {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    primaryCommunityId?: string;
    createdAt: string;
    lastLoginAt: string;
    memberships?: string[]; // Array of communityIds
}

export interface Community {
    id: string;
    name: string;
    slug: string;
    ownerUid: string;
    timezone: string;
    createdAt: string;
    updatedAt: string;
    subscription: {
        status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
        planId: string | null;
        stripeCustomerId: string | null;
        stripeSubId: string | null;
        currentPeriodEnd: string | null; // ISO date string
    };
}

export interface Invitation {
    communityId: string;
    communityName: string;
    memberId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'user' | 'admin';
    status: 'pending' | 'accepted';
    createdAt: string; // ISO date string
    createdBy: string; // UID of admin/owner
    acceptedAt?: string;
    acceptedByUid?: string;
}


// Data for creating a new document, omitting the ID
export type NewMemberData = Omit<Member, 'id' | 'name' | 'age' | 'tier' | 'contribution' | 'payments' | 'joinDate' | 'role' | 'uid' | 'status'>;
export type NewPaymentData = Omit<Payment, 'id'>;
export type NewCustomContributionData = Omit<CustomContribution, 'id'>;


export type DialogState = 
  | { type: 'add-family' }
  | { type: 'edit-family', family: Family }
  | { type: 'add-member', family?: string }
  | { type: 'edit-member', member: Member }
  | { type: 'record-payment', member: Member, contribution: CustomContribution, month?: number }
  | { type: 'edit-payment', member: Member, contribution: CustomContribution, payment: Payment }
  | { type: 'add-custom-contribution' }
  | { type: 'edit-custom-contribution', contribution: CustomContribution }
  | null;
