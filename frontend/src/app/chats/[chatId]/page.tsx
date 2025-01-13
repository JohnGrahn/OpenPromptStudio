'use client';

import { useParams, Navigate } from 'react-router-dom';
import WorkspacePage from '../page';

interface ChatParams {
  [key: string]: string | undefined;
  chatId: string;
}

export default function ProjectWorkspace() {
  const params = useParams<ChatParams>();
  
  if (!params.chatId) {
    return <Navigate to="/chats" replace />;
  }

  return <WorkspacePage chatId={params.chatId} />;
}