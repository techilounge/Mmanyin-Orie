'use client';
import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Member, Family, Settings, CustomContribution, NewMemberData, NewCustomContributionData, DialogState, NewPaymentData, Payment } from '@/lib/types';
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
  
  addMember: (newMemberData: NewMemberData, newFamilyName?: string) => Promise<void>;
  updateMember: (updatedMemberData: Member) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  
  addFamily: (familyName: string) => Promise<void>;
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

export function CommunityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [customContributions, setCustomContributions] = useState<CustomContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [communityId, setCommunityId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<DialogState>(null);

  const openDialog = (state: DialogState) => setDialogState(state);
  const closeDialog = () => setDialogState(null);

  // Fetch community ID from user document
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          if (userData.communityId) {
            setCommunityId(userData.communityId);
          } else {
             // This case might happen if user doc is created but community linkage fails
            setIsLoading(false);
          }
        } else {
            setIsLoading(false);
        }
      });
      return () => unsubscribe();
    } else {
      setIsLoading(false);
      setCommunityId(null);
    }
  }, [user]);

  // Set up Firestore listeners
  useEffect(() => {
    if (!communityId) {
        setIsLoading(!user); // still loading if user exists but communityId not yet fetched
        return;
    }
    
    setIsLoading(true);

    const communityDocRef = doc(db, 'communities', communityId);
    
    const unsubscribes = [
      onSnapshot(collection(communityDocRef, 'members'), (snapshot) => {
        const fetchedMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        setMembers(fetchedMembers);
      }),
      onSnapshot(collection(communityDocRef, 'families'), (snapshot) => {
        const fetchedFamilies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Family));
        setFamilies(fetchedFamilies);
      }),
      onSnapshot(collection(communityDocRef, 'contributions'), (snapshot) => {
        const fetchedContributions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomContribution));
        setCustomContributions(fetchedContributions);
      }),
      onSnapshot(communityDocRef, (snapshot) => {
        if (snapshot.exists()) {
            const communityData = snapshot.data();
            setSettings({
                tier1Age: communityData.tier1Age || DEFAULT_SETTINGS.tier1Age,
                tier2Age: communityData.tier2Age || DEFAULT_SETTINGS.tier2Age,
                currency: communityData.currency || DEFAULT_SETTINGS.currency
            });
        }
      })
    ];
    
    // Using a timeout to prevent flicker on fast loads
    const timer = setTimeout(() => setIsLoading(false), 300);

    return () => {
        unsubscribes.forEach(unsub => unsub());
        clearTimeout(timer);
    };

  }, [communityId, user]);


  const calculateAge = useCallback((yearOfBirth: number) => new Date().getFullYear() - yearOfBirth, []);

  const getTier = useCallback((age: number) => {
    if (age < settings.tier1Age) return 'Under 18';
    if (age >= settings.tier1Age && age < settings.tier2Age) return `Group 1 (${settings.tier1Age}-${settings.tier2Age - 1})`;
    return `Group 2 (${settings.tier2Age}+)`;
  }, [settings.tier1Age, settings.tier2Age]);

 const getContribution = useCallback((member: Omit<Member, 'id' | 'contribution'>, currentCustomContributions: CustomContribution[]) => {
    const applicableContributions = currentCustomContributions.filter(c => c.tiers.includes(member.tier));
    
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
    return member.contribution - getPaidAmount(member);
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
  
  const addFamily = async (familyName: string) => {
    if (!communityId) return;
    const trimmedName = familyName.trim();
    if (trimmedName && !families.some(f => f.name === trimmedName)) {
        try {
            await addDoc(collection(db, `communities/${communityId}/families`), { name: trimmedName });
            toast({ title: "Family Created", description: `The "${trimmedName}" family has been added.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    } else {
      toast({ variant: "destructive", title: "Error", description: `Family "${trimmedName}" already exists or is invalid.` });
    }
  };

  const updateFamily = async (family: Family, newFamilyName: string) => {
    if (!communityId) return;
    const trimmedNewName = newFamilyName.trim();
    if (!trimmedNewName) {
        toast({ variant: "destructive", title: "Error", description: "Family name cannot be empty." });
        return;
    }
    if (families.some(f => f.name === trimmedNewName) && trimmedNewName !== family.name) {
        toast({ variant: "destructive", title: "Error", description: `Family "${trimmedNewName}" already exists.` });
        return;
    }

    try {
        const batch = writeBatch(db);
        const familyDocRef = doc(db, `communities/${communityId}/families`, family.id);
        batch.update(familyDocRef, { name: trimmedNewName });
        
        // Update family name for all members of that family
        const membersQuery = query(collection(db, `communities/${communityId}/members`), where("family", "==", family.name));
        const membersSnapshot = await getDocs(membersQuery);
        membersSnapshot.forEach(doc => {
            batch.update(doc.ref, { family: trimmedNewName });
        });

        await batch.commit();
        toast({ title: "Family Updated", description: `Family "${family.name}" has been renamed to "${trimmedNewName}".` });
        closeDialog();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error updating family", description: error.message });
    }
  };

  const deleteFamily = async (family: Family) => {
    if (!communityId) return;
    const familyMembersQuery = query(collection(db, `communities/${communityId}/members`), where("family", "==", family.name));
    const familyMembersSnapshot = await getDocs(familyMembersQuery);

    if (familyMembersSnapshot.empty) {
        try {
            await deleteDoc(doc(db, `communities/${communityId}/families`, family.id));
            toast({ title: "Family Deleted", description: `The "${family.name}" family has been removed.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
        }
    } else {
      toast({ variant: "destructive", title: "Deletion Failed", description: `Cannot delete family with ${familyMembersSnapshot.size} member(s).` });
    }
  };

  const addMember = async (data: NewMemberData, newFamilyName?: string) => {
    if (!communityId) return;
    try {
      let familyNameToUse = data.family;
      if (newFamilyName && newFamilyName.trim()) {
        const trimmedFamilyName = newFamilyName.trim();
        await addFamily(trimmedFamilyName);
        familyNameToUse = trimmedFamilyName;
      }

      const age = calculateAge(data.yearOfBirth);
      const tier = getTier(age);
      const fullName = [data.firstName, data.middleName, data.lastName]
        .filter(part => part && part.trim())
        .join(' ');

      const newMemberBase = {
        name: fullName,
        firstName: data.firstName,
        middleName: data.middleName || '',
        lastName: data.lastName,
        yearOfBirth: data.yearOfBirth,
        family: familyNameToUse,
        email: data.email || '',
        phone: data.phone || '',
        phoneCountryCode: data.phoneCountryCode || '',
        age,
        tier,
        payments: [],
        joinDate: new Date().toISOString(),
      };
      
      const contribution = getContribution(newMemberBase, customContributions);
      const newMember = { ...newMemberBase, contribution };

      await addDoc(collection(db, `communities/${communityId}/members`), newMember);
      
      toast({ title: "Member Added", description: `${fullName} has been added to the registry.` });
      closeDialog();
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error adding member", description: error.message });
    }
  };

  const updateMember = async (updatedData: Member) => {
    if (!communityId) return;
    const age = calculateAge(updatedData.yearOfBirth);
    const tier = getTier(age);
    const fullName = [updatedData.firstName, updatedData.middleName, updatedData.lastName]
      .filter(part => part && part.trim())
      .join(' ');
    
    // Create a temporary member object without ID and contribution to calculate the new contribution
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
    };
    const newContribution = getContribution(tempMemberForCalc, customContributions);

    const memberToUpdate = {
        ...updatedData,
        name: fullName,
        age,
        tier,
        contribution: newContribution
    };
    
    // remove id from the object to avoid writing it to the document
    const { id, ...dataToSend } = memberToUpdate;

    try {
        const memberDocRef = doc(db, `communities/${communityId}/members`, id);
        await updateDoc(memberDocRef, dataToSend);
        closeDialog();
        toast({ title: "Member Updated", description: `${fullName}'s details have been updated.` });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error updating member", description: error.message });
    }
  };

  const deleteMember = async (id: string) => {
    if (!communityId) return;
    try {
        const memberName = members.find(m => m.id === id)?.name || 'Member';
        await deleteDoc(doc(db, `communities/${communityId}/members`, id));
        toast({ title: "Member Deleted", description: `${memberName} has been removed.` });
    } catch(error: any) {
        toast({ variant: "destructive", title: "Error deleting member", description: error.message });
    }
  };

  const recordPayment = async (memberId: string, contributionId: string, paymentData: Omit<NewPaymentData, 'contributionId'>) => {
    if (!communityId) return;
    try {
        const memberDocRef = doc(db, `communities/${communityId}/members`, memberId);
        const memberSnapshot = await getDoc(memberDocRef);
        if (memberSnapshot.exists()) {
            const memberData = memberSnapshot.data() as Member;
            const newPayment: Payment = { 
                id: doc(collection(db, 'dummy')).id, // Generate a client-side ID
                contributionId, 
                ...paymentData 
            };
            const updatedPayments = [...(memberData.payments || []), newPayment];
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
     if (!communityId) return;
     try {
        const memberDocRef = doc(db, `communities/${communityId}/members`, memberId);
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
     if (!communityId) return;
      try {
        const memberDocRef = doc(db, `communities/${communityId}/members`, memberId);
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
    if (!communityId) return;
    try {
        const communityDocRef = doc(db, 'communities', communityId);
        await updateDoc(communityDocRef, newSettings);
        toast({ title: "Settings Updated", description: "Membership settings have been saved." });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error updating settings", description: error.message });
    }
  }

  const recalculateTiers = async () => {
    if (!communityId) return;
    try {
        const batch = writeBatch(db);
        members.forEach(member => {
            const tier = getTier(member.age);
            const contribution = getContribution({ ...member, tier }, customContributions);
            if (member.tier !== tier || member.contribution !== contribution) {
                const memberDocRef = doc(db, `communities/${communityId}/members`, member.id);
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
    if (!communityId) return;
    try {
        await addDoc(collection(db, `communities/${communityId}/contributions`), data);
        toast({ title: "Template Added", description: `"${data.name}" has been added.` });
        await recalculateTiers();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error adding template", description: error.message });
    }
  };

  const updateCustomContribution = async (updatedContribution: CustomContribution) => {
    if (!communityId) return;
    try {
        const { id, ...dataToUpdate } = updatedContribution;
        const contribDocRef = doc(db, `communities/${communityId}/contributions`, id);
        await updateDoc(contribDocRef, dataToUpdate);
        toast({ title: "Template Updated", description: `"${updatedContribution.name}" has been updated.` });
        closeDialog();
        await recalculateTiers();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error updating template", description: error.message });
    }
  };

  const deleteCustomContribution = async (id: string) => {
    if (!communityId) return;
    try {
        const contribName = customContributions.find(c => c.id === id)?.name || 'Template';
        await deleteDoc(doc(db, `communities/${communityId}/contributions`, id));
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
    communityId,
    addMember,
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
    members, families, settings, customContributions, isLoading, communityId, dialogState, 
    getTier, getContribution, calculateAge, addFamily, addMember, updateMember, deleteMember, updateFamily, deleteFamily, updateSettings, recalculateTiers, addCustomContribution, updateCustomContribution, deleteCustomContribution, recordPayment, updatePayment, deletePayment, openDialog, closeDialog, getPaidAmount, getBalance, getPaidAmountForContribution, getBalanceForContribution
  ]);

  return (
    <CommunityContext.Provider value={contextValue}>
      {children}
    </CommunityContext.Provider>
  );
}
