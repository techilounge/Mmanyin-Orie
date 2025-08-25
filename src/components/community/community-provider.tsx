
'use client';
import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Member, Family, Settings, CustomContribution, NewMemberData, NewCustomContributionData, DialogState, NewPaymentData, Payment, Invitation } from '@/lib/types';
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

interface CommunityContextType {
  members: Member[];
  families: Family[];
  settings: Settings;
  customContributions: CustomContribution[];
  isLoading: boolean;
  communityId: string | null;
  communityName: string;
  updateCommunityName: (newName: string) => Promise<void>;
  
  inviteMember: (newMemberData: NewMemberData) => Promise<string | null>;
  getInviteLink: (memberId: string) => Promise<string | null>;
  updateMember: (updatedMemberData: Member) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  
  addFamily: (patriarchFirstName: string, patriarchLastName: string, patriarchYearOfBirth: number) => Promise<boolean>;
  updateFamily: (family: Family, newFamilyName: string) => Promise<void>;
  deleteFamily: (family: Family) => Promise<void>;
  
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  recalculateTiers: () => Promise<void>;
  
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
  getTier: (age: number) => string;
  calculateAge: (yearOfBirth: number) => number;
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
    // If there's no active community or no authenticated user, don't set up listeners.
    // This is the key fix: it ensures that on logout (when user becomes null),
    // the cleanup function from the previous render is called, unsubscribing the listeners.
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
            setSettings({
                tier1Age: communityData.tier1Age || DEFAULT_SETTINGS.tier1Age,
                tier2Age: communityData.tier2Age || DEFAULT_SETTINGS.tier2Age,
                currency: communityData.currency || DEFAULT_SETTINGS.currency
            });
            setCommunityName(communityData.name || '');
        }
      }, (error) => {
        console.error("Error in 'community' listener:", error);
      })
    ];
    
    const timer = setTimeout(() => setIsLoading(false), 300);

    // This cleanup function is crucial. It runs when the component unmounts
    // or when the dependencies (activeCommunityId, user) change.
    return () => {
        unsubscribes.forEach(unsub => unsub());
        clearTimeout(timer);
    };

  }, [activeCommunityId, user]); // Adding `user` to the dependency array is the fix.


  const calculateAge = useCallback((yearOfBirth: number) => new Date().getFullYear() - yearOfBirth, []);

  const getTier = useCallback((age: number) => {
    if (age < settings.tier1Age) return 'Under 18';
    if (age >= settings.tier1Age && age < settings.tier2Age) return `Group 1 (${settings.tier1Age}-${settings.tier2Age - 1})`;
    return `Group 2 (${settings.tier2Age}+)`;
  }, [settings.tier1Age, settings.tier2Age]);

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

  const getPaidAmount = (member: Member) => {
    if (!member.payments) return 0;
    return member.payments.reduce((sum, p) => sum + p.amount, 0);
  }

  const getBalance = (member: Member) => {
    const contribution = member.contribution || 0;
    return contribution - getPaidAmount(member);
  }

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
  
  const addFamily = async (patriarchFirstName: string, patriarchLastName: string, patriarchYearOfBirth: number): Promise<boolean> => {
    if (!activeCommunityId) {
        toast({ variant: 'destructive', title: 'Error', description: 'No community selected.' });
        return false;
    }
    const trimmedFirstName = patriarchFirstName.trim();
    const trimmedLastName = patriarchLastName.trim();
    const familyName = `${trimmedFirstName} ${trimmedLastName}`;

    if (!trimmedFirstName || !trimmedLastName || !patriarchYearOfBirth) {
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
        const age = calculateAge(patriarchYearOfBirth);
        const tier = getTier(age);
        const joinDate = new Date().toISOString();

        const patriarchMemberBase = {
            name: familyName,
            firstName: trimmedFirstName,
            middleName: '',
            lastName: trimmedLastName,
            yearOfBirth: patriarchYearOfBirth,
            family: familyName,
            gender: 'male' as const,
            isPatriarch: true,
            email: '',
            phone: '',
            phoneCountryCode: '',
            age,
            tier,
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
    const familyMembersQuery = query(collection(db, `communities/${activeCommunityId}/members`), where("family", "==", family.name));
    const familyMembersSnapshot = await getDocs(familyMembersQuery);

    if (familyMembersSnapshot.empty) {
        try {
            await deleteDoc(doc(db, `communities/${activeCommunityId}/families`, family.id));
            toast({ title: "Family Deleted", description: `The "${family.name}" family has been removed.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
        }
    } else {
      toast({ variant: "destructive", title: "Deletion Failed", description: `Cannot delete family with ${familyMembersSnapshot.size} member(s).` });
    }
  };

  const getInviteLink = async (memberId: string): Promise<string | null> => {
    if (!activeCommunityId) return null;
    try {
        const q = query(collection(db, 'invitations'), where('memberId', '==', memberId), where('communityId', '==', activeCommunityId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast({ variant: "destructive", title: "Not Found", description: "No pending invitation found for this member." });
            return null;
        }
        
        const inviteId = querySnapshot.docs[0].id;
        return `${window.location.origin}/auth/accept-invite?token=${inviteId}`;
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: "Could not retrieve invitation link."});
        return null;
    }
  };

  const inviteMember = async (data: NewMemberData): Promise<string | null> => {
    if (!activeCommunityId || !user) return null;
    try {
        const age = calculateAge(data.yearOfBirth);
        const tier = getTier(age);
        const fullName = [data.firstName, data.middleName, data.lastName]
            .filter(part => part && part.trim())
            .join(' ');
        
        const joinDate = new Date().toISOString();

        const memberDocRef = doc(collection(db, `communities/${activeCommunityId}/members`));
        const inviteDocRef = doc(collection(db, 'invitations'));
        
        const batch = writeBatch(db);

        const newMemberBase = {
            name: fullName,
            firstName: data.firstName,
            middleName: data.middleName || '',
            lastName: data.lastName,
            yearOfBirth: data.yearOfBirth,
            family: data.family,
            email: data.email,
            phone: data.phone || '',
            phoneCountryCode: data.phoneCountryCode || '',
            gender: data.gender,
            age,
            tier,
            payments: [],
            joinDate: joinDate,
            role: 'user' as const,
            status: 'invited' as const,
            uid: null,
            isPatriarch: data.isPatriarch,
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
        
        const inviteLink = `${window.location.origin}/auth/accept-invite?token=${inviteDocRef.id}`;

        toast({ 
            title: "Member Invited", 
            description: `${fullName} has been invited. Share the link with them to join.`
        });
        return inviteLink;

    } catch(error: any) {
        toast({ variant: "destructive", title: "Error inviting member", description: error.message });
        return null;
    }
};

  const updateMember = async (updatedData: Member) => {
    if (!activeCommunityId) return;
    try {
      const age = calculateAge(updatedData.yearOfBirth);
      const tier = getTier(age);
      const fullName = [updatedData.firstName, updatedData.middleName, updatedData.lastName]
        .filter(part => part && part.trim())
        .join(' ');
      
      const tempMemberForCalc = {
        ...updatedData,
        name: fullName,
        age,
        tier,
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
          age,
          tier,
          contribution: newContribution
      };

      const batch = writeBatch(db);
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
  }

  const updateCommunityName = async (newName: string) => {
    if (!activeCommunityId || !newName.trim()) return;
    try {
        const communityDocRef = doc(db, 'communities', activeCommunityId);
        await updateDoc(communityDocRef, { name: newName.trim() });
        toast({ title: "Community Name Updated", description: "Your community name has been saved." });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error updating name", description: error.message });
    }
  };

  const recalculateTiers = async () => {
    if (!activeCommunityId) return;
    try {
        const batch = writeBatch(db);
        members.forEach(member => {
            const tier = getTier(member.age);
            const contribution = getContribution({ ...member, tier }, customContributions);
            if (member.tier !== tier || member.contribution !== contribution) {
                const memberDocRef = doc(db, `communities/${activeCommunityId}/members`, member.id);
                batch.update(memberDocRef, { tier, contribution });
            }
        });
        await batch.commit();
        toast({ title: "Groups Updated", description: "All member groups and default contributions have been recalculated." });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error recalculating tiers", description: error.message });
    }
  };

  const addCustomContribution = async (data: NewCustomContributionData) => {
    if (!activeCommunityId) return;
    try {
        await addDoc(collection(db, `communities/${activeCommunityId}/contributions`), data);
        toast({ title: "Template Added", description: `"${data.name}" has been added.` });
        await recalculateTiers();
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
        await recalculateTiers();
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
        await recalculateTiers();
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
    inviteMember,
    getInviteLink,
    updateMember,
    deleteMember,
    addFamily,
    updateFamily,
    deleteFamily,
    updateSettings,
    recalculateTiers,
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
    getTier,
    calculateAge,
    getPaidAmount,
    getBalance,
    getPaidAmountForContribution,
    getBalanceForContribution,
  }), [
    members, families, settings, customContributions, isLoading, activeCommunityId, communityName, dialogState, 
    getTier, getContribution, calculateAge, addFamily, inviteMember, getInviteLink, updateMember, deleteMember, updateFamily, deleteFamily, updateSettings, updateCommunityName, recalculateTiers, addCustomContribution, updateCustomContribution, deleteCustomContribution, recordPayment, updatePayment, deletePayment, openDialog, closeDialog, getPaidAmount, getBalance, getPaidAmountForContribution, getBalanceForContribution
  ]);

  return (
    <CommunityContext.Provider value={contextValue}>
      {children}
    </CommunityContext.Provider>
  );
}

    