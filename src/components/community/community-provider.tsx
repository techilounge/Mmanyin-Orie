'use client';
import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useMemo } from 'react';
import type { Member, Family, Settings, CustomContribution, NewMemberData, NewCustomContributionData, DialogState, NewPaymentData, Payment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CommunityContextType {
  members: Member[];
  families: Family[];
  settings: Settings;
  customContributions: CustomContribution[];
  isLoading: boolean;
  
  addMember: (newMemberData: Omit<NewMemberData, 'useCustomContribution' | 'customContribution'>) => void;
  updateMember: (updatedMemberData: Member) => void;
  deleteMember: (id: number) => void;
  
  addFamily: (familyName: string) => void;
  deleteFamily: (familyName: string) => void;
  
  updateSettings: (newSettings: Settings) => void;
  recalculateTiers: () => void;
  
  addCustomContribution: (contributionData: NewCustomContributionData) => void;
  updateCustomContribution: (updatedContribution: CustomContribution) => void;
  deleteCustomContribution: (id: number) => void;

  recordPayment: (memberId: number, contributionId: number, paymentData: Omit<NewPaymentData, 'contributionId'>) => void;

  dialogState: DialogState;
  openDialog: (state: DialogState) => void;
  closeDialog: () => void;

  getContribution: (member: Member) => number;
  getTier: (age: number) => string;
  calculateAge: (yearOfBirth: number) => number;
  getPaidAmount: (member: Member) => number;
  getBalance: (member: Member) => number;
  getPaidAmountForContribution: (member: Member, contributionId: number) => number;
  getBalanceForContribution: (member: Member, contribution: CustomContribution) => number;
}

export const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = {
  tier1Age: 18,
  tier2Age: 25,
  tier1Contribution: 0,
  tier2Contribution: 0,
  currency: '₦',
};

const DEFAULT_FAMILIES = ['Smith', 'Johnson', 'Williams'];
const DEFAULT_CUSTOM_CONTRIBUTIONS: CustomContribution[] = [
    { id: 1, name: 'Annual Dues', amount: 100, description: 'Yearly community dues', tiers: ['Tier 2 (25+)'] },
    { id: 2, name: 'Youth Dues', amount: 50, description: 'Discounted yearly dues', tiers: ['Tier 1 (18-24)'] },
    { id: 3, name: 'Building Fund', amount: 200, description: 'Contribution for the new community hall', tiers: ['Tier 1 (18-24)', 'Tier 2 (25+)'] }
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
    try {
      const savedMembers = localStorage.getItem('communityMembers');
      const savedFamilies = localStorage.getItem('communityFamilies');
      const savedSettings = localStorage.getItem('communitySettings');
      const savedCustomContributions = localStorage.getItem('customContributions');

      const initialMembers: Member[] = savedMembers ? JSON.parse(savedMembers) : [];
      // Quick migration for members who don't have a payments array or payments with contributionId
      const migratedMembers = initialMembers.map((m: any) => ({
        ...m,
        payments: (m.payments || []).map(p => ({
          ...p,
          // If contributionId is missing, we can't really know, so we might assign it to a default or leave it null
          // For this migration, we assume old payments can't be assigned. New payments will have it.
          // A better migration would be to find the first applicable contribution for the member's tier.
          contributionId: p.contributionId || -1, // -1 indicates unassigned
        }))
      }));

      setMembers(migratedMembers);
      setFamilies(savedFamilies ? JSON.parse(savedFamilies) : DEFAULT_FAMILIES);
      setSettings(savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS);
      const initialContributions = savedCustomContributions ? JSON.parse(savedCustomContributions) : DEFAULT_CUSTOM_CONTRIBUTIONS;
      const migratedContributions = initialContributions.map(c => ({...c, tiers: c.tiers || [] }));
      setCustomContributions(migratedContributions);
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
    if (age >= settings.tier1Age && age < settings.tier2Age) return 'Tier 1 (18-24)';
    return 'Tier 2 (25+)';
  };

  const getContribution = (member: Member) => {
    return customContributions
      .filter(c => c.tiers.includes(member.tier))
      .reduce((sum, c) => sum + c.amount, 0);
  };

  const getPaidAmount = (member: Member) => {
    return member.payments.reduce((sum, p) => sum + p.amount, 0);
  }

  const getBalance = (member: Member) => {
    return member.contribution - getPaidAmount(member);
  }

  const getPaidAmountForContribution = (member: Member, contributionId: number) => {
    return member.payments
      .filter(p => p.contributionId === contributionId)
      .reduce((sum, p) => sum + p.amount, 0);
  }

  const getBalanceForContribution = (member: Member, contribution: CustomContribution) => {
    const paid = getPaidAmountForContribution(member, contribution.id);
    return contribution.amount - paid;
  }
  
  const addFamily = (familyName: string) => {
    if (familyName.trim() && !families.includes(familyName.trim())) {
      setFamilies(prev => [...prev, familyName.trim()]);
      toast({ title: "Family Created", description: `The "${familyName}" family has been added.` });
    } else {
      toast({ variant: "destructive", title: "Error", description: `Family "${familyName}" already exists or is invalid.` });
    }
  };

  const deleteFamily = (familyName: string) => {
    const familyMembers = members.filter(m => m.family === familyName);
    if (familyMembers.length === 0) {
      setFamilies(prev => prev.filter(f => f !== familyName));
      toast({ title: "Family Deleted", description: `The "${familyName}" family has been removed.` });
    } else {
      toast({ variant: "destructive", title: "Deletion Failed", description: `Cannot delete family with ${familyMembers.length} member(s).` });
    }
  };

  const addMember = (data: Omit<NewMemberData, 'useCustomContribution' | 'customContribution'>) => {
    const age = calculateAge(data.yearOfBirth);
    const tier = getTier(age);
    const fullName = [data.firstName, data.middleName, data.lastName]
      .filter(part => part && part.trim())
      .join(' ');
    
    let member: Member = {
      id: Date.now(),
      name: fullName,
      firstName: data.firstName,
      middleName: data.middleName || '',
      lastName: data.lastName,
      yearOfBirth: data.yearOfBirth,
      family: data.family,
      email: data.email || '',
      phone: data.phone || '',
      age,
      tier,
      contribution: 0, // Will be calculated
      useCustomContribution: false,
      customContribution: null,
      payments: []
    };
    member.contribution = getContribution(member);

    setMembers(prev => [...prev, member]);
    if (!families.includes(data.family)) {
      setFamilies(prev => [...prev, data.family]);
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

  const deleteMember = (id: number) => {
    const memberName = members.find(m => m.id === id)?.name || 'Member';
    setMembers(prev => prev.filter(m => m.id !== id));
    toast({ title: "Member Deleted", description: `${memberName} has been removed.` });
  };

  const recordPayment = (memberId: number, contributionId: number, paymentData: Omit<NewPaymentData, 'contributionId'>) => {
    const newPayment: Payment = { id: Date.now(), contributionId, ...paymentData };
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
  
  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    toast({ title: "Settings Updated", description: "Membership settings have been saved." });
  }

  const recalculateTiers = () => {
    setMembers(prev => prev.map(member => {
      const tier = getTier(member.age);
      const contribution = getContribution({ ...member, tier });
      return { ...member, tier, contribution };
    }));
    toast({ title: "Tiers Updated", description: "All member tiers and default contributions have been recalculated." });
  };

  const addCustomContribution = (data: NewCustomContributionData) => {
    const newContrib: CustomContribution = { id: Date.now(), ...data };
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

  const deleteCustomContribution = (id: number) => {
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
    deleteFamily,
    updateSettings,
    recalculateTiers,
    addCustomContribution,
    updateCustomContribution,
    deleteCustomContribution,
    recordPayment,
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
