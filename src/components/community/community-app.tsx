
'use client';

import {
  BarChart2,
  Users,
  Home,
  Settings,
  DollarSign,
  User,
  FileText,
} from 'lucide-react';
import { useCommunity } from '@/hooks/use-community';
import { AppHeader } from './app-header';
import { Dashboard } from './dashboard';
import { Members } from './members';
import { Families } from './families';
import { AppSettings } from './app-settings';
import { AddFamilyDialog } from './dialogs/add-family-dialog';
import { AddMemberDialog } from './add-member-dialog';
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
import AppShellLite from '../layout/AppShellLite';
import { defaultNav } from '@/config/nav';
import { Reports } from './reports';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'families', label: 'Families', icon: Home },
  { id: 'payments', label: 'Payments', icon: DollarSign },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface CommunityAppProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export function CommunityApp({ activeTab, setActiveTab }: CommunityAppProps) {
  const pathname = usePathname();
  const { isLoading, dialogState, communityName } = useCommunity();

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
      case 'reports':
        return <Reports />;
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
  
  const navItemClasses = "py-3 px-1 flex items-center gap-2 font-medium text-sm whitespace-nowrap transition-colors border-b-2";
  const activeNavItemClasses = "border-primary text-primary";
  const inactiveNavItemClasses = "border-transparent text-muted-foreground hover:text-foreground";

  return (
    <AppShellLite header={<AppHeader setActiveTab={setActiveTab} />} nav={defaultNav} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{communityName}</h2>
      </div>
      <div className="hidden md:block">
        <nav className="bg-card shadow-sm sticky top-0 z-10 -mx-4 sm:-mx-6 md:mx-0 mb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto py-2 space-x-8 hide-scrollbar">
                {TABS.map((tab) => (
                    <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${navItemClasses} ${activeTab === tab.id ? activeNavItemClasses : inactiveNavItemClasses}`}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                        <tab.icon size={18} />
                        <span>{tab.label}</span>
                    </button>
                ))}
                <Link 
                href="/app/profile"
                className={`${navItemClasses} ${pathname === '/app/profile' ? activeNavItemClasses : inactiveNavItemClasses}`}
                >
                    <User size={18} />
                    <span>Account</span>
                </Link>
            </div>
            </div>
        </nav>
      </div>

        {renderContent()}

        {dialogState?.type === 'add-family' && <AddFamilyDialog />}
        {dialogState?.type === 'edit-family' && <EditFamilyDialog family={dialogState.family} />}
        {dialogState?.type === 'add-member' && <AddMemberDialog />}
        {dialogState?.type === 'edit-member' && <EditMemberDialog member={dialogState.member} />}
        {dialogState?.type === 'resend-invite' && <ResendInviteDialog member={dialogState.member} />}
        {dialogState?.type === 'record-payment' && <RecordPaymentDialog member={dialogState.member} contribution={dialogState.contribution} month={dialogState.month} />}
        {dialogState?.type === 'edit-payment' && <EditPaymentDialog member={dialogState.member} contribution={dialogState.contribution} payment={dialogState.payment} />}
        {dialogState?.type === 'add-custom-contribution' && <AddCustomContributionDialog />}
        {dialogState?.type === 'edit-custom-contribution' && <EditCustomContributionDialog contribution={dialogState.contribution} />}
    </AppShellLite>
  );
}
