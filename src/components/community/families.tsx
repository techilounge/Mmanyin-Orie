'use client';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Trash2, Users, DollarSign, Plus } from 'lucide-react';
import { Badge } from '../ui/badge';

export function Families() {
  const { families, members, deleteFamily, openDialog } = useCommunity();

  const handleAddMember = (familyName: string) => {
    openDialog({ type: 'add-member', family: familyName });
  };
  
  if (families.length === 0) {
    return (
       <div className="text-center py-12 bg-card rounded-xl shadow-md">
        <Home className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium text-foreground">No families</h3>
        <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first family.</p>
        <div className="mt-6">
          <Button
            onClick={() => openDialog({ type: 'add-family' })}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
          >
            <Home />
            Create First Family
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {families.sort().map(family => {
        const familyMembers = members.filter(m => m.family === family);
        const familyContribution = familyMembers.reduce((sum, m) => sum + m.contribution, 0);
        
        return (
          <Card key={family} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between">
              <CardTitle>{family} Family</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => deleteFamily(family)} aria-label="Delete Family">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Users size={14} /> Members</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{familyMembers.length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign size={14} /> Contributions</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">${familyContribution.toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-2 mb-4 flex-grow max-h-40 overflow-y-auto pr-2">
                {familyMembers.map(member => (
                  <div key={member.id} className="flex justify-between items-center text-sm py-2 border-b border-border/50 last:border-0">
                    <span className="font-medium truncate max-w-[120px]">{member.name}</span>
                    <Badge variant={
                        member.tier.includes('Tier 1') ? 'secondary' :
                        member.tier.includes('Tier 2') ? 'outline' : 'default'
                      } className={`text-xs ${
                        member.tier.includes('Tier 1') ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                        member.tier.includes('Tier 2') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                        ''
                      }`}>{member.tier}</Badge>
                  </div>
                ))}
                {familyMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground italic py-2">No members yet</p>
                )}
              </div>
              <Button onClick={() => handleAddMember(family)} className="w-full mt-auto">
                <Plus /> Add Member
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
