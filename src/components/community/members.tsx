'use client';
import { useState } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Edit2, Trash2, X, Users, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function Members() {
  const { members, families, deleteMember, openDialog, getTier } = useCommunity();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFamily, setFilterFamily] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterFamily('');
    setFilterTier('');
  };

  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    const tier = getTier(member.age);
    const matchesSearch = member.name.toLowerCase().includes(searchLower) ||
                         member.family.toLowerCase().includes(searchLower);
    const matchesFamily = !filterFamily || member.family === filterFamily;
    const matchesTier = !filterTier || tier === filterTier;
    return matchesSearch && matchesFamily && matchesTier;
  });

  const handleDeleteClick = (id: number) => {
    setMemberToDelete(id);
  };

  const confirmDelete = () => {
    if (memberToDelete !== null) {
      deleteMember(memberToDelete);
      setMemberToDelete(null);
    }
  };

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
                  <SelectItem value="">All Families</SelectItem>
                  {families.sort().map(family => (
                    <SelectItem key={family} value={family}>{family}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Tiers</SelectItem>
                  <SelectItem value="Under 18">Under 18</SelectItem>
                  <SelectItem value="Tier 1 (18-24)">Tier 1 (18-24)</SelectItem>
                  <SelectItem value="Tier 2 (25+)">Tier 2 (25+)</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={clearFilters} variant="outline">
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
                <TableHead>Birth Year</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Contribution</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map(member => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.family}</TableCell>
                  <TableCell>{member.yearOfBirth}</TableCell>
                  <TableCell>{member.age}</TableCell>
                  <TableCell>
                     <Badge variant={
                        member.tier.includes('Tier 1') ? 'secondary' :
                        member.tier.includes('Tier 2') ? 'outline' : 'default'
                      } className={`text-xs ${
                        member.tier.includes('Tier 1') ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                        member.tier.includes('Tier 2') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                        ''
                      }`}>{member.tier}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>${member.contribution.toLocaleString()}</span>
                      {member.useCustomContribution && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">Custom</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>
                      {member.email && <div className="truncate max-w-[150px]">{member.email}</div>}
                      {member.phone && <div>{member.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openDialog({ type: 'edit-member', member })} aria-label="Edit member">
                        <Edit2 size={16} className="text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(member.id)} aria-label="Delete member">
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
            <AlertDialogTitle className="flex items-center gap-2"><AlertCircle className="text-destructive" /> Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the member
              "{members.find(m => m.id === memberToDelete)?.name}" from the registry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
