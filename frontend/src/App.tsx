import { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, Outlet } from 'react-router-dom';
import AuthPage from '@/app/auth/page';
import WorkspacePage from '@/app/chats/page';
import WorkspaceLayout from '@/app/chats/layout';
import ProjectWorkspace from '@/app/chats/[chatId]/page';
import PublicChatPage from '@/app/public/chat/[shareId]/page';
import InvitePage from '@/app/invite/[token]/page';
import Settings from '@/app/settings/Settings';

function App() {
  const navigate = useNavigate();
  console.log('App rendering');

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token check:', token);
    if (!token && window.location.pathname !== '/auth') {
      navigate('/auth');
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route path="/public/chat/:shareId" element={<PublicChatPage />} />
      
      <Route element={<WorkspaceLayout><Outlet /></WorkspaceLayout>}>
        <Route path="/chats" element={<Navigate to="/chats/new" replace />} />
        <Route path="/chats/new" element={<WorkspacePage chatId="new" />} />
        <Route path="/chats/:chatId" element={<ProjectWorkspace />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      
      <Route path="/" element={<Navigate to="/chats/new" replace />} />
    </Routes>
  );
}

export default App;
