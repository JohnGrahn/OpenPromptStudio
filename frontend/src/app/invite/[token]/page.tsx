'use client';

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface InviteParams {
  [key: string]: string | undefined;
  token: string;
}

export default function InvitePage() {
  const { token } = useParams<InviteParams>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const joinTeam = async () => {
      try {
        setIsLoading(true);
        await api.joinTeamWithInvite(token!);
        toast({
          title: 'Success!',
          description: 'You have joined the team successfully.',
        });
        navigate('/settings');
      } catch (err) {
        console.error('Failed to join team:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to join team. The invite may be invalid or expired.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      joinTeam();
    }
  }, [token, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Joining team...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md space-y-6 p-6 text-center">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return null;
}