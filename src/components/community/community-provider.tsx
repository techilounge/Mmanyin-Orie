'use client';
import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useMemo } from 'react';
import type { Member, Family, Settings, CustomContribution, NewMemberData, NewCustomContributionData, DialogState, NewPaymentData, Payment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getMonth, getYear, startOfYear } from 'date-fns';

interface CommunityContextType {
  members: Member[];
  families: Family[];
  settings: Settings;
  customContributions: CustomContribution[];
  isLoading: boolean;
  
  addMember: (newMemberData: NewMemberData) => void;
  updateMember: (updatedMemberData: Member) => void;
  deleteMember: (id: string) => void;
  
  addFamily: (familyName: string) => void;
  updateFamily: (family: Family, newFamilyName: string) => void;
  deleteFamily: (family: Family) => void;
  
  updateSettings: (newSettings: Settings) => void;
  recalculateTiers: () => void;
  
  addCustomContribution: (contributionData: NewCustomContributionData) => void;
  updateCustomContribution: (updatedContribution: CustomContribution) => void;
  deleteCustomContribution: (id: string) => void;

  recordPayment: (memberId: string, contributionId: string, paymentData: Omit<NewPaymentData, 'contributionId'>) => void;
  updatePayment: (memberId: string, updatedPayment: Payment) => void;
  deletePayment: (memberId: string, paymentId: string) => void;

  dialogState: DialogState;
  openDialog: (state: DialogState) => void;
  closeDialog: () => void;

  getContribution: (member: Member) => number;
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

const DEFAULT_FAMILIES: Family[] = [
    { id: 'Smith', name: 'Smith' }, 
    { id: 'Johnson', name: 'Johnson' }, 
    { id: 'Williams', name: 'Williams' }
];
const DEFAULT_CUSTOM_CONTRIBUTIONS: CustomContribution[] = [
    { id: '1', name: 'Annual Dues', amount: 100, description: 'Yearly community dues', tiers: ['Group 2 (25+)'], frequency: 'one-time' },
    { id: '2', name: 'Youth Dues', amount: 50, description: 'Discounted yearly dues', tiers: ['Group 1 (18-24)'], frequency: 'one-time' },
    { id: '3', name: 'Building Fund', amount: 200, description: 'Contribution for the new community hall', tiers: ['Group 1 (18-24)', 'Group 2 (25+)'], frequency: 'one-time' }
];

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [customContributions, setCustomContributions] = useState<CustomContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [dialogState, setDialogState] = useState<DialogState>(null);

  const openDialog = (state: DialogState) => setDialogState(state);
  const closeDialog = () => setDialogState(null);

