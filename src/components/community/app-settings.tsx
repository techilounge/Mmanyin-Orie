'use client';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, DollarSign, Plus, Trash2 } from 'lucide-react';

export function AppSettings() {
  const { settings, updateSettings, recalculateTiers, customContributions, setShowAddCustomContributionDialog, deleteCustomContribution } = useCommunity();

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateSettings({ ...settings, [name]: parseInt(value) || 0 });
  };
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="text-primary" />
            Membership Settings
          </CardTitle>
          <CardDescription>
            Define age tiers and their corresponding yearly contributions.
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
            <div className="space-y-2">
              <Label htmlFor="tier1Contribution">Tier 1 Contribution ($)</Label>
              <Input id="tier1Contribution" name="tier1Contribution" type="number" value={settings.tier1Contribution} onChange={handleSettingChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier2Contribution">Tier 2 Contribution ($)</Label>
              <Input id="tier2Contribution" name="tier2Contribution" type="number" value={settings.tier2Contribution} onChange={handleSettingChange} />
            </div>
          </div>
          <Button onClick={recalculateTiers} className="mt-6">
            Update All Member Tiers & Contributions
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            This will preserve any custom contributions.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="text-accent" />
                Custom Contribution Templates
              </CardTitle>
              <CardDescription>
                Create templates for common discounts or special contribution amounts.
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddCustomContributionDialog(true)} variant="outline">
              <Plus /> Add Template
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
                      ${contrib.amount}
                    </span>
                  </div>
                  {contrib.description && (
                    <p className="text-sm text-muted-foreground mt-2">{contrib.description}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteCustomContribution(contrib.id)} aria-label="Delete Template">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {customContributions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground rounded-lg border border-dashed">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <p>No custom contribution templates yet.</p>
                <p className="text-sm">Click "Add Template" to create one.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
