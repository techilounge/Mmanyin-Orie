
'use client';

import { useEffect, useState } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import type { Member } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, Copy, PartyPopper, Loader2 } from 'lucide-react';

interface ResendInviteDialogProps {
    member: Member;
}

export function ResendInviteDialog({ member }: ResendInviteDialogProps) {
  const { dialogState, closeDialog, getInviteLink } = useCommunity();
  
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isOpen = dialogState?.type === 'resend-invite' && dialogState.member.id === member.id;

  useEffect(() => {
    // Only fetch if the dialog is open for this specific member and we are in a loading state.
    if (isOpen && isLoading) {
        getInviteLink(member.id).then(link => {
            setInviteLink(link);
            setIsLoading(false);
        });
    }
  }, [isOpen, member.id, getInviteLink, isLoading]);

  const handleClose = () => {
    // Reset state when closing, so it's fresh for the next open.
    setInviteLink(null);
    setHasCopied(false);
    setIsLoading(true);
    closeDialog(); 
  };

  const copyToClipboard = () => {
    if (inviteLink) {
        navigator.clipboard.writeText(inviteLink);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md">
          <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><PartyPopper className="text-primary"/>Invitation Link for {member.name}</DialogTitle>
              <DialogDescription>
                  Copy the link below and share it with the new member.
              </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
          ) : inviteLink ? (
            <Alert>
                <AlertTitle>Shareable Invite Link</AlertTitle>
                <AlertDescription className="break-all text-primary">
                    {inviteLink}
                </AlertDescription>
            </Alert>
          ) : (
             <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Could not retrieve the invitation link. The invitation might have been accepted or there was an error.
                </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="sm:justify-between gap-2 mt-4">
              <Button variant="outline" onClick={handleClose}>Done</Button>
              <Button onClick={copyToClipboard} disabled={!inviteLink || isLoading}>
                  {hasCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {hasCopied ? 'Copied!' : 'Copy Link'}
              </Button>
          </DialogFooter>
      </DialogContent>
      </Dialog>
  )
}
