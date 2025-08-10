'use client';
import { useState } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, User, Users, ChevronDown, Edit, Trash2 } from 'lucide-react';
import type { Member, CustomContribution, Payment } from '@/lib/types';
import { Progress } from '../ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { format, getMonth, getYear } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';


export function Payments() {
  const { members, settings, getPaidAmount, getBalance, openDialog, customContributions, getPaidAmountForContribution, getBalanceForContribution, deletePayment } = useCommunity();
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [paymentToDelete, setPaymentToDelete] = useState<{memberId: number, paymentId: number} | null>(null);

  const selectedMember = members.find(m => m.id.toString() === selectedMemberId);

  const getPaymentStatusColor = (balance: number, contribution: number) => {
    if (contribution <= 0) return 'bg-gray-300';
    if (balance <= 0) return 'bg-green-500';
    if (balance < contribution) return 'bg-yellow-500';
    return 'bg-secondary';
  }

  const confirmDelete = () => {
    if (paymentToDelete) {
        deletePayment(paymentToDelete.memberId, paymentToDelete.paymentId);
        setPaymentToDelete(null);
    }
  }

  const renderMonthlyBreakdown = (member: Member, contribution: CustomContribution) => {
    const joinDate = new Date(member.joinDate);
    const now = new Date();
    const startMonth = getYear(now) === getYear(joinDate) ? getMonth(joinDate) : 0;
    const endMonth = getMonth(now);

    const months = Array.from({length: endMonth - startMonth + 1}, (_, i) => startMonth + i);

    return (
        <div className="space-y-2">
            {months.map(month => {
                const monthName = format(new Date(getYear(now), month), 'MMMM');
                const balance = getBalanceForContribution(member, contribution, month);
                const paid = getPaidAmountForContribution(member, contribution.id, month);

                return (
                    <div key={month} className="flex justify-between items-center bg-background p-2 rounded-md">
                        <div className="text-sm">
                            <span className="font-medium">{monthName}</span>
                            <p className="text-xs text-muted-foreground">
                                Due: {settings.currency}{contribution.amount} | Paid: {settings.currency}{paid} | Balance: {settings.currency}{balance}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => openDialog({ type: 'record-payment', member, contribution, month })} disabled={balance <= 0}>
                                Pay
                            </Button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
  }

  const renderMemberPayments = (member: Member) => {
    const totalPaid = getPaidAmount(member);
    const totalOwed = member.contribution;
    const totalBalance = getBalance(member);
    const progress = totalOwed > 0 ? (totalPaid / totalOwed) * 100 : 100;

    const applicableContributions = customContributions.filter(c => c.tiers.includes(member.tier));

    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Payment Details for {member.name}</CardTitle>
              <CardDescription>
                Family: {member.family} | Age Group: {member.tier}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
              <div className='text-sm text-muted-foreground'>
                  Total Paid: {settings.currency}{totalPaid.toLocaleString()} / Total Owed: {settings.currency}{totalOwed.toLocaleString()}
              </div>
              <Progress value={progress} className='h-2 mt-1' indicatorClassName={getPaymentStatusColor(totalBalance, totalOwed)} />
          </div>

          <div className="border rounded-lg">
            <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Contribution Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-center w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                
                {applicableContributions.length > 0 ? applicableContributions.map((contrib: CustomContribution) => {
                    const totalForContribution = contrib.frequency === 'monthly'
                        ? getBalanceForContribution(member, contrib) * -1 // This is a trick to get total paid for monthly
                        : contrib.amount;

                    const balance = getBalanceForContribution(member, contrib);
                    const paid = getPaidAmountForContribution(member, contrib.id);
                    const paymentsForContribution = member.payments.filter(p => p.contributionId === contrib.id);
                    
                    const isMonthly = contrib.frequency === 'monthly';

                    return (
                      <Collapsible asChild key={contrib.id}>
                        <TableBody className="data-[state=open]:bg-muted/30">
                          <TableRow>
                              <TableCell>
                              {paymentsForContribution.length > 0 && (
                                  <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                                      <span className="sr-only">Toggle payment history</span>
                                  </Button>
                                  </CollapsibleTrigger>
                              )}
                              </TableCell>
                              <TableCell className="font-medium">
                              {contrib.name}
                              {isMonthly && <span className="text-xs text-muted-foreground ml-2">(Monthly)</span>}
                              {contrib.description && <p className="text-xs text-muted-foreground max-w-xs">{contrib.description}</p>}
                              </TableCell>
                              <TableCell className="text-right">{settings.currency}{contrib.amount.toLocaleString()}</TableCell>
                              <TableCell className="text-right text-green-600 dark:text-green-400">{settings.currency}{paid.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-medium">{settings.currency}{isMonthly ? balance : (contrib.amount - paid).toLocaleString()}</TableCell>
                              <TableCell className="text-center">
                                {!isMonthly && (
                                  <Button 
                                      onClick={() => openDialog({type: 'record-payment', member, contribution: contrib})}
                                      disabled={balance <= 0}
                                      size="sm"
                                      variant="outline"
                                  >
                                      Record Payment
                                  </Button>
                                )}
                              </TableCell>
                          </TableRow>
                          <CollapsibleContent asChild>
                              <TableRow>
                              <TableCell colSpan={6} className="p-0">
                                  <div className="p-4 bg-muted/50">
                                  <h4 className="font-semibold mb-2 text-sm">Payment History for {contrib.name}</h4>
                                  {isMonthly ? renderMonthlyBreakdown(member, contrib) : 
                                    (paymentsForContribution.length > 0 ? (
                                      <div className="space-y-2">
                                      {paymentsForContribution.map((payment: Payment) => (
                                          <div key={payment.id} className="flex justify-between items-center bg-background p-2 rounded-md">
                                          <div className="text-sm">
                                              <span className="font-medium">{settings.currency}{payment.amount.toLocaleString()}</span> on <span>{format(new Date(payment.date), "PPP")}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog({ type: 'edit-payment', member, contribution: contrib, payment })}>
                                              <Edit className="h-4 w-4" />
                                              </Button>
                                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setPaymentToDelete({memberId: member.id, paymentId: payment.id})}>
                                              <Trash2 className="h-4 w-4" />
                                              </Button>
                                          </div>
                                          </div>
                                      ))}
                                      </div>
                                  ) : (
                                      <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                                  ))}
                                  </div>
                              </TableCell>
                              </TableRow>
                          </CollapsibleContent>
                        </TableBody>
                      </Collapsible>
                    )
                }) : (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No contributions assigned to this member's age group.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
            </Table>
          </div>
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
       <AlertDialog open={paymentToDelete !== null} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the payment record.
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
