
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
  family: string; // Family name, will be used to group, but not a separate collection
  gender: 'male' | 'female';
  isPatriarch: boolean;
  email: string;
  phone: string;
  phoneCountryCode: string; // e.g., '+1'
  tier: string; // This now directly captures the age group, e.g., "Group 1 (18-24)"
  contribution: number;
  payments: Payment[];
  joinDate: string; // ISO date string
  role: 'owner' | 'admin' | 'user';
  status: 'active' | 'invited';
  uid: string | null; // Firebase Auth UID, null if invited but not yet signed up
  // The following are added when accepting an invite, to satisfy security rules
  inviteId?: string;
  inviteCode?: string;
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
    createdAt: any;
    lastLoginAt: any;
    memberships?: string[]; // Array of communityIds
}

export interface Community {
    id: string;
    name: string;
    slug: string;
    ownerUid: string;
    timezone: string;
    createdAt: any;
    updatedAt: any;
    subscription: {
        status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
        planId: string | null;
        stripeCustomerId: string | null;
        stripeSubId: string | null;
        currentPeriodEnd: any; // Can be null or a timestamp
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
    code: string; // The secret code for this invite
    createdAt: any;
    createdBy: string; // UID of admin/owner
    acceptedAt?: any;
    acceptedByUid?: string;
}


// Data for creating a new document, omitting the ID
export type NewMemberData = Omit<Member, 'id' | 'name' | 'contribution' | 'payments' | 'joinDate' | 'role' | 'uid' | 'status'>;
export type NewPaymentData = Omit<Payment, 'id'>;
export type NewCustomContributionData = Omit<CustomContribution, 'id'>;


export type DialogState = 
  | { type: 'add-family' }
  | { type: 'edit-family', family: Family }
  | { type: 'invite-member', family?: string }
  | { type: 'add-member-to-family', family: string }
  | { type: 'edit-member', member: Member }
  | { type: 'record-payment', member: Member, contribution: CustomContribution, month?: number }
  | { type: 'edit-payment', member: Member, contribution: CustomContribution, payment: Payment }
  | { type: 'add-custom-contribution' }
  | { type: 'edit-custom-contribution', contribution: CustomContribution }
  | { type: 'resend-invite', member: Member }
  | null;
