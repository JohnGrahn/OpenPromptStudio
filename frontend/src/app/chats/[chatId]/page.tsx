'use client';

import { useParams } from 'react-router-dom';
import WorkspacePage from '../page';

interface ChatParams {
  chatId: string;
}

export default function ProjectWorkspace() {
  const params = useParams<ChatParams>();

  return <WorkspacePage chatId={params.chatId} />;
}