
'use client';
import { useCommunity } from '@/hooks/use-community';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Trash2, Edit } from 'lucide-react';
import { DollarSign, Globe, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '../ui/badge';
import { Settings as AppSettingsType } from '@/lib/types';
import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { AgeGroup } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const CURRENCIES = [
  { value: '₦', label: 'NGN (₦)' },
  { value: '$', label: 'USD ($)' },
  { value: '€', label: 'EUR (€)' },
  { value: '£', label: 'GBP (£)' },
  { value: '¥', label: 'JPY (¥)' },
];

export function AppSettings() {
  const { settings, updateSettings, customContributions, openDialog, deleteCustomContribution, communityName, updateCommunityName, addAgeGroup, updateAgeGroup, deleteAgeGroup } = useCommunity();
  const { toast } = useToast();

  const [localCommunityName, setLocalCommunityName] = useState(communityName);
  const [localCurrency, setLocalCurrency] = useState(settings.currency);

  const [newAgeGroup, setNewAgeGroup] = useState('');
  const [editingAgeGroup, setEditingAgeGroup] = useState<AgeGroup | null>(null);
  const [editingAgeGroupName, setEditingAgeGroupName] = useState('');

  useEffect(() => {
    setLocalCommunityName(communityName);
  }, [communityName]);

  useEffect(() => {
    setLocalCurrency(settings.currency);
  }, [settings.currency]);


  const handleSaveChanges = () => {
    let hasChanges = false;
    if (localCommunityName !== communityName) {
      updateCommunityName(localCommunityName);
      hasChanges = true;
    }
    if (localCurrency !== settings.currency) {
      updateSettings({ ...settings, currency: localCurrency });
      hasChanges = true;
    }
    if (hasChanges) {
        toast({ title: 'Settings Saved', description: 'Your general settings have been updated.'});
    }
  };

  const handleAddAgeGroup = () => {
    if (newAgeGroup.trim()) {
      addAgeGroup(newAgeGroup.trim());
      setNewAgeGroup('');
    }
  };

  const handleEditAgeGroup = () => {
    if (editingAgeGroup && editingAgeGroupName.trim()) {
      updateAgeGroup(editingAgeGroup.id, editingAgeGroupName.trim());
      setEditingAgeGroup(null);
      setEditingAgeGroupName('');
    }
  };
  
  const startEditing = (group: AgeGroup) => {
    setEditingAgeGroup(group);
    setEditingAgeGroupName(group.name);
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
                         <Badge key={tier} variant="outline" className="text-xs">{tier}</Badge>
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
                <Select value={localCurrency} onValueChange={setLocalCurrency}>
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
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
                <Users className="text-primary" />
                Age Groups
            </CardTitle>
             <CardDescription>
                Define the age groups for your community members.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {settings.ageGroups.map((group: AgeGroup) => (
                  <div key={group.id} className="flex items-center justify-between p-2 border rounded-md">
                    <span>{group.name}</span>
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" onClick={() => startEditing(group)}><Edit className="h-4 w-4 text-primary" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteAgeGroup(group.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
              ))}
              {(!settings.ageGroups || settings.ageGroups.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No age groups defined.</p>
              )}
            </div>
             <div className="flex items-center gap-2 pt-2">
                <Input 
                    placeholder="New age group name..."
                    value={newAgeGroup}
                    onChange={(e) => setNewAgeGroup(e.target.value)}
                />
                <Button onClick={handleAddAgeGroup}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>

       <AlertDialog open={!!editingAgeGroup} onOpenChange={() => setEditingAgeGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Age Group</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the new name for the age group "{editingAgeGroup?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={editingAgeGroupName}
            onChange={(e) => setEditingAgeGroupName(e.target.value)}
            placeholder="Age group name"
            className="my-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEditingAgeGroup(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditAgeGroup}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
