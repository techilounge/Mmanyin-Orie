
'use client';
import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Member, Family, Settings, CustomContribution, NewMemberData, NewCustomContributionData, DialogState, NewPaymentData, Payment, Invitation, AgeGroup } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getMonth, getYear } from 'date-fns';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { sendInvitationEmail } from '@/lib/email';

interface CommunityContextType {
  members: Member[];
  families: Family[];
  settings: Settings;
  customContributions: CustomContribution[];
  isLoading: boolean;
  communityId: string | null;
  communityName: string;
  updateCommunityName: (newName: string) => Promise<void>;
  
  addMember: (newMemberData: NewMemberData) => Promise<void>;
  inviteMember: (newMemberData: NewMemberData, newFamilyName?: string) => Promise<boolean>;
  getInviteLink: (memberId: string) => Promise<string | null>;
  resendInvitation: (member: Member) => Promise<void>;
  updateMember: (updatedMemberData: Member) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  
  addFamily: (patriarchFirstName: string, patriarchLastName: string, patriarchTier: string) => Promise<boolean>;
  updateFamily: (family: Family, newFamilyName: string) => Promise<void>;
  deleteFamily: (family: Family) => Promise<void>;
  
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  addAgeGroup: (name: string) => Promise<void>;
  updateAgeGroup: (id: string, name: string) => Promise<void>;
  deleteAgeGroup: (id: string) => Promise<void>;
  
  addCustomContribution: (contributionData: NewCustomContributionData) => Promise<void>;
  updateCustomContribution: (updatedContribution: CustomContribution) => Promise<void>;
  deleteCustomContribution: (id: string) => Promise<void>;

  recordPayment: (memberId: string, contributionId: string, paymentData: Omit<NewPaymentData, 'contributionId'>) => Promise<void>;
  updatePayment: (memberId: string, updatedPayment: Payment) => Promise<void>;
  deletePayment: (memberId: string, paymentId: string) => Promise<void>;

  dialogState: DialogState;
  openDialog: (state: DialogState) => void;
  closeDialog: () => void;

  getContribution: (member: Omit<Member, 'id' | 'contribution'>, currentCustomContributions: CustomContribution[]) => number;
  getPaidAmount: (member: Member) => number;
  getBalance: (member: Member) => number;
  getPaidAmountForContribution: (member: Member, contributionId: string, month?: number) => number;
  getBalanceForContribution: (member: Member, contribution: CustomContribution, month?: number) => number;
}

export const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = {
  tier1Age: 18,
  tier2Age: 25,
  currency: '₦',
  ageGroups: [],
};

// Helper to generate a random string for the invite code
const generateInviteCode = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};


