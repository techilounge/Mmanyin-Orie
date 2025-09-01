
'use client';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Home, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Progress } from '../ui/progress';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  colorClass: string;
  iconBgClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass, iconBgClass }) => (
  <Card className={`${colorClass} border-0 shadow-sm`}>
    <CardContent className="p-4">
      <div className="flex items-center justify-start gap-4">
        <div className={`p-3 rounded-lg ${iconBgClass}`}>
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-foreground truncate">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export function Dashboard() {
  const { members, families, settings, getPaidAmount, getBalance } = useCommunity();

  const totalContributions = members.reduce((sum, m) => sum + (m.contribution || 0), 0);
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
    if (contribution === 0) return 'bg-gray-400';
    if (balance <= 0) return 'bg-green-500';
    if (balance < contribution) return 'bg-yellow-500';
    return 'bg-secondary';
  }
  
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <TableHead className="hidden md:table-cell">Family</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead className="hidden sm:table-cell">Contribution</TableHead>
                  <TableHead>Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.slice(-5).reverse().map(member => {
                  const contribution = member.contribution || 0;
                  const paidAmount = getPaidAmount(member);
                  const balance = getBalance(member);
                  const progress = contribution > 0 ? (paidAmount / contribution) * 100 : 0;
                  const tier = member.tier || '';
                  return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{member.family}</TableCell>
                    <TableCell>
                      <Badge variant={
                        tier.includes('Group 1') ? 'secondary' :
                        tier.includes('Group 2') ? 'outline' : 'default'
                      } className={`text-xs whitespace-nowrap ${
                        tier.includes('Group 1') ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                        tier.includes('Group 2') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                        ''
                      }`}>{tier}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <span>{settings.currency}{(contribution).toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className='w-32 sm:w-40'>
                            <div className='text-xs text-muted-foreground whitespace-nowrap'>
                                {settings.currency}{paidAmount.toLocaleString()} / {settings.currency}{balance.toLocaleString()}
                            </div>
                            <Progress value={progress} className='h-2 mt-1' indicatorClassName={getPaymentStatusColor(balance, contribution)} />
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
