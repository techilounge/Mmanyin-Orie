'use client';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Home, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Progress } from '../ui/progress';

const StatCard = ({ title, value, icon: Icon, colorClass, iconBgClass }) => (
  <Card className={`${colorClass} border-0`}>
    <CardContent className="p-5">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${iconBgClass}`}>
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export function Dashboard() {
  const { members, families, getTier, settings, getPaidAmount, getBalance } = useCommunity();

  const totalContributions = members.reduce((sum, m) => sum + m.contribution, 0);
  const totalPaid = members.reduce((sum, m) => sum + getPaidAmount(m), 0);
  const totalBalance = totalContributions - totalPaid;

  const stats = {
    totalMembers: members.length,
    totalFamilies: families.length,
    totalContributions: totalContributions,
    totalPaid: totalPaid,
    totalBalance: totalBalance,
  };

  const getPaymentStatusColor = (balance: number, contribution: number) => {
    if (contribution === 0) return 'bg-gray-300';
    if (balance <= 0) return 'bg-green-500';
    if (balance < contribution) return 'bg-yellow-500';
    return 'bg-secondary';
  }
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Total Members" value={stats.totalMembers} icon={Users} colorClass="bg-blue-100 dark:bg-blue-900/20" iconBgClass="bg-white/50 text-blue-600 dark:text-blue-400" />
        <StatCard title="Total Families" value={stats.totalFamilies} icon={Home} colorClass="bg-indigo-100 dark:bg-indigo-900/20" iconBgClass="bg-white/50 text-indigo-600 dark:text-indigo-400" />
        <StatCard title="Expected Contributions" value={`${settings.currency}${stats.totalContributions.toLocaleString()}`} icon={DollarSign} colorClass="bg-yellow-100 dark:bg-yellow-900/20" iconBgClass="bg-white/50 text-yellow-600 dark:text-yellow-400" />
        <StatCard title="Total Paid" value={`${settings.currency}${stats.totalPaid.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-100 dark:bg-green-900/20" iconBgClass="bg-white/50 text-green-600 dark:text-green-400" />
        <StatCard title="Total Outstanding" value={`${settings.currency}${stats.totalBalance.toLocaleString()}`} icon={TrendingDown} colorClass="bg-red-100 dark:bg-red-900/20" iconBgClass="bg-white/50 text-red-600 dark:text-red-400" />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Family</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Contribution</TableHead>
                  <TableHead>Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.slice(-5).reverse().map(member => {
                  const paidAmount = getPaidAmount(member);
                  const balance = getBalance(member);
                  const progress = member.contribution > 0 ? (paidAmount / member.contribution) * 100 : 0;
                  return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.family}</TableCell>
                    <TableCell>
                      <Badge variant={
                        member.tier.includes('Tier 1') ? 'secondary' :
                        member.tier.includes('Tier 2') ? 'outline' : 'default'
                      } className={
                        member.tier.includes('Tier 1') ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                        member.tier.includes('Tier 2') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                        ''
                      }>{member.tier}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{settings.currency}{member.contribution.toLocaleString()}</span>
                        {member.useCustomContribution && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">Custom</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className='w-40'>
                            <div className='text-xs text-muted-foreground'>
                                {settings.currency}{paidAmount.toLocaleString()} / {settings.currency}{balance.toLocaleString()}
                            </div>
                            <Progress value={progress} className='h-2 mt-1' indicatorClassName={getPaymentStatusColor(balance, member.contribution)} />
                        </div>
                      </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
            {members.length === 0 && <p className="p-6 text-center text-muted-foreground">No members have been added yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
