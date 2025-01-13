'use client';

import { ReactNode } from 'react';
import { useUser } from '@/context/user-context';
import { MainLayout } from '@/components/layout/main-layout';

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { user } = useUser();

  if (!user) return null;

  return <MainLayout>{children}</MainLayout>;
}