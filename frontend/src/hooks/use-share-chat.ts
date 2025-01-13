import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Chat {
  id: number;
  name: string;
  is_public: boolean;
  public_share_id?: string;
}

interface ShareResponse {
  id: number;
  is_public: boolean;
  public_share_id?: string;
}

export function useShareChat() {
  const [sharingChatId, setSharingChatId] = useState<number | null>(null);
  const { toast } = useToast();

  const handleShare = async (chat: Chat) => {
    try {
      setSharingChatId(chat.id);
      const response: ShareResponse = chat.is_public
        ? await api.unshareChat(chat.id)
        : await api.shareChat(chat.id);

      if (!response || !response.id) {
        throw new Error('Invalid response from server');
      }

      // Update local chat state
      chat.is_public = response.is_public;
      chat.public_share_id = response.public_share_id;

      if (response.is_public && response.public_share_id) {
        const shareUrl = `${window.location.origin}/public/chat/${response.public_share_id}`;
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: 'Share link copied!',
            description: 'The chat link has been copied to your clipboard.',
          });
        } catch (clipboardErr) {
          toast({
            title: 'Share link created',
            description: shareUrl,
          });
        }
      } else {
        toast({
          title: 'Chat unshared',
          description: 'This chat is now private.',
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: 'Unable to share chat',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSharingChatId(null);
    }
  };

  return {
    sharingChatId,
    handleShare,
  };
}