'use client';

import { useState, Suspense, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  HomeIcon,
  XIcon,
  MenuIcon,
  PlusCircleIcon,
  Pencil,
  Moon,
  Sun,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { User, Team, TeamMember } from '@/lib/api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from '@/context/theme-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleSelect, type Role } from './components/RoleSelect';
import { UserTypeSelect, USER_TYPES } from './components/UserTypeSelect';

interface UserContextType {
  user: User | null;
  team: Team | null;
  teams: Team[];
  refreshUser: () => Promise<void>;
  refreshTeams: () => Promise<void>;
}

interface InviteResponse {
  code: string;
  invite_link: string;
}

type TeamMemberType = {
  user_id: number;
  role: Role;
} & User;

function SettingsContent() {
  const userContext = useUser();
  const { user, team, teams, refreshUser, refreshTeams } = userContext as UserContextType;
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmail, setEditedEmail] = useState<string>('');
  const [editedUserType, setEditedUserType] = useState<string | null>(null);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editedTeamName, setEditedTeamName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMemberType[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shouldHighlightBuy = searchParams.get('buy') === 'true';

  // Initialize state from user data
  useEffect(() => {
    if (user) {
      setEditedEmail(user.email ?? '');
      setEditedUserType(user.user_type ?? null);
    }
  }, [user]);

  // Initialize team name from team data
  useEffect(() => {
    if (team) {
      setEditedTeamName(team.name);
    }
  }, [team]);

  // Load team members when team changes
  useEffect(() => {
    if (team?.id) {
      loadTeamMembers();
    }
  }, [team?.id]);

  const loadTeamMembers = async () => {
    try {
      if (!team) return;
      setIsLoadingMembers(true);
      const members = await api.getTeamMembers(team.id) as TeamMember[];
      setTeamMembers(members);
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error',
        description: err.message || 'Failed to load team members',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleTeamChange = async (teamId: string) => {
    localStorage.setItem('team', teamId);
    window.location.reload();
  };

  const handleGenerateInvite = async () => {
    try {
      if (!team) return;
      const response = await api.generateTeamInvite(team.id) as InviteResponse;
      setInviteLink(response.invite_link);
      toast({
        title: 'Invite Link Generated',
        description:
          'The invite link has been generated and copied to your clipboard.',
      });
      navigator.clipboard.writeText(response.invite_link);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate invite link',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      if (!user) return;
      const updates: Partial<User> = {};
      if (editedEmail !== user.email && editedEmail) {
        updates.email = editedEmail;
      }
      if (editedUserType !== user.user_type) {
        updates.user_type = editedUserType;
      }

      if (Object.keys(updates).length > 0) {
        await api.updateUser(updates);
        await refreshUser();
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
      }
      setIsEditing(false);
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error',
        description: err.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTeamSave = async () => {
    setIsUpdating(true);
    try {
      if (!team) return;
      await api.updateTeam(team.id, { name: editedTeamName });
      await refreshTeams();
      toast({
        title: 'Success',
        description: 'Team name updated successfully',
      });
      setIsEditingTeam(false);
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error',
        description: err.message || 'Failed to update team name',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateMemberRole = async (userId: number, role: Role) => {
    try {
      if (!team) return;
      const update: Partial<TeamMember> = { role };
      await api.updateTeamMember(team.id, userId, update);
      await loadTeamMembers();
      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      });
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error',
        description: err.message || 'Failed to update member role',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      if (!team) return;
      await api.removeTeamMember(team.id, userId);
      await loadTeamMembers();
      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error',
        description: err.message || 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  const handleBuyCredits = () => {
    if (!user?.email) {
      if (
        !confirm(
          'It is strongly recommended to set an email address for account recovery before making purchases. Click OK to proceed anyway, or Cancel to set your email first.'
        )
      ) {
        setIsEditing(true);
        document
          .querySelector('.space-y-8')
          ?.firstElementChild?.scrollIntoView({
            behavior: 'smooth',
          });
        return;
      }
    }
    if (!team) return;
    window.location.href = `${
      process.env.VITE_STRIPE_LINK ||
      'https://buy.stripe.com/'
    }?client_reference_id=promptstack___team_${team.id}`;
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedEmail(user?.email ?? '');
    setEditedUserType(user?.user_type ?? null);
  };

  const handleEdit = () => {
    setEditedEmail(user?.email ?? '');
    setEditedUserType(user?.user_type ?? null);
    setIsEditing(true);
  };

  return (
    <div className="flex h-screen">
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <XIcon className="h-4 w-4" />
        ) : (
          <MenuIcon className="h-4 w-4" />
        )}
      </Button>

      {/* Minimal Sidebar */}
      <div
        className={`${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static w-48 h-screen bg-background border-r transition-transform duration-200 ease-in-out z-40`}
      >
        <div className="flex flex-col h-full">
          <div className="p-3 border-b md:pl-3 pl-16">
            <Button
              variant="outline"
              className="w-full justify-start"
              size="sm"
              onClick={() => navigate('/chats/new')}
            >
              <HomeIcon className="mr-2 h-4 w-4" />
              Workspace
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container max-w-2xl mx-auto px-4 py-8 md:py-12">
          <div className="space-y-8 md:max-w-2xl md:mx-auto mt-12 md:mt-0">
            <Card className="shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle>User Settings</CardTitle>
                <CardDescription>
                  Manage your user account settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="group relative space-y-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={editedEmail}
                          onChange={(e) => setEditedEmail(e.target.value)}
                          placeholder="Enter email"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">
                          User Persona
                        </label>
                        <UserTypeSelect
                          value={editedUserType}
                          onChange={setEditedUserType}
                        />
                      </div>

                      <div className="space-x-2">
                        <Button onClick={handleSave} disabled={isUpdating}>
                          {isUpdating ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none">
                            Username
                          </label>
                          <div className="text-base">{user?.username}</div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none">
                            Email
                          </label>
                          <div className="text-base">
                            {user?.email || '(not set)'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none">
                            User Persona
                          </label>
                          <div className="text-base">
                            {user?.user_type &&
                              USER_TYPES[user.user_type]?.label}
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                              Theme
                            </label>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant={
                                  theme === 'light' ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => setTheme('light')}
                                className="w-24"
                              >
                                <Sun className="h-4 w-4 mr-2" />
                                Light
                              </Button>
                              <Button
                                variant={
                                  theme === 'dark' ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => setTheme('dark')}
                                className="w-24"
                              >
                                <Moon className="h-4 w-4 mr-2" />
                                Dark
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={handleEdit}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Profile</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle>Team Settings</CardTitle>
                <CardDescription>
                  Teams share projects and credits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="group relative space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Team Name
                    </label>
                    {isEditingTeam ? (
                      <div className="space-y-4">
                        <Input
                          value={editedTeamName}
                          onChange={(e) => setEditedTeamName(e.target.value)}
                          placeholder={team?.name || 'Enter team name'}
                          defaultValue={team?.name}
                        />
                        <div className="space-x-2">
                          <Button
                            onClick={handleTeamSave}
                            disabled={isUpdating}
                          >
                            {isUpdating ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditingTeam(false);
                              setEditedTeamName(team?.name || '');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-base">
                          {team?.name || 'Unnamed Team'}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setEditedTeamName(team?.name || '');
                                  setIsEditingTeam(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Team Name</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">
                      Credits Remaining
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold">
                        {team?.credits || 0}
                      </div>
                      <TooltipProvider>
                        <Tooltip open={shouldHighlightBuy}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="secondary"
                              size="default"
                              onClick={handleBuyCredits}
                            >
                              <PlusCircleIcon className="h-4 w-4 mr-2" />
                              Buy More Credits
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click here to purchase more credits!</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="border-t my-4" />
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Change Team
                    </label>
                    <Select
                      value={team?.id.toString()}
                      onValueChange={handleTeamChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle>Team Member Settings</CardTitle>
                <CardDescription>
                  Manage your team members and their roles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Button onClick={handleGenerateInvite}>
                      Generate Invite Link
                    </Button>
                    {inviteLink && (
                      <div className="space-y-2">
                        <Input value={inviteLink} readOnly />
                        <p className="text-sm text-muted-foreground">
                          Link copied to clipboard
                        </p>
                      </div>
                    )}
                  </div>

                  {isLoadingMembers ? (
                    <div className="text-center py-4">Loading members...</div>
                  ) : (
                    <div className="space-y-4">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between py-2"
                        >
                          <div>
                            <div className="font-medium">{member.username}</div>
                            <div className="text-sm text-muted-foreground">
                              {member.email ?? 'No email set'}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RoleSelect
                              value={member.role}
                              onChange={(role) => handleUpdateMemberRole(member.user_id, role)}
                              disabled={!!user?.id && member.user_id === user.id}
                              className="w-[110px]"
                            />
                            {!!user?.id && member.user_id !== user.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMember(member.user_id)}
                              >
                                <XIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component
export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}