
'use client';

import { useEffect, useState } from 'react';
import { useCommunity } from '@/hooks/use-community';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import type { Member } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, Copy, PartyPopper, Loader2, Send, ExternalLink, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getOrCreateInviteLink } from '@/lib/invitations';

export function ResendInviteDialog() {
  const { dialogState, closeDialog, resendInvitation, communityId } = useCommunity();
  const { toast } = useToast();
  
  const member = dialogState?.type === 'resend-invite' ? dialogState.member : null;
  
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indexCreationUrl, setIndexCreationUrl] = useState<string | null>(null);

  const isOpen = dialogState?.type === 'resend-invite';

  const extractFirestoreIndexUrl = (errorMessage: string): string | null => {
      const urlRegex = /(https?:\/\/[^\s]+)/;
      const match = errorMessage.match(urlRegex);
      return match ? match[0] : null;
  };

  useEffect(() => {
    if (isOpen && member && communityId) {
        setIsLoading(true);
        setError(null);
        setIndexCreationUrl(null);
        getOrCreateInviteLink({
          communityId: communityId,
          memberId: member.id,
          uid: member.uid,
          email: member.email,
        }).then(res => {
            if (res) {
                setInviteUrl(res.link);
            } else {
                setError('Could not retrieve the invitation link.');
                setInviteUrl(null);
            }
        }).catch(e => {
            const url = extractFirestoreIndexUrl(e.message);
            if (url) {
                setError('A database index is required to perform this action.');
                setIndexCreationUrl(url);
            } else {
                 setError(e.message || 'An unexpected error occurred.');
            }
            setInviteUrl(null);
        }).finally(() => {
            setIsLoading(false);
        });
    }
  }, [isOpen, member, communityId]);

  const handleClose = () => {
    setInviteUrl(null);
    setHasCopied(false);
    setIsLoading(true);
    setError(null);
    setIndexCreationUrl(null);
    closeDialog(); 
  };
  
  if (!member) return null;

  const handleResend = async () => {
    setIsResending(true);
    await resendInvitation(member);
    setIsResending(false);
  }

  const copyToClipboard = () => {
    if (inviteUrl) {
        navigator.clipboard.writeText(inviteUrl);
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
                  Copy the link to share it directly, or resend the invitation email to <strong className="text-foreground">{member.email}</strong>.
              </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
          ) : error ? (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    {error}
                    {indexCreationUrl && (
                        <a 
                            href={indexCreationUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="mt-2 block break-all text-xs font-mono underline hover:text-destructive-foreground/80"
                        >
                            Create required index <ExternalLink className="inline-block h-3 w-3 ml-1"/>
                        </a>
                    )}
                </AlertDescription>
            </Alert>
          ) : inviteUrl ? (
            <Alert>
                <AlertTitle>Shareable Invite Link</AlertTitle>
                <AlertDescription className="break-all text-primary">
                    {inviteUrl}
                </AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
              <Button variant="outline" onClick={handleClose} className="sm:col-span-1">Done</Button>
              <Button onClick={copyToClipboard} disabled={!inviteUrl || isLoading}>
                  {hasCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {hasCopied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button onClick={handleResend} disabled={!inviteUrl || isLoading || isResending}>
                  {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {isResending ? 'Sending...' : 'Resend Email'}
              </Button>
          </DialogFooter>
      </DialogContent>
      </Dialog>
  );
}
