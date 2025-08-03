'use client';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Home, DollarSign } from 'lucide-react';

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
  const { members, families, getTier } = useCommunity();

  const stats = {
    totalMembers: members.length,
    totalFamilies: families.length,
    tier1Members: members.filter(m => getTier(m.age) === 'Tier 1 (18-24)').length,
    tier2Members: members.filter(m => getTier(m.age) === 'Tier 2 (25+)').length,
    totalContributions: members.reduce((sum, m) => sum + m.contribution, 0),
  };
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Total Members" value={stats.totalMembers} icon={Users} colorClass="bg-blue-100 dark:bg-blue-900/20" iconBgClass="bg-white/50 text-blue-600 dark:text-blue-400" />
        <StatCard title="Total Families" value={stats.totalFamilies} icon={Home} colorClass="bg-indigo-100 dark:bg-indigo-900/20" iconBgClass="bg-white/50 text-indigo-600 dark:text-indigo-400" />
        <StatCard title="Tier 1 (18-24)" value={stats.tier1Members} icon={Users} colorClass="bg-green-100 dark:bg-green-900/20" iconBgClass="bg-white/50 text-green-600 dark:text-green-400" />
        <StatCard title="Tier 2 (25+)" value={stats.tier2Members} icon={Users} colorClass="bg-purple-100 dark:bg-purple-900/20" iconBgClass="bg-white/50 text-purple-600 dark:text-purple-400" />
        <StatCard title="Expected Contributions" value={`₦${stats.totalContributions.toLocaleString()}`} icon={DollarSign} colorClass="bg-yellow-100 dark:bg-yellow-900/20" iconBgClass="bg-white/50 text-yellow-600 dark:text-yellow-400" />
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
                  <TableHead>Age</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Contribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.slice(-5).reverse().map(member => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.family}</TableCell>
                    <TableCell>{member.age}</TableCell>
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
                        <span>₦{member.contribution.toLocaleString()}</span>
                        {member.useCustomContribution && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">Custom</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {members.length === 0 && <p className="p-6 text-center text-muted-foreground">No members have been added yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
