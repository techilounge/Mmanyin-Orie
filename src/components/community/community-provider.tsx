'use client';
import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useMemo } from 'react';
import type { Member, Family, Settings, CustomContribution, NewMemberData, NewCustomContributionData, DialogState } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CommunityContextType {
  members: Member[];
  families: Family[];
  settings: Settings;
  customContributions: CustomContribution[];
  isLoading: boolean;
  
  addMember: (newMemberData: NewMemberData) => void;
  updateMember: (updatedMemberData: Member) => void;
  deleteMember: (id: number) => void;
  
  addFamily: (familyName: string) => void;
  deleteFamily: (familyName: string) => void;
  
  updateSettings: (newSettings: Settings) => void;
  recalculateTiers: () => void;
  
  addCustomContribution: (contributionData: NewCustomContributionData) => void;
  deleteCustomContribution: (id: number) => void;

  dialogState: DialogState;
  openDialog: (state: DialogState) => void;
  closeDialog: () => void;

  getContribution: (age: number) => number;
  getTier: (age: number) => string;
  calculateAge: (yearOfBirth: number) => number;
}

export const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = {
  tier1Age: 18,
  tier2Age: 25,
  tier1Contribution: 50,
  tier2Contribution: 100,
};

const DEFAULT_FAMILIES = ['Smith', 'Johnson', 'Williams'];
const DEFAULT_CUSTOM_CONTRIBUTIONS: CustomContribution[] = [
    { id: 1, name: 'Student Discount', amount: 25, description: 'Reduced rate for students' },
    { id: 2, name: 'Senior Citizen', amount: 30, description: 'Discounted rate for seniors 65+' },
    { id: 3, name: 'Sponsor Level', amount: 200, description: 'Premium sponsor contribution' }
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

      setMembers(savedMembers ? JSON.parse(savedMembers) : []);
      setFamilies(savedFamilies ? JSON.parse(savedFamilies) : DEFAULT_FAMILIES);
      setSettings(savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS);
      setCustomContributions(savedCustomContributions ? JSON.parse(savedCustomContributions) : DEFAULT_CUSTOM_CONTRIBUTIONS);
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

  const getContribution = (age: number) => {
    if (age < settings.tier1Age) return 0;
    if (age >= settings.tier1Age && age < settings.tier2Age) return settings.tier1Contribution;
    return settings.tier2Contribution;
  };
  
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

  const addMember = (data: NewMemberData) => {
    const age = calculateAge(data.yearOfBirth);
    const fullName = [data.firstName, data.middleName, data.lastName]
      .filter(part => part && part.trim())
      .join(' ');
    
    const defaultContribution = getContribution(age);
    const finalContribution = data.useCustomContribution && data.customContribution
      ? data.customContribution
      : defaultContribution;

    const member: Member = {
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
      tier: getTier(age),
      contribution: finalContribution,
      useCustomContribution: data.useCustomContribution,
      customContribution: data.useCustomContribution ? data.customContribution : null,
      paidAmount: 0
    };

    setMembers(prev => [...prev, member]);
    if (!families.includes(data.family)) {
      setFamilies(prev => [...prev, data.family]);
    }
    toast({ title: "Member Added", description: `${fullName} has been added to the registry.` });
  };

  const updateMember = (updatedData: Member) => {
    const age = calculateAge(updatedData.yearOfBirth);
    const fullName = [updatedData.firstName, updatedData.middleName, updatedData.lastName]
      .filter(part => part && part.trim())
      .join(' ');
    const defaultContribution = getContribution(age);
    const finalContribution = updatedData.useCustomContribution && updatedData.customContribution
      ? updatedData.customContribution
      : defaultContribution;

    const updatedMember: Member = {
      ...updatedData,
      name: fullName,
      age,
      tier: getTier(age),
      contribution: finalContribution,
      customContribution: updatedData.useCustomContribution ? updatedData.customContribution : null,
    };
    
    setMembers(prev => prev.map(m => m.id === updatedData.id ? updatedMember : m));
    closeDialog();
    toast({ title: "Member Updated", description: `${fullName}'s details have been updated.` });
  };

  const deleteMember = (id: number) => {
    const memberName = members.find(m => m.id === id)?.name || 'Member';
    setMembers(prev => prev.filter(m => m.id !== id));
    toast({ title: "Member Deleted", description: `${memberName} has been removed.` });
  };
  
  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    toast({ title: "Settings Updated", description: "Membership settings have been saved." });
  }

  const recalculateTiers = () => {
    setMembers(prev => prev.map(member => {
      const tier = getTier(member.age);
      const contribution = member.useCustomContribution ? member.contribution : getContribution(member.age);
      return { ...member, tier, contribution };
    }));
    toast({ title: "Tiers Updated", description: "All member tiers and default contributions have been recalculated." });
  };

  const addCustomContribution = (data: NewCustomContributionData) => {
    const newContrib: CustomContribution = { id: Date.now(), ...data };
    setCustomContributions(prev => [...prev, newContrib]);
    toast({ title: "Template Added", description: `"${data.name}" has been added.` });
  };

  const deleteCustomContribution = (id: number) => {
    const contribName = customContributions.find(c => c.id === id)?.name || 'Template';
    setCustomContributions(prev => prev.filter(c => c.id !== id));
    toast({ title: "Template Deleted", description: `"${contribName}" has been removed.` });
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
    deleteCustomContribution,
    dialogState,
    openDialog,
    closeDialog,
    getContribution,
    getTier,
    calculateAge
  }), [members, families, settings, customContributions, isLoading, dialogState]);

  return (
    <CommunityContext.Provider value={contextValue}>
      {children}
    </CommunityContext.Provider>
  );
}