  useEffect(() => {
    // This will be replaced with Firestore logic in Phase 3
    try {
      const savedMembers = localStorage.getItem('communityMembers');
      const savedFamilies = localStorage.getItem('communityFamilies');
      const savedSettings = localStorage.getItem('communitySettings');
      const savedCustomContributions = localStorage.getItem('customContributions');

      if (savedMembers) setMembers(JSON.parse(savedMembers));
      if (savedFamilies) {
          const parsedFamilies = JSON.parse(savedFamilies);
          // migrate old string[] to Family[]
          const migratedFamilies = parsedFamilies.map(f => (typeof f === 'string' ? { id: f, name: f } : f));
          setFamilies(migratedFamilies);
      } else {
          setFamilies(DEFAULT_FAMILIES);
      }
      if (savedSettings) setSettings(JSON.parse(savedSettings));
      if (savedCustomContributions) {
        const initialContributions: CustomContribution[] = JSON.parse(savedCustomContributions);
        const migratedContributions = initialContributions.map(c => ({...c, id: String(c.id), tiers: c.tiers || [], frequency: c.frequency || 'one-time' }));
        setCustomContributions(migratedContributions);
      } else {
         setCustomContributions(DEFAULT_CUSTOM_CONTRIBUTIONS);
      }

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('communityMembers', JSON.stringify(members));
  }, [members, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('communityFamilies', JSON.stringify(families));
  }, [families, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('communitySettings', JSON.stringify(settings));
  }, [settings, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('customContributions', JSON.stringify(customContributions));
  }, [customContributions, isLoading]);

  const calculateAge = (yearOfBirth: number) => new Date().getFullYear() - yearOfBirth;

  const getTier = (age: number) => {
    if (age < settings.tier1Age) return 'Under 18';
    if (age >= settings.tier1Age && age < settings.tier2Age) return 'Group 1 (18-24)';
    return 'Group 2 (25+)';
  };

  const getContribution = (member: Member) => {
    return customContributions
      .filter(c => c.tiers.includes(member.tier))
      .reduce((sum, c) => {
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
  };

  const getPaidAmount = (member: Member) => {
    return member.payments.reduce((sum, p) => sum + p.amount, 0);
  }

  const getBalance = (member: Member) => {
    return member.contribution - getPaidAmount(member);
  }

  const getPaidAmountForContribution = (member: Member, contributionId: string, month?: number) => {
    return member.payments
      .filter(p => {
        const matchesContribution = p.contributionId === contributionId;
        const matchesMonth = month === undefined || p.month === month;
        return matchesContribution && matchesMonth;
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
  
  const addFamily = (familyName: string) => {
    const trimmedName = familyName.trim();
    if (trimmedName && !families.some(f => f.name === trimmedName)) {
      const newFamily: Family = { id: trimmedName, name: trimmedName };
      setFamilies(prev => [...prev, newFamily]);
      toast({ title: "Family Created", description: `The "${trimmedName}" family has been added.` });
    } else {
      toast({ variant: "destructive", title: "Error", description: `Family "${trimmedName}" already exists or is invalid.` });
    }
  };

  const updateFamily = (family: Family, newFamilyName: string) => {
    const trimmedNewName = newFamilyName.trim();
    if (!trimmedNewName) {
        toast({ variant: "destructive", title: "Error", description: "Family name cannot be empty." });
        return;
    }
    if (families.some(f => f.name === trimmedNewName) && trimmedNewName !== family.name) {
        toast({ variant: "destructive", title: "Error", description: `Family "${trimmedNewName}" already exists.` });
        return;
    }

    const updatedFamily = { ...family, name: trimmedNewName };
    setFamilies(prev => prev.map(f => f.id === family.id ? updatedFamily : f));
    setMembers(prev => prev.map(m => m.family === family.name ? { ...m, family: trimmedNewName } : m));
    toast({ title: "Family Updated", description: `Family "${family.name}" has been renamed to "${trimmedNewName}".` });
    closeDialog();
  };

  const deleteFamily = (family: Family) => {
    const familyMembers = members.filter(m => m.family === family.name);
    if (familyMembers.length === 0) {
      setFamilies(prev => prev.filter(f => f.id !== family.id));
      toast({ title: "Family Deleted", description: `The "${family.name}" family has been removed.` });
    } else {
      toast({ variant: "destructive", title: "Deletion Failed", description: `Cannot delete family with ${familyMembers.length} member(s).` });
    }
  };

  const addMember = (data: NewMemberData) => {
    const age = calculateAge(data.yearOfBirth);
    const tier = getTier(age);
    const fullName = [data.firstName, data.middleName, data.lastName]
      .filter(part => part && part.trim())
      .join(' ');
    
    let member: Member = {
      id: String(Date.now()), // Temp ID
      name: fullName,
      firstName: data.firstName,
      middleName: data.middleName || '',
      lastName: data.lastName,
      yearOfBirth: data.yearOfBirth,
      family: data.family,
      email: data.email || '',
      phone: data.phone || '',
      phoneCountryCode: data.phoneCountryCode || '',
      age,
      tier,
      contribution: 0, // Will be calculated
      payments: [],
      joinDate: new Date().toISOString(),
    };
    member.contribution = getContribution(member);

    setMembers(prev => [...prev, member]);
    if (!families.some(f => f.name === data.family)) {
      addFamily(data.family);
    }
    toast({ title: "Member Added", description: `${fullName} has been added to the registry.` });
  };

  const updateMember = (updatedData: Member) => {
    const age = calculateAge(updatedData.yearOfBirth);
    const tier = getTier(age);
    const fullName = [updatedData.firstName, updatedData.middleName, updatedData.lastName]
      .filter(part => part && part.trim())
      .join(' ');
    
    const updatedMember: Member = {
      ...updatedData,
      name: fullName,
      age,
      tier,
      contribution: 0, // will be recalculated
    };
    updatedMember.contribution = getContribution(updatedMember);
    
    setMembers(prev => prev.map(m => m.id === updatedData.id ? updatedMember : m));
    closeDialog();
    toast({ title: "Member Updated", description: `${fullName}'s details have been updated.` });
  };

  const deleteMember = (id: string) => {
    const memberName = members.find(m => m.id === id)?.name || 'Member';
    setMembers(prev => prev.filter(m => m.id !== id));
    toast({ title: "Member Deleted", description: `${memberName} has been removed.` });
  };

  const recordPayment = (memberId: string, contributionId: string, paymentData: Omit<NewPaymentData, 'contributionId'>) => {
    const newPayment: Payment = { id: String(Date.now()), contributionId, ...paymentData };
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return { ...m, payments: [...m.payments, newPayment] };
      }
      return m;
    }));
    const memberName = members.find(m => m.id === memberId)?.name || 'Member';
    const contributionName = customContributions.find(c => c.id === contributionId)?.name || 'Contribution';
    toast({ title: "Payment Recorded", description: `Payment of ${settings.currency}${paymentData.amount} for ${memberName} towards ${contributionName} has been recorded.` });
    closeDialog();
  };

  const updatePayment = (memberId: string, updatedPayment: Payment) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const updatedPayments = m.payments.map(p => p.id === updatedPayment.id ? updatedPayment : p);
        return { ...m, payments: updatedPayments };
      }
      return m;
    }));
    toast({ title: "Payment Updated", description: `Payment details have been updated.` });
    closeDialog();
  };

  const deletePayment = (memberId: string, paymentId: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const updatedPayments = m.payments.filter(p => p.id !== paymentId);
        return { ...m, payments: updatedPayments };
      }
      return m;
    }));
    toast({ title: "Payment Deleted", description: `The payment has been removed.` });
  };
  
  const updateSettings = (newSettings: Omit<Settings, 'tier1Contribution' | 'tier2Contribution'>) => {
    setSettings(s => ({...s, ...newSettings}));
    toast({ title: "Settings Updated", description: "Membership settings have been saved." });
  }

  const recalculateTiers = () => {
    setMembers(prev => prev.map(member => {
      const tier = getTier(member.age);
      const contribution = getContribution({ ...member, tier });
      return { ...member, tier, contribution };
    }));
    toast({ title: "Groups Updated", description: "All member groups and default contributions have been recalculated." });
  };

  const addCustomContribution = (data: NewCustomContributionData) => {
    const newContrib: CustomContribution = { id: String(Date.now()), ...data };
    setCustomContributions(prev => [...prev, newContrib]);
    toast({ title: "Template Added", description: `"${data.name}" has been added.` });
    recalculateTiers();
  };

  const updateCustomContribution = (updatedContribution: CustomContribution) => {
    setCustomContributions(prev => prev.map(c => c.id === updatedContribution.id ? updatedContribution : c));
    toast({ title: "Template Updated", description: `"${updatedContribution.name}" has been updated.` });
    closeDialog();
    recalculateTiers();
  };

  const deleteCustomContribution = (id: string) => {
    const contribName = customContributions.find(c => c.id === id)?.name || 'Template';
    setCustomContributions(prev => prev.filter(c => c.id !== id));
    toast({ title: "Template Deleted", description: `"${contribName}" has been removed.` });
    recalculateTiers();
  };

  const contextValue = useMemo(() => ({
    members,
    families,
    settings,
    customContributions,
    isLoading,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [members, families, settings, customContributions, isLoading, dialogState]);

  return (
    <CommunityContext.Provider value={contextValue}>
      {children}
    </CommunityContext.Provider>
  );
}
