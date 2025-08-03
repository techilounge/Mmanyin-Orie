'use client';

import { useState } from 'react';
import {
  BarChart2,
  Users,
  Home,
  Settings,
} from 'lucide-react';
import { useCommunity } from '@/hooks/use-community';
import { AppHeader } from './app-header';
import { Dashboard } from './dashboard';
import { Members } from './members';
import { Families } from './families';
import { AppSettings } from './app-settings';
import { AddFamilyDialog } from './dialogs/add-family-dialog';
import { AddMemberDialog } from './dialogs/add-member-dialog';
import { EditMemberDialog } from './dialogs/edit-member-dialog';
import { AddCustomContributionDialog } from './dialogs/add-custom-contribution-dialog';
import { Skeleton } from '@/components/ui/skeleton';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'families', label: 'Families', icon: Home },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function CommunityApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isLoading, dialogState } = useCommunity();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'members':
        return <Members />;
      case 'families':
        return <Families />;
      case 'settings':
        return <AppSettings />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-8 w-48 rounded-md" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-36 rounded-lg" />
                <Skeleton className="h-10 w-36 rounded-lg" />
              </div>
            </div>
          </div>
        </header>
        <div className="p-8">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <nav className="bg-card shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto py-2 space-x-8 hide-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 flex items-center gap-2 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </main>

      <AddFamilyDialog />
      <AddMemberDialog />
      {dialogState?.type === 'edit-member' && <EditMemberDialog member={dialogState.member} />}
      <AddCustomContributionDialog />
    </div>
  );
}
