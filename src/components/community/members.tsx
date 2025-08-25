
'use client';

import { useState, useMemo } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, Users, AlertCircle, X, Shield, Crown, User, Send } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '../ui/progress';
import type { Member } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const roleIcons = {
  owner: <Crown size={14} className="text-amber-500" />,
  admin: <Shield size={14} className="text-primary" />,
  user: <User size={14} className="text-muted-foreground" />,
};

const roleColors = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  user: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export function Members() {
  const { members, families, deleteMember, openDialog, settings, getPaidAmount, getBalance } = useCommunity();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFamily, setFilterFamily] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterFamily('all');
    setFilterTier('all');
  };

  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return members.filter((m) => {
      const tier = m.tier || '';
      const fullPhone = `${m.phoneCountryCode || ''}${m.phone || ''}`.toLowerCase();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.family.toLowerCase().includes(q) ||
        (m.email ?? '').toLowerCase().includes(q) ||
        fullPhone.includes(q);

      const matchesFamily = filterFamily === 'all' || m.family === filterFamily;
      const matchesTier = filterTier === 'all' || tier === filterTier;

      return matchesSearch && matchesFamily && matchesTier;
    });
  }, [members, searchTerm, filterFamily, filterTier]);

  const confirmDelete = () => {
    if (memberToDelete !== null) {
      deleteMember(memberToDelete.id);
      setMemberToDelete(null);
    }
  };

  const tierOptions = useMemo(() => {
    const dynamicTiers = new Set<string>();
    members.forEach((m) => {
      if(m.tier) dynamicTiers.add(m.tier)
    });
    return Array.from(dynamicTiers).sort((a,b) => {
      if (a.includes('Under')) return -1;
      if (b.includes('Under')) return 1;
      return a.localeCompare(b);
    });
  }, [members]);


  const getPaymentStatusColor = (balance: number, contribution: number) => {
    if (contribution === 0) return 'bg-gray-400'
    if (balance <= 0) return 'bg-green-500';
    if (balance < contribution) return 'bg-yellow-500';
    return 'bg-secondary';
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
            </div>

            <Select value={filterFamily} onValueChange={setFilterFamily}>
              <SelectTrigger>
                <SelectValue placeholder="All Families" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Families</SelectItem>
                {families.sort((a, b) => a.name.localeCompare(b.name)).map((f) => (
                  <SelectItem key={f.id} value={f.name}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger>
                <SelectValue placeholder="All Age Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Age Groups</SelectItem>
                {tierOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px] sm:w-[200px]">Name</TableHead>
                  <TableHead className="hidden md:table-cell">Family</TableHead>
                  <TableHead className="hidden lg:table-cell">Role</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Contribution</TableHead>
                  <TableHead className="w-[150px] sm:w-[200px]">Payment Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredMembers.map((m) => {
                  const contribution = m.contribution || 0;
                  const tier = m.tier || '';
                  const role = m.role || 'user';
                  const status = m.status || 'active';
                  const paidAmount = getPaidAmount(m);
                  const balance = getBalance(m);
                  const progress = contribution > 0 ? (paidAmount / contribution) * 100 : 0;
                  const fullPhone = m.phone ? `${m.phoneCountryCode} ${m.phone}` : '';

                  return (
                    <TableRow key={m.id} className={status === 'invited' ? 'bg-muted/30' : ''}>
                      <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                             <span>{m.name}</span>
                             {status === 'invited' && (
                                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-200">Invited</Badge>
                             )}
                          </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{m.family}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className={`capitalize ${roleColors[role]}`}>
                           {roleIcons[role]}
                           <span className="ml-1.5">{role}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tier.includes('Group 1') ? 'secondary' : tier.includes('Group 2') ? 'outline' : 'default'}  className={`text-xs whitespace-nowrap ${
                        tier.includes('Group 1') ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                        tier.includes('Group 2') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                        ''
                      }`}>
                          {tier}
                        </Badge>
                      </TableCell>
                       <TableCell className="hidden sm:table-cell text-right">
                        <span>{settings.currency}{(contribution).toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <div className='w-full'>
                            <div className='text-xs text-muted-foreground whitespace-nowrap'>
                                Paid: {settings.currency}{paidAmount.toLocaleString()}
                            </div>
                            <Progress value={progress} className='h-2 mt-1' indicatorClassName={getPaymentStatusColor(balance, contribution)} />
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex flex-col text-sm text-muted-foreground">
                          {m.email && <span className="truncate max-w-[150px]">{m.email}</span>}
                          {fullPhone && <span className="whitespace-nowrap">{fullPhone}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                           {status === 'invited' ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDialog({ type: 'resend-invite', member: m })}
                                            aria-label="Resend Invite"
                                        >
                                            <Send size={16} className="text-primary" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Resend Invitation</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                           ) : (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDialog({ type: 'edit-member', member: m })}
                                            aria-label="Edit member"
                                        >
                                            <Edit size={16} className="text-primary" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Edit Member</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                           )}
                           
                            <TooltipProvider>
                                <Tooltip>
                                     <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setMemberToDelete(m)}
                                            aria-label="Delete member"
                                        >
                                            <Trash2 size={16} className="text-destructive" />
                                        </Button>
                                     </TooltipTrigger>
                                     <TooltipContent>
                                        <p>Delete Member</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No members found</h3>
                <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filter criteria.</p>
              </div>
            )}
        </Card>
      </div>

      <AlertDialog open={memberToDelete !== null} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertCircle className="text-destructive"/>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "
              {memberToDelete?.name}" from the registry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
