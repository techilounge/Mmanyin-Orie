'use client';

import { useState, useMemo } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Edit2, Trash2, Users, AlertCircle, X, Receipt } from 'lucide-react';
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

export function Members() {
  const { members, families, deleteMember, openDialog, getTier, settings, getPaidAmount, getBalance } = useCommunity();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFamily, setFilterFamily] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterFamily('');
    setFilterTier('');
  };

  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return members.filter((m) => {
      const tier = getTier(m.age);
      const fullPhone = `${m.phoneCountryCode || ''}${m.phone || ''}`.toLowerCase();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.family.toLowerCase().includes(q) ||
        (m.email ?? '').toLowerCase().includes(q) ||
        fullPhone.includes(q);

      const matchesFamily = !filterFamily || m.family === filterFamily;
      const matchesTier = !filterTier || tier === filterTier;

      return matchesSearch && matchesFamily && matchesTier;
    });
  }, [members, searchTerm, filterFamily, filterTier, getTier]);

  const confirmDelete = () => {
    if (memberToDelete !== null) {
      deleteMember(memberToDelete);
      setMemberToDelete(null);
    }
  };

  const tierOptions = useMemo(() => {
    // Build from current settings via getTier over existing ages
    const set = new Set<string>();
    members.forEach((m) => set.add(getTier(m.age)));
    return Array.from(set).sort();
  }, [members, getTier]);

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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Select value={filterFamily} onValueChange={setFilterFamily}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Families" />
                </SelectTrigger>
                <SelectContent>
                  {families.sort().map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Age Groups" />
                </SelectTrigger>
                <SelectContent>
                  {tierOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                <X size={16} />
                <span className="hidden sm:inline ml-1">Clear</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Family</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Contribution</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredMembers.map((m) => {
                  const tier = getTier(m.age);
                  const paidAmount = getPaidAmount(m);
                  const balance = getBalance(m);
                  const progress = m.contribution > 0 ? (paidAmount / m.contribution) * 100 : 0;
                  const fullPhone = m.phone ? `${m.phoneCountryCode} ${m.phone}` : '';

                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.family}</TableCell>
                      <TableCell>{m.age}</TableCell>
                      <TableCell>
                        <Badge variant={tier.includes('Group 1') ? 'secondary' : tier.includes('Group 2') ? 'outline' : 'default'}  className={`text-xs ${
                        tier.includes('Group 1') ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                        tier.includes('Group 2') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                        ''
                      }`}>
                          {tier}
                        </Badge>
                      </TableCell>
                       <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{settings.currency}{m.contribution.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='w-40'>
                            <div className='text-xs text-muted-foreground'>
                                Paid: {settings.currency}{paidAmount.toLocaleString()} / Balance: {settings.currency}{balance.toLocaleString()}
                            </div>
                            <Progress value={progress} className='h-2 mt-1' indicatorClassName={getPaymentStatusColor(balance, m.contribution)} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm text-muted-foreground">
                          {m.email && <span className="truncate max-w-[150px]">{m.email}</span>}
                          {fullPhone && <span>{fullPhone}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDialog({ type: 'edit-member', member: m })}
                            aria-label="Edit member"
                          >
                            <Edit2 size={16} className="text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMemberToDelete(m.id)}
                            aria-label="Delete member"
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
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
        </div>
      </Card>

      <AlertDialog open={memberToDelete !== null} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertCircle className="text-destructive"/>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "
              {members.find((x) => x.id === memberToDelete)?.name}" from the registry.
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
