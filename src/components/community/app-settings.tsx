'use client';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Trash2, Edit } from 'lucide-react';
import { DollarSign, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '../ui/badge';

const CURRENCIES = [
  { value: '₦', label: 'NGN (₦)' },
  { value: '$', label: 'USD ($)' },
  { value: '€', label: 'EUR (€)' },
  { value: '£', label: 'GBP (£)' },
  { value: '¥', label: 'JPY (¥)' },
];

export function AppSettings() {
  const { settings, updateSettings, recalculateTiers, customContributions, openDialog, deleteCustomContribution } = useCommunity();

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateSettings({ ...settings, [name]: parseInt(value) || 0 });
  };

  const handleCurrencyChange = (value: string) => {
    updateSettings({ ...settings, currency: value });
  };
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="text-primary" />
            General Settings
          </CardTitle>
          <CardDescription>
            Manage global settings for the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-2 max-w-xs">
              <Label htmlFor="currency">Currency</Label>
              <Select value={settings.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="text-primary" />
            Age Tiers
          </CardTitle>
          <CardDescription>
            Define age ranges for contribution tiers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tier1Age">Tier 1 Starting Age</Label>
              <Input id="tier1Age" name="tier1Age" type="number" value={settings.tier1Age} onChange={handleSettingChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier2Age">Tier 2 Starting Age</Label>
              <Input id="tier2Age" name="tier2Age" type="number" value={settings.tier2Age} onChange={handleSettingChange} />
            </div>
          </div>
          <Button onClick={recalculateTiers} className="mt-6">
            Update All Member Tiers & Contributions
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="text-accent" />
                Contribution Types
              </CardTitle>
              <CardDescription>
                Create and manage different types of contributions for members.
              </CardDescription>
            </div>
            <Button onClick={() => openDialog({ type: 'add-custom-contribution' })} variant="outline">
              <Plus /> Add Contribution
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customContributions.map(contrib => (
              <div key={contrib.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="font-medium text-foreground">{contrib.name}</h4>
                    <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm font-medium">
                      {settings.currency}{contrib.amount}
                    </span>
                    {contrib.tiers.map(tier => (
                       <Badge key={tier} variant={
                        tier.includes('Tier 1') ? 'secondary' :
                        tier.includes('Tier 2') ? 'outline' : 'default'
                      } className={`text-xs ${
                        tier.includes('Tier 1') ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                        tier.includes('Tier 2') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                        ''
                      }`}>{tier}</Badge>
                    ))}
                  </div>
                  {contrib.description && (
                    <p className="text-sm text-muted-foreground mt-2">{contrib.description}</p>
                  )}
                </div>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={() => openDialog({ type: 'edit-custom-contribution', contribution: contrib })} aria-label="Edit Template">
                    <Edit className="h-4 w-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteCustomContribution(contrib.id)} aria-label="Delete Template">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {customContributions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground rounded-lg border border-dashed">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <p>No custom contributions yet.</p>
                <p className="text-sm">Click "Add Contribution" to create one.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
