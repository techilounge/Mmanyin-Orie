
'use client';

import { useEffect, useState } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import type { Member } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, Copy, PartyPopper, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ResendInviteDialog() {
  const { dialogState, closeDialog, getInviteLink, resendInvitation } = useCommunity();
  const { toast } = useToast();
  
  const member = dialogState?.type === 'resend-invite' ? dialogState.member : null;
  
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);

  const isOpen = dialogState?.type === 'resend-invite';

  useEffect(() => {
    if (isOpen && member && isLoading) {
        getInviteLink(member.id).then(link => {
            setInviteLink(link);
            setIsLoading(false);
        });
    }
  }, [isOpen, member, getInviteLink, isLoading]);

  const handleClose = () => {
    setInviteLink(null);
    setHasCopied(false);
    setIsLoading(true);
    closeDialog(); 
  };
  
  if (!member) return null;

  const handleResend = async () => {
    setIsResending(true);
    await resendInvitation(member);
    setIsResending(false);
  }

  const copyToClipboard = () => {
    if (inviteLink) {
        navigator.clipboard.writeText(inviteLink);
        setHasCopied(true);
        toast({ title: 'Copied!', description: 'The invitation link has been copied to your clipboard.'})
        setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md">
          <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><PartyPopper className="text-primary"/>Invitation Link for {member.name}</DialogTitle>
              <DialogDescription>
                  Copy the link to share it directly, or resend the invitation email.
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

          <DialogFooter className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
              <Button variant="outline" onClick={handleClose} className="sm:col-span-1">Done</Button>
              <Button onClick={copyToClipboard} disabled={!inviteLink || isLoading}>
                  {hasCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {hasCopied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button onClick={handleResend} disabled={!inviteLink || isLoading || isResending}>
                  {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {isResending ? 'Sending...' : 'Resend Email'}
              </Button>
          </DialogFooter>
      </DialogContent>
      </Dialog>
  )
}
