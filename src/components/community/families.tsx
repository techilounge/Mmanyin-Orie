
'use client';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Trash2, Users, DollarSign, Plus, TrendingUp, Edit, ChevronDown } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FamilyStatProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string | number;
  colorClass: string;
  iconColorClass: string;
}

const FamilyStat: React.FC<FamilyStatProps> = ({ icon: Icon, label, value, colorClass, iconColorClass }) => (
  <div className="flex items-center gap-3">
    <div className={`p-2 rounded-lg ${colorClass}`}>
      <Icon className={`h-5 w-5 ${iconColorClass}`} />
    </div>
    <div>
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);


export function Families() {
  const { families, members, deleteFamily, openDialog, settings, getPaidAmount } = useCommunity();

  if (families.length === 0) {
    return (
       <div className="text-center py-16 bg-card rounded-xl shadow-sm border border-dashed">
        <Home className="mx-auto h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-xl font-semibold text-foreground">No Families Found</h3>
        <p className="mt-2 text-base text-muted-foreground">Get started by creating your first family to manage members and contributions.</p>
        <div className="mt-6">
          <Button
            onClick={() => openDialog({ type: 'add-family' })}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:opacity-90 transition-opacity"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create First Family
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
      {families.sort((a,b) => a.name.localeCompare(b.name)).map(family => {
        const familyMembers = members.filter(m => m.family === family.name);
        const familyContribution = familyMembers.reduce((sum, m) => sum + (m.contribution || 0), 0);
        const familyPaid = familyMembers.reduce((sum, m) => sum + getPaidAmount(m), 0);
        
        return (
          <Collapsible key={family.id} defaultOpen={false} asChild>
            <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                  <div className="flex justify-between items-start">
                      <div className="flex-1">
                          <CardTitle className="text-2xl font-bold">{family.name} Family</CardTitle>
                          <CardDescription>Manage family members and track contributions.</CardDescription>
                      </div>
                      <div className='flex items-center'>
                          <Button variant="ghost" size="icon" onClick={() => openDialog({ type: 'edit-family', family })} aria-label="Edit Family">
                            <Edit className="h-4 w-4 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteFamily(family)} aria-label="Delete Family">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                           <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                                <span className="sr-only">Toggle members view</span>
                              </Button>
                          </CollapsibleTrigger>
                      </div>
                  </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="flex flex-col flex-grow">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
                        <FamilyStat
                            icon={Users}
                            label="Members"
                            value={familyMembers.length}
                            colorClass="bg-blue-100 dark:bg-blue-900/40"
                            iconColorClass="text-blue-600 dark:text-blue-300"
                        />
                        <FamilyStat
                            icon={DollarSign}
                            label="Total Due"
                            value={`${settings.currency}${familyContribution.toLocaleString()}`}
                            colorClass="bg-yellow-100 dark:bg-yellow-900/40"
                            iconColorClass="text-yellow-600 dark:text-yellow-300"
                        />
                        <FamilyStat
                            icon={TrendingUp}
                            label="Total Paid"
                            value={`${settings.currency}${familyPaid.toLocaleString()}`}
                            colorClass="bg-green-100 dark:bg-green-900/40"
                            iconColorClass="text-green-600 dark:text-green-300"
                        />
                    </div>

                  <div className="space-y-2 flex-grow max-h-56 overflow-y-auto pr-2 hide-scrollbar">
                    {familyMembers.length > 0 ? familyMembers.map(member => {
                      const tier = member.tier || '';
                      return (
                      <div key={member.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted/50">
                        <span className="font-medium truncate max-w-[120px]">{member.name}</span>
                        <div className="flex items-center gap-2">
                            <Badge variant={
                                tier.includes('Group 1') ? 'secondary' :
                                tier.includes('Group 2') ? 'outline' : 'default'
                            } className={`text-xs ${
                                tier.includes('Group 1') ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                                tier.includes('Group 2') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                                ''
                            }`}>{tier}</Badge>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog({ type: 'edit-member', member })} aria-label={`Edit ${member.name}`}>
                                <Edit className="h-4 w-4 text-primary" />
                            </Button>
                        </div>
                      </div>
                    )}) : (
                      <div className="flex flex-col items-center justify-center h-full text-center py-8">
                         <Users className="h-10 w-10 text-muted-foreground/60 mb-2"/>
                         <p className="text-sm font-medium text-muted-foreground">No members in this family yet.</p>
                         <p className="text-xs text-muted-foreground">Click "Add Member" to get started.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="mt-auto border-t pt-4">
                  <Button onClick={() => openDialog({ type: 'add-member', family: family.name })} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Member
                  </Button>
                </CardFooter>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
