'use client';
import { Button } from '@/components/ui/button';
import { useCommunity } from '@/hooks/use-community';
import { Home, Plus, Users } from 'lucide-react';

export function AppHeader() {
  const { openDialog } = useCommunity();

  const handleAddMember = () => {
    openDialog({ type: 'add-member' });
  };
  
  return (
    <header className="bg-card shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-2 rounded-lg">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground font-headline">Nexus Hub</h1>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => openDialog({ type: 'add-family' })}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:opacity-90 transition-opacity"
            >
              <Home />
              <span className="hidden sm:inline">Create Family</span>
            </Button>
            <Button
              onClick={handleAddMember}
              className="bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md hover:opacity-90 transition-opacity"
            >
              <Plus />
              <span className="hidden sm:inline">Add Member</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
