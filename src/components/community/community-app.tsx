
'use client';

import { useState } from 'react';
import {
  BarChart2,
  Users,
  Home,
  Settings,
  DollarSign,
  User,
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
import { RecordPaymentDialog } from './dialogs/record-payment-dialog';
import { Payments } from './payments';
import { EditCustomContributionDialog } from './dialogs/edit-custom-contribution-dialog';
import { EditPaymentDialog } from './dialogs/edit-payment-dialog';
import { EditFamilyDialog } from './dialogs/edit-family-dialog';
import { ResendInviteDialog } from './dialogs/resend-invite-dialog';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2, href: '' },
  { id: 'members', label: 'Members', icon: Users, href: '' },
  { id: 'families', label: 'Families', icon: Home, href: '' },
  { id: 'payments', label: 'Payments', icon: DollarSign, href: '' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '' },
  { id: 'profile', label: 'Account', icon: User, href: '/profile' },
];

export function CommunityApp() {
  const pathname = usePathname();
  const initialTab = TABS.find(tab => pathname.includes(tab.id))?.id || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { isLoading, dialogState, communityId } = useCommunity();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'members':
        return <Members />;
      case 'families':
        return <Families />;
      case 'payments':
        return <Payments />;
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
      <AppHeader setActiveTab={setActiveTab} />

      <nav className="bg-card shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto py-2 space-x-8 hide-scrollbar">
            {TABS.map((tab) => {
              const button = (
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
              );
              return tab.href ? <Link href={`/app${tab.href}`} key={tab.id}>{button}</Link> : button;
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </main>

      <AddFamilyDialog />
      {dialogState?.type === 'edit-family' && <EditFamilyDialog family={dialogState.family} />}
      <AddMemberDialog />
      {dialogState?.type === 'edit-member' && <EditMemberDialog member={dialogState.member} />}
      {dialogState?.type === 'resend-invite' && <ResendInviteDialog member={dialogState.member} />}
      {dialogState?.type === 'record-payment' && <RecordPaymentDialog member={dialogState.member} contribution={dialogState.contribution} />}
      {dialogState?.type === 'edit-payment' && <EditPaymentDialog member={dialogState.member} contribution={dialogState.contribution} payment={dialogState.payment} />}
      <AddCustomContributionDialog />
      {dialogState?.type === 'edit-custom-contribution' && <EditCustomContributionDialog contribution={dialogState.contribution} />}
    </div>
  );
}
