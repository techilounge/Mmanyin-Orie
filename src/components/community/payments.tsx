'use client';
import { useState } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, User, Users } from 'lucide-react';
import type { Member } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

export function Payments() {
  const { members, settings, getPaidAmount, getBalance, openDialog } = useCommunity();
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  const selectedMember = members.find(m => m.id.toString() === selectedMemberId);

  const getPaymentStatusColor = (balance: number, contribution: number) => {
    if (contribution === 0) return 'bg-gray-300';
    if (balance <= 0) return 'bg-green-500';
    if (balance < contribution) return 'bg-yellow-500';
    return 'bg-secondary';
  }

  const renderMemberPayments = (member: Member) => {
    const paidAmount = getPaidAmount(member);
    const balance = getBalance(member);
    const progress = member.contribution > 0 ? (paidAmount / member.contribution) * 100 : 100;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payment Details for {member.name}</CardTitle>
          <CardDescription>
            Family: {member.family} | Tier: {member.tier}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contribution Type</TableHead>
                <TableHead>Expected Amount</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  {member.useCustomContribution ? 'Custom Contribution' : 'Standard Contribution'}
                </TableCell>
                <TableCell>{settings.currency}{member.contribution.toLocaleString()}</TableCell>
                <TableCell>{settings.currency}{paidAmount.toLocaleString()}</TableCell>
                <TableCell>{settings.currency}{balance.toLocaleString()}</TableCell>
                <TableCell>
                  <div className='w-40'>
                      <Progress value={progress} className='h-2 mt-1' indicatorClassName={getPaymentStatusColor(balance, member.contribution)} />
                  </div>
                </TableCell>
                <TableCell>
                  <Button 
                    onClick={() => openDialog({type: 'record-payment', member})}
                    disabled={balance <= 0}
                    size="sm"
                  >
                    Record Payment
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User />
            Select a Member
          </CardTitle>
          <CardDescription>
            Choose a member from the list to view their payment details or record a new payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger className="w-full md:w-1/2">
              <SelectValue placeholder="Select a member..." />
            </SelectTrigger>
            <SelectContent>
              {members.map(member => (
                <SelectItem key={member.id} value={member.id.toString()}>
                  {member.name} ({member.family})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedMember ? (
        renderMemberPayments(selectedMember)
      ) : (
        <div className="text-center py-12 bg-card rounded-xl shadow-md border border-dashed">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No Member Selected</h3>
          <p className="mt-1 text-sm text-muted-foreground">Please select a member above to see their payment information.</p>
        </div>
      )}
    </div>
  );
}
