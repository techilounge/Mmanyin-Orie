
'use client';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Trash2, Edit } from 'lucide-react';
import { DollarSign, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '../ui/badge';
import { Settings as AppSettingsType } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

const CURRENCIES = [
  { value: '₦', label: 'NGN (₦)' },
  { value: '$', label: 'USD ($)' },
  { value: '€', label: 'EUR (€)' },
  { value: '£', label: 'GBP (£)' },
  { value: '¥', label: 'JPY (¥)' },
];

export function AppSettings() {
  const { settings, updateSettings, recalculateTiers, customContributions, openDialog, deleteCustomContribution, communityName, updateCommunityName } = useCommunity();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [localCommunityName, setLocalCommunityName] = useState(communityName);
  const [debouncedSettings] = useDebounce(localSettings, 500);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    setLocalCommunityName(communityName);
  }, [communityName]);

  useEffect(() => {
    if (JSON.stringify(debouncedSettings) !== JSON.stringify(settings)) {
      updateSettings(debouncedSettings);
    }
  }, [debouncedSettings, settings, updateSettings]);

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleCurrencyChange = (value: string) => {
    setLocalSettings(prev => ({ ...prev, currency: value }));
  };

  const handleSaveCommunityName = () => {
    if (localCommunityName !== communityName) {
      updateCommunityName(localCommunityName);
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-8">
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
                <Plus className="mr-2 h-4 w-4" /> Add Contribution
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customContributions.map(contrib => (
                <div key={contrib.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <h4 className="font-medium text-foreground">{contrib.name}</h4>
                      <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm font-medium">
                        {settings.currency}{contrib.amount}
                      </span>
                      {contrib.tiers.map(tier => (
                         <Badge key={tier} variant={
                          tier.includes('Group 1') ? 'secondary' :
                          tier.includes('Group 2') ? 'outline' : 'default'
                        } className={`text-xs ${
                          tier.includes('Group 1') ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                          tier.includes('Group 2') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                          ''
                        }`}>{tier}</Badge>
                      ))}
                    </div>
                    {contrib.description && (
                      <p className="text-sm text-muted-foreground mt-2">{contrib.description}</p>
                    )}
                  </div>
                  <div className="flex items-center self-end sm:self-center">
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
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="community-name">Community Name</Label>
                <Input 
                  id="community-name" 
                  value={localCommunityName}
                  onChange={(e) => setLocalCommunityName(e.target.value)}
                />
             </div>
             <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={localSettings.currency} onValueChange={handleCurrencyChange}>
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
          <CardFooter>
            <Button onClick={handleSaveCommunityName}>Save Changes</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="text-primary" />
              Age Groups
            </CardTitle>
            <CardDescription>
              Define age ranges for contribution groups.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tier1Age">Group 1 Starting Age</Label>
                <Input id="tier1Age" name="tier1Age" type="number" value={localSettings.tier1Age} onChange={handleSettingChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier2Age">Group 2 Starting Age</Label>
                <Input id="tier2Age" name="tier2Age" type="number" value={localSettings.tier2Age} onChange={handleSettingChange} />
              </div>
            </div>
            <Button onClick={recalculateTiers} className="mt-6 w-full">
              Update All Member Groups & Contributions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
