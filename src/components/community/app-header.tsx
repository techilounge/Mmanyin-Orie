
'use client';
import { Button } from '@/components/ui/button';
import { useCommunity } from '@/hooks/use-community';
import { Home, UserPlus, DollarSign, LogOut, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Link from 'next/link';

export function AppHeader({ setActiveTab }: { setActiveTab: (tab: string) => void; }) {
  const { openDialog } = useCommunity();
  const router = useRouter();
  const { user, appUser, communityRole } = useAuth();
  const isAdmin = communityRole === 'admin' || communityRole === 'owner';

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/auth/sign-in');
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <header className="bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 md:py-4">
          <div className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-3">
            <Image src="/logo.png" alt="Mmanyin Orie Logo" width={40} height={40} className="rounded-lg flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold text-foreground font-headline truncate">Mmanyin Orie</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {isAdmin && (
              <>
                <Button
                  onClick={() => openDialog({ type: 'add-family' })}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:opacity-90 transition-opacity"
                  size="sm"
                >
                  <Home className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Create Family</span>
                </Button>
                <Button
                  onClick={() => openDialog({ type: 'invite-member' })}
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
              </>
            )}
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={appUser?.photoURL ?? ''} alt={appUser?.displayName ?? ''} />
                        <AvatarFallback>
                            {getInitials(appUser?.displayName)}
                        </AvatarFallback>
                    </Avatar>
                 </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{appUser?.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {appUser?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/app/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