export function CommunityProvider({ children, communityId: activeCommunityId }: { children: ReactNode, communityId: string | null }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [customContributions, setCustomContributions] = useState<CustomContribution[]>([]);
  const [communityName, setCommunityName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<DialogState>(null);

  const openDialog = (state: DialogState) => setDialogState(state);
  const closeDialog = () => setDialogState(null);

  // Set up Firestore listeners
  useEffect(() => {
    if (!activeCommunityId || !user) {
        setIsLoading(!user); 
        setMembers([]);
        setFamilies([]);
        setCustomContributions([]);
        setSettings(DEFAULT_SETTINGS);
        setCommunityName('');
        return;
    }
    
    setIsLoading(true);

    const communityDocRef = doc(db, 'communities', activeCommunityId);
    
    const unsubscribes = [
      onSnapshot(collection(communityDocRef, 'members'), (snapshot) => {
        const fetchedMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        setMembers(fetchedMembers);
      }, (error) => {
        console.error("Error in 'members' listener:", error);
      }),
      onSnapshot(collection(communityDocRef, 'families'), (snapshot) => {
        const fetchedFamilies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Family));
        setFamilies(fetchedFamilies);
      }, (error) => {
        console.error("Error in 'families' listener:", error);
      }),
      onSnapshot(collection(communityDocRef, 'contributions'), (snapshot) => {
        const fetchedContributions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomContribution));
        setCustomContributions(fetchedContributions);
      }, (error) => {
        console.error("Error in 'contributions' listener:", error);
      }),
      onSnapshot(communityDocRef, (snapshot) => {
        if (snapshot.exists()) {
            const communityData = snapshot.data();
            const fetchedSettings = {
                tier1Age: communityData.tier1Age || DEFAULT_SETTINGS.tier1Age,
                tier2Age: communityData.tier2Age || DEFAULT_SETTINGS.tier2Age,
                currency: communityData.currency || DEFAULT_SETTINGS.currency,
                ageGroups: communityData.ageGroups || DEFAULT_SETTINGS.ageGroups,
            };
            setSettings(fetchedSettings);
            setCommunityName(communityData.name || '');
        }
      }, (error) => {
        console.error("Error in 'community' listener:", error);
      })
    ];
    
    const timer = setTimeout(() => setIsLoading(false), 300);

    return () => {
        unsubscribes.forEach(unsub => unsub());
        clearTimeout(timer);
    };

  }, [activeCommunityId, user]);

 const getContribution = useCallback((member: Omit<Member, 'id' | 'contribution'>, currentCustomContributions: CustomContribution[]) => {
    const applicableContributions = currentCustomContributions.filter(c => c.tiers.includes(member.tier || ''));
    
    return applicableContributions.reduce((sum, c) => {
        if (c.frequency === 'monthly') {
            const joinDate = new Date(member.joinDate);
            const now = new Date();
            let months = 0;
            if (getYear(now) > getYear(joinDate)) {
               months = (getYear(now) - getYear(joinDate) - 1) * 12 + (12 - getMonth(joinDate)) + (getMonth(now) + 1);
            } else {
               months = getMonth(now) - getMonth(joinDate) + 1;
            }
            return sum + (c.amount * Math.max(0, months));
        }
        return sum + c.amount;
    }, 0);
  }, []);

  const getPaidAmount = useCallback((member: Member) => {
    if (!member.payments) return 0;
    return member.payments.reduce((sum, p) => sum + p.amount, 0);
  }, []);

  const getBalance = useCallback((member: Member) => {
    const contribution = member.contribution || 0;
    return contribution - getPaidAmount(member);
  }, [getPaidAmount]);

  const getPaidAmountForContribution = (member: Member, contributionId: string, month?: number) => {
    if (!member.payments) return 0;
    return member.payments
      .filter(p => {
        const matchesContribution = p.contributionId === contributionId;
        if (month === undefined) return matchesContribution;
        const pDate = new Date(p.date);
        const pMonth = getMonth(pDate);
        return matchesContribution && (p.month === month || pMonth === month);
      })
      .reduce((sum, p) => sum + p.amount, 0);
  }

  const getBalanceForContribution = (member: Member, contribution: CustomContribution, month?: number) => {
    const paid = getPaidAmountForContribution(member, contribution.id, month);
    if (contribution.frequency === 'monthly') {
      return contribution.amount - paid;
    }
    const totalOwedForOneTime = contribution.amount;
    return totalOwedForOneTime - paid;
  }
  
  const addFamily = async (patriarchFirstName: string, patriarchLastName: string, patriarchTier: string): Promise<boolean> => {
    if (!activeCommunityId) {
        toast({ variant: 'destructive', title: 'Error', description: 'No community selected.' });
        return false;
    }
    const trimmedFirstName = patriarchFirstName.trim();
    const trimmedLastName = patriarchLastName.trim();
    const familyName = `${trimmedFirstName} ${trimmedLastName}`;

    if (!trimmedFirstName || !trimmedLastName || !patriarchTier) {
        toast({ variant: 'destructive', title: 'Error', description: 'All fields are required.' });
        return false;
    }
    const familiesQuery = query(collection(db, `communities/${activeCommunityId}/families`), where('name', '==', familyName));
    const querySnapshot = await getDocs(familiesQuery);
    if (!querySnapshot.empty) {
        toast({ variant: 'destructive', title: 'Error', description: `Family "${familyName}" already exists.` });
        return false;
    }

    try {
        const batch = writeBatch(db);

        // 1. Create the family document
        const familyDocRef = doc(collection(db, `communities/${activeCommunityId}/families`));
        batch.set(familyDocRef, { name: familyName });

        // 2. Create the patriarch member document
        const joinDate = new Date().toISOString();

        const patriarchMemberBase = {
            name: familyName,
            firstName: trimmedFirstName,
            middleName: '',
            lastName: trimmedLastName,
            family: familyName,
            gender: 'male' as const,
            isPatriarch: true,
            email: '',
            phone: '',
            phoneCountryCode: '',
            tier: patriarchTier,
            payments: [],
            joinDate: joinDate,
            role: 'user' as const,
            status: 'active' as const,
            uid: doc(collection(db, 'dummy')).id, // Placeholder
        };

        const contribution = getContribution(patriarchMemberBase, customContributions);
        const patriarchMember = { ...patriarchMemberBase, contribution };
        
        const memberDocRef = doc(collection(db, `communities/${activeCommunityId}/members`));
        batch.set(memberDocRef, patriarchMember);

        await batch.commit();
        toast({ title: 'Family Created', description: `The "${familyName}" family has been added with ${trimmedFirstName} as the head.` });
        return true;
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
        return false;
    }
};

  const updateFamily = async (family: Family, newFamilyName: string) => {
    if (!activeCommunityId) return;
    const trimmedNewName = newFamilyName.trim();
    if (!trimmedNewName) {
        toast({ variant: "destructive", title: "Error", description: "Family name cannot be empty." });
        return;
    }
    
    // As family name is now derived from patriarch, this function should update the patriarch's name,
    // which in turn updates the family name for all members.
    // For now, we prevent direct editing of family name. The logic should be tied to editing the patriarch member.
    toast({
        variant: "default",
        title: "Info",
        description: "To change the family name, please edit the details of the family head."
    });
    closeDialog();
  };

  const deleteFamily = async (family: Family) => {
    if (!activeCommunityId) return;
    const batch = writeBatch(db);
  
    try {
      // 1. Query for all members of the family
      const membersQuery = query(
        collection(db, `communities/${activeCommunityId}/members`),
        where("family", "==", family.name)
      );
      const membersSnapshot = await getDocs(membersQuery);
  
      // 2. Delete each member in the family
      membersSnapshot.forEach((memberDoc) => {
        batch.delete(memberDoc.ref);
      });
  
      // 3. Delete the family document itself
      const familyDocRef = doc(db, `communities/${activeCommunityId}/families`, family.id);
      batch.delete(familyDocRef);
  
      // 4. Commit all batched writes
      await batch.commit();
      
      toast({
        title: "Family Deleted",
        description: `The "${family.name}" family and all its members have been removed.`,
      });
    } catch (error: any) {
      console.error("Failed to delete family:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: `Could not delete the family. ${error.message}`,
      });
    }
  };

  const getInviteLink = useCallback(async (memberId: string): Promise<string | null> => {
    if (!activeCommunityId) return null;
    try {
        const memberDocRef = doc(db, 'communities', activeCommunityId, 'members', memberId);
        const memberSnap = await getDoc(memberDocRef);

        if (!memberSnap.exists()) {
            console.error(`Member with ID ${memberId} not found.`);
            return null;
        }

        const memberData = memberSnap.data() as Member;
        const inviteId = memberData?.inviteId;
        const memberStatus = memberData?.status;

        if (!inviteId) {
            console.error(`No inviteId found for member ${memberId}.`);
            // This is not a user-facing error, but a data integrity issue.
            // We'll return null and let the UI handle it gracefully.
            return null;
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        return `${appUrl}/auth/accept-invite?token=${inviteId}`;

    } catch (error: any) {
        console.error("Error getting invite link:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred while retrieving the link.' });
        return null;
    }
  }, [activeCommunityId, toast]);
  
  const addMember = async (data: NewMemberData) => {
    if (!activeCommunityId) return;

    try {
        const fullName = [data.firstName, data.middleName, data.lastName]
            .filter(part => part && part.trim())
            .join(' ');
        
        const joinDate = new Date().toISOString();

        const memberBase = {
            name: fullName,
            firstName: data.firstName,
            middleName: data.middleName || '',
            lastName: data.lastName,
            family: data.family,
            email: data.email || '',
            phone: data.phone || '',
            phoneCountryCode: data.phoneCountryCode || '',
            gender: data.gender,
            tier: data.tier,
            payments: [],
            joinDate: joinDate,
            role: 'user' as const,
            status: 'active' as const, // Add member directly as active
            uid: null,
            isPatriarch: data.isPatriarch,
        };
        
        const contribution = getContribution(memberBase, customContributions);
        const newMember = { ...memberBase, contribution };
        
        await addDoc(collection(db, `communities/${activeCommunityId}/members`), newMember);

        toast({ title: "Member Added", description: `${fullName} has been added to the registry.` });
        closeDialog();
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error adding member", description: error.message });
    }
  };

  const inviteMember = async (data: NewMemberData, newFamilyName?: string): Promise<boolean> => {
    if (!activeCommunityId || !user || !data.email) {
      if (!data.email) {
        toast({ variant: "destructive", title: "Email Required", description: "An email is required to invite a member." });
      }
      return false;
    }
    
    try {
        const batch = writeBatch(db);

        // If a new family is being created, add it to the families collection
        let familyToUse = data.family;
        if (newFamilyName && newFamilyName.trim() && data.family === 'new') {
            familyToUse = newFamilyName.trim();
            const familyDocRef = doc(collection(db, `communities/${activeCommunityId}/families`));
            batch.set(familyDocRef, { name: familyToUse });
        }

        const fullName = [data.firstName, data.middleName, data.lastName]
            .filter(part => part && part.trim())
            .join(' ');
        
        const joinDate = new Date().toISOString();

        const memberDocRef = doc(collection(db, `communities/${activeCommunityId}/members`));
        const inviteDocRef = doc(collection(db, 'invitations'));
        
        const newMemberBase = {
            name: fullName,
            firstName: data.firstName,
            middleName: data.middleName || '',
            lastName: data.lastName,
            family: familyToUse,
            email: data.email,
            phone: data.phone || '',
            phoneCountryCode: data.phoneCountryCode || '',
            gender: data.gender,
            tier: data.tier,
            payments: [],
            joinDate: joinDate,
            role: 'user' as const,
            status: 'invited' as const,
            uid: null,
            isPatriarch: data.isPatriarch,
            inviteId: inviteDocRef.id,
        };
        
        const contribution = getContribution(newMemberBase, customContributions);
        const newMember = { ...newMemberBase, contribution };
        
        batch.set(memberDocRef, newMember);

        const newInvitation: Invitation = {
            communityId: activeCommunityId,
            communityName: communityName,
            memberId: memberDocRef.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: 'user',
            status: 'pending',
            code: generateInviteCode(),
            createdAt: new Date().toISOString(),
            createdBy: user.uid,
        };

        batch.set(inviteDocRef, newInvitation);

        await batch.commit();
        
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const inviteLink = `${appUrl}/auth/accept-invite?token=${inviteDocRef.id}`;

        // Send email using Resend
        await sendInvitationEmail({
          to: data.email,
          communityName: communityName,
          inviteLink: inviteLink,
          inviterName: user.displayName || 'The community admin'
        });

        toast({ 
            title: "Invitation Sent", 
            description: `An invitation email has been sent to ${fullName}.`
        });
        return true;

    } catch(error: any) {
        toast({ variant: "destructive", title: "Error inviting member", description: error.message });
        return false;
    }
  };

  const resendInvitation = async (member: Member) => {
    if (!user || !member.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'Member does not have an email to send an invitation to.' });
      return;
    }
    try {
      const inviteLink = await getInviteLink(member.id);
      
      if (!inviteLink) {
        toast({ variant: 'destructive', title: 'No Invitation Found', description: 'This member may have already accepted their invite, or no invite was created.' });
        return;
      }
      
      await sendInvitationEmail({
        to: member.email,
        communityName: communityName,
        inviteLink: inviteLink,
        inviterName: user.displayName || 'The community admin',
      });
      toast({ title: 'Invitation Resent', description: `An invitation email has been sent to ${member.name}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to Resend', description: error.message });
    }
  };

  const updateMember = async (updatedData: Member) => {
    if (!activeCommunityId) return;
    try {
      const fullName = [updatedData.firstName, updatedData.middleName, updatedData.lastName]
        .filter(part => part && part.trim())
        .join(' ');
      
      const tempMemberForCalc = {
        ...updatedData,
        name: fullName,
        tier: updatedData.tier,
        joinDate: updatedData.joinDate,
        payments: updatedData.payments || [],
        email: updatedData.email || '',
        phone: updatedData.phone || '',
        phoneCountryCode: updatedData.phoneCountryCode || '',
        role: updatedData.role,
        uid: updatedData.uid,
        status: updatedData.status
      };
      const newContribution = getContribution(tempMemberForCalc, customContributions);
  
      const memberToUpdate = {
          ...updatedData,
          name: fullName,
          tier: updatedData.tier,
          contribution: newContribution
      };

      const batch = writeBatch(db);

       // If creating a new family, add it to the families collection first
      if (updatedData.family && !families.find(f => f.name === updatedData.family)) {
        const familyDocRef = doc(collection(db, `communities/${activeCommunityId}/families`));
        batch.set(familyDocRef, { name: updatedData.family });
      }

      const memberDocRef = doc(db, `communities/${activeCommunityId}/members`, updatedData.id);
      const { id, ...dataToSend } = memberToUpdate;
      batch.update(memberDocRef, dataToSend);

      // If the patriarch's name is changing, update the family name and all members' family field
      if (updatedData.isPatriarch) {
          const oldFamilyName = updatedData.family;
          const newFamilyName = fullName;

          if (oldFamilyName !== newFamilyName) {
              // Find the family document to update its name
              const familiesQuery = query(collection(db, `communities/${activeCommunityId}/families`), where("name", "==", oldFamilyName));
              const familiesSnapshot = await getDocs(familiesQuery);
              if (!familiesSnapshot.empty) {
                  const familyDocRef = familiesSnapshot.docs[0].ref;
                  batch.update(familyDocRef, { name: newFamilyName });
              }

              // Update all members of the old family to the new family name
              const membersQuery = query(collection(db, `communities/${activeCommunityId}/members`), where("family", "==", oldFamilyName));
              const membersSnapshot = await getDocs(membersQuery);
              membersSnapshot.forEach(memberDoc => {
                  batch.update(memberDoc.ref, { family: newFamilyName });
              });
          }
      }

      await batch.commit();
      closeDialog();
      toast({ title: "Member Updated", description: `${fullName}'s details have been updated.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error updating member", description: error.message });
    }
  };

  const deleteMember = async (id: string) => {
    if (!activeCommunityId) return;
    try {
        const memberDocRef = doc(db, `communities/${activeCommunityId}/members`, id);
        const memberSnap = await getDoc(memberDocRef);
        const memberData = memberSnap.data();
        if (memberData?.isPatriarch) {
            toast({ variant: "destructive", title: "Action Not Allowed", description: "The head of the family cannot be deleted. You must delete the entire family instead." });
            return;
        }

        const memberName = memberData?.name || 'Member';
        await deleteDoc(memberDocRef);
        toast({ title: "Member Deleted", description: `${memberName} has been removed.` });
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error deleting member", description: error.message });
    }
  };

  const recordPayment = async (memberId: string, contributionId: string, paymentData: Omit<NewPaymentData, 'contributionId'>) => {
    if (!activeCommunityId) return;
    try {
        const memberDocRef = doc(db, `communities/${activeCommunityId}/members`, memberId);
        const memberSnapshot = await getDoc(memberDocRef);
        if (memberSnapshot.exists()) {
            const memberData = memberSnapshot.data() as Member;
            const newPayment: Partial<Payment> = { 
                id: doc(collection(db, 'dummy')).id, // Generate a client-side ID
                contributionId,
                amount: paymentData.amount,
                date: paymentData.date,
            };

            if (paymentData.month !== undefined) {
                newPayment.month = paymentData.month;
            }

            const updatedPayments = [...(memberData.payments || []), newPayment as Payment];
            await updateDoc(memberDocRef, { payments: updatedPayments });
            
            const memberName = memberData.name || 'Member';
            const contributionName = customContributions.find(c => c.id === contributionId)?.name || 'Contribution';
            toast({ title: "Payment Recorded", description: `Payment of ${settings.currency}${paymentData.amount} for ${memberName} towards ${contributionName} has been recorded.` });
            closeDialog();
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error recording payment", description: error.message });
    }
  };

  const updatePayment = async (memberId: string, updatedPayment: Payment) => {
     if (!activeCommunityId) return;
     try {
        const memberDocRef = doc(db, `communities/${activeCommunityId}/members`, memberId);
        const memberSnapshot = await getDoc(memberDocRef);
        if(memberSnapshot.exists()) {
            const memberData = memberSnapshot.data() as Member;
            const updatedPayments = (memberData.payments || []).map(p => p.id === updatedPayment.id ? updatedPayment : p);
            await updateDoc(memberDocRef, { payments: updatedPayments });
            toast({ title: "Payment Updated", description: `Payment details have been updated.` });
            closeDialog();
        }
     } catch (error: any) {
        toast({ variant: "destructive", title: "Error updating payment", description: error.message });
     }
  };

  const deletePayment = async (memberId: string, paymentId: string) => {
     if (!activeCommunityId) return;
      try {
        const memberDocRef = doc(db, `communities/${activeCommunityId}/members`, memberId);
        const memberSnapshot = await getDoc(memberDocRef);
        if(memberSnapshot.exists()) {
            const memberData = memberSnapshot.data() as Member;
            const updatedPayments = (memberData.payments || []).filter(p => p.id !== paymentId);
            await updateDoc(memberDocRef, { payments: updatedPayments });
            toast({ title: "Payment Deleted", description: `The payment has been removed.` });
        }
     } catch (error: any) {
        toast({ variant: "destructive", title: "Error deleting payment", description: error.message });
     }
  };
  
  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!activeCommunityId) return;
    try {
        const communityDocRef = doc(db, 'communities', activeCommunityId);
        await updateDoc(communityDocRef, newSettings);
        toast({ title: "Settings Updated", description: "Membership settings have been saved." });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error updating settings", description: error.message });
    }
  };

  const addAgeGroup = async (name: string) => {
    if (!activeCommunityId || !name.trim()) return;
    const newAgeGroup: AgeGroup = { id: doc(collection(db, 'dummy')).id, name: name.trim() };
    try {
        const communityDocRef = doc(db, 'communities', activeCommunityId);
        const communitySnap = await getDoc(communityDocRef);
        if (communitySnap.exists()) {
            const currentGroups = communitySnap.data().ageGroups || [];
            const updatedGroups = [...currentGroups, newAgeGroup];
            await updateDoc(communityDocRef, { ageGroups: updatedGroups });
            toast({ title: "Age Group Added", description: `"${name}" has been added.`});
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: "Could not add age group."});
    }
  };

  const updateAgeGroup = async (id: string, name: string) => {
    if (!activeCommunityId || !name.trim()) return;
    try {
        const communityDocRef = doc(db, 'communities', activeCommunityId);
        const communitySnap = await getDoc(communityDocRef);
        if (communitySnap.exists()) {
            const currentGroups = communitySnap.data().ageGroups || [];
            const updatedGroups = currentGroups.map((g: AgeGroup) => g.id === id ? { ...g, name: name.trim() } : g);
            await updateDoc(communityDocRef, { ageGroups: updatedGroups });
            toast({ title: "Age Group Updated" });
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: "Could not update age group."});
    }
  };

  const deleteAgeGroup = async (id: string) => {
    if (!activeCommunityId) return;
    try {
        const communityDocRef = doc(db, 'communities', activeCommunityId);
        const communitySnap = await getDoc(communityDocRef);
        if (communitySnap.exists()) {
            const currentGroups = communitySnap.data().ageGroups || [];
            const updatedGroups = currentGroups.filter((g: AgeGroup) => g.id !== id);
            await updateDoc(communityDocRef, { ageGroups: updatedGroups });
            toast({ title: "Age Group Deleted" });
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: "Could not delete age group."});
    }
  };

  const updateCommunityName = async (newName: string) => {
    if (!activeCommunityId || !newName.trim()) return;
    try {
        const communityDocRef = doc(db, 'communities', activeCommunityId);
        await updateDoc(communityDocRef, { name: newName.trim() });
        // No toast here, handled by the calling component
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error updating name", description: error.message });
    }
  };

  const addCustomContribution = async (data: NewCustomContributionData) => {
    if (!activeCommunityId) return;
    try {
        await addDoc(collection(db, `communities/${activeCommunityId}/contributions`), data);
        toast({ title: "Template Added", description: `"${data.name}" has been added.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error adding template", description: error.message });
    }
  };

  const updateCustomContribution = async (updatedContribution: CustomContribution) => {
    if (!activeCommunityId) return;
    try {
        const { id, ...dataToUpdate } = updatedContribution;
        const contribDocRef = doc(db, `communities/${activeCommunityId}/contributions`, id);
        await updateDoc(contribDocRef, dataToUpdate);
        toast({ title: "Template Updated", description: `"${updatedContribution.name}" has been updated.` });
        closeDialog();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error updating template", description: error.message });
    }
  };

  const deleteCustomContribution = async (id: string) => {
    if (!activeCommunityId) return;
    try {
        const contribName = customContributions.find(c => c.id === id)?.name || 'Template';
        await deleteDoc(doc(db, `communities/${activeCommunityId}/contributions`, id));
        toast({ title: "Template Deleted", description: `"${contribName}" has been removed.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error deleting template", description: error.message });
    }
  };

  const contextValue = useMemo(() => ({
    members,
    families,
    settings,
    customContributions,
    isLoading,
    communityId: activeCommunityId,
    communityName,
    updateCommunityName,
    addMember,
    inviteMember,
    getInviteLink,
    resendInvitation,
    updateMember,
    deleteMember,
    addFamily,
    updateFamily,
    deleteFamily,
    updateSettings,
    addAgeGroup,
    updateAgeGroup,
deleteAgeGroup,
    addCustomContribution,
    updateCustomContribution,
    deleteCustomContribution,
    recordPayment,
    updatePayment,
    deletePayment,
    dialogState,
    openDialog,
    closeDialog,
    getContribution,
    getPaidAmount,
    getBalance,
    getPaidAmountForContribution,
    getBalanceForContribution,
  }), [
    members, families, settings, customContributions, isLoading, activeCommunityId, communityName, dialogState, 
    getContribution, addFamily, addMember, inviteMember, getInviteLink, resendInvitation, updateMember, deleteMember, updateFamily, deleteFamily, updateSettings, addAgeGroup, updateAgeGroup, deleteAgeGroup, updateCommunityName, addCustomContribution, updateCustomContribution, deleteCustomContribution, recordPayment, updatePayment, deletePayment, openDialog, closeDialog, getPaidAmount, getBalance, getPaidAmountForContribution, getBalanceForContribution
  ]);

  return (
    <CommunityContext.Provider value={contextValue}>
      {children}
    </CommunityContext.Provider>
  );
}
