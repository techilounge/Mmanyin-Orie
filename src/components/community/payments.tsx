'use client';
import { useState } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, User, Users } from 'lucide-react';
import type { Member, CustomContribution } from '@/lib/types';
import { Progress } from '../ui/progress';

export function Payments() {
  const { members, settings, getPaidAmount, getBalance, openDialog, customContributions } = useCommunity();
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

    const applicableContributions = customContributions.filter(c => c.tiers.includes(member.tier));

    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Payment Details for {member.name}</CardTitle>
              <CardDescription>
                Family: {member.family} | Tier: {member.tier}
              </CardDescription>
            </div>
            <Button 
              onClick={() => openDialog({type: 'record-payment', member})}
              disabled={balance <= 0}
              size="sm"
            >
              Record Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
              <div className='text-sm text-muted-foreground'>
                  Total Paid: {settings.currency}{paidAmount.toLocaleString()} / Total Owed: {settings.currency}{member.contribution.toLocaleString()}
              </div>
              <Progress value={progress} className='h-2 mt-1' indicatorClassName={getPaymentStatusColor(balance, member.contribution)} />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contribution Type</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicableContributions.length > 0 ? applicableContributions.map((contrib: CustomContribution) => (
                <TableRow key={contrib.id}>
                  <TableCell className="font-medium">
                    {contrib.name}
                    {contrib.description && <p className="text-xs text-muted-foreground">{contrib.description}</p>}
                  </TableCell>
                  <TableCell>{settings.currency}{contrib.amount.toLocaleString()}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No contributions assigned to this member's tier.
                  </TableCell>
                </TableRow>
              )}
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
