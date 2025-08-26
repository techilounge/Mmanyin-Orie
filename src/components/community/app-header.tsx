
'use client';
import { Button } from '@/components/ui/button';
import { useCommunity } from '@/hooks/use-community';
import { Home, UserPlus, DollarSign, LogOut } from 'lucide-react';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export function AppHeader({ setActiveTab }: { setActiveTab: (tab: string) => void; }) {
  const { openDialog } = useCommunity();
  const router = useRouter();

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/auth/sign-in');
  };
  
  return (
    <header className="bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 md:py-4">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Image src="/logo.png" alt="Mmanyin Orie Logo" width={40} height={40} className="rounded-lg flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground font-headline truncate">Mmanyin Orie</h1>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <Button
              onClick={() => openDialog({ type: 'add-family' })}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:opacity-90 transition-opacity"
              size="sm"
            >
              <Home className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Family</span>
            </Button>
            <Button
              onClick={() => openDialog({ type: 'add-member' })}
              className="bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md hover:opacity-90 transition-opacity"
               size="sm"
            >
              <UserPlus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Invite Member</span>
            </Button>
             <Button
              onClick={() => setActiveTab('payments')}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md hover:opacity-90 transition-opacity"
               size="sm"
            >
              <DollarSign className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Record Payment</span>
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
               <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
