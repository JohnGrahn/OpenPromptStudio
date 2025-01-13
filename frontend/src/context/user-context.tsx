'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import type { User, Team, Chat, Project } from '@/lib/api';

interface UserContextType {
  user: User | null;
  team: Team | null;
  teams: Team[];
  chats: Chat[];
  projects: Project[];
  createAccount: (username: string, email: string) => Promise<User>;
  addChat: (chat: Chat) => void;
  refreshChats: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshTeams: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  team: null,
  teams: [],
  chats: [],
  projects: [],
  createAccount: async () => ({ username: '' }),
  addChat: () => {},
  refreshChats: async () => {},
  refreshProjects: async () => {},
  refreshTeams: async () => {},
  refreshUser: async () => {},
});

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchUserData = async () => {
    const [fetchedChats, fetchedTeams] = await Promise.all([api.getChats(), api.getTeams()]);

    setChats(fetchedChats);
    setTeams(fetchedTeams);

    if (!localStorage.getItem('team') && fetchedTeams.length > 0) {
      setTeam(fetchedTeams[0]);
      localStorage.setItem('team', fetchedTeams[0].id.toString());
    } else {
      setTeam(fetchedTeams.find((t) => t.id.toString() === localStorage.getItem('team')) || null);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('token')) {
      api
        .getCurrentUser()
        .then((user) => setUser(user))
        .catch((e: Error) => {
          alert(e.message);
        });
      fetchUserData();
    }
  }, []);

  useEffect(() => {
    if (team?.id) {
      api.getTeamProjects(team.id).then((fetchedProjects) => setProjects(fetchedProjects));
    }
  }, [team?.id]);

  const createAccount = async (username: string, email: string): Promise<User> => {
    const newUser = await api.createAccount(username, email);
    setUser(newUser);
    await fetchUserData();
    return newUser;
  };

  const addChat = (chat: Chat) => {
    setChats((prev) => [...prev, chat]);
  };

  const refreshChats = async () => {
    const fetchedChats = await api.getChats();
    setChats(fetchedChats);
  };

  const refreshProjects = async () => {
    if (!team?.id) return;
    const fetchedProjects = await api.getTeamProjects(team.id);
    setProjects(fetchedProjects);
  };

  const refreshTeams = async () => {
    const fetchedTeams = await api.getTeams();
    setTeams(fetchedTeams);
    setTeam(fetchedTeams.find((t) => t.id.toString() === localStorage.getItem('team')) || null);
  };

  const refreshUser = async () => {
    const fetchedUser = await api.getCurrentUser();
    setUser(fetchedUser);
  };

  const contextValue: UserContextType = {
    user,
    chats,
    teams,
    team,
    projects,
    createAccount,
    addChat,
    refreshUser,
    refreshChats,
    refreshProjects,
    refreshTeams,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);