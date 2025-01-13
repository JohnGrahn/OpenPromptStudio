'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@/context/user-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProjectWebSocketService } from '@/lib/project-websocket';
import { api } from '@/lib/api';
import { Chat } from './components/Chat';
import { RightPanel } from './components/RightPanel';
import { useToast } from '@/hooks/use-toast';
import Splitter from '@/components/ui/splitter';

interface Message {
  role: string;
  content: string;
  images?: string[];
  id?: number;
  thinking_content?: string;
  [key: string]: any;
}

interface Chat {
  id: number;
  name: string;
  is_public: boolean;
  project?: {
    id: number;
  };
}

interface CreateChatRequest {
  name: string;
  stack_pack_id: number | null;
  project_id: string | null;
  team_id: number | undefined;
  seed_prompt: string;
  is_public: boolean;
}

interface SocketData {
  for_type: string;
  sandbox_status?: Status;
  tunnels?: { [key: number]: string };
  file_paths?: string[];
  message?: Message;
  follow_ups?: string[];
  navigate_to?: string;
  content?: string;
  thinking_content?: string;
}

const statusMap = {
  NEW_CHAT: { status: 'Ready', color: 'bg-gray-500', animate: false },
  DISCONNECTED: {
    status: 'Disconnected',
    color: 'bg-gray-500',
    animate: false,
  },
  OFFLINE: { status: 'Offline', color: 'bg-gray-500', animate: false },
  BUILDING: {
    status: 'Setting up (~1m)',
    color: 'bg-yellow-500',
    animate: true,
  },
  BUILDING_WAITING: {
    status: 'Setting up (~3m)',
    color: 'bg-yellow-500',
    animate: true,
  },
  READY: { status: 'Ready', color: 'bg-green-500', animate: false },
  WORKING: { status: 'Coding...', color: 'bg-green-500', animate: true },
  WORKING_APPLYING: {
    status: 'Applying...',
    color: 'bg-green-500',
    animate: true,
  },
  CONNECTING: {
    status: 'Connecting...',
    color: 'bg-yellow-500',
    animate: true,
  },
} as const;

type Status = keyof typeof statusMap;

interface WorkspacePageProps {
  chatId: string;
}

export default function WorkspacePage({ chatId }: WorkspacePageProps) {
  const { addChat, team, projects, chats, refreshProjects } = useUser();
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatTitle, setChatTitle] = useState<string>('New Chat');
  const [projectPreviewUrl, setProjectPreviewUrl] = useState<string | null>(
    null
  );
  const [projectPreviewPath, setProjectPreviewPath] = useState<string>('/');
  const [projectFileTree, setProjectFileTree] = useState<string[]>([]);
  const [projectStackPackId, setProjectStackPackId] = useState<number | null>(
    null
  );
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  const [previewHash, setPreviewHash] = useState<number>(1);
  const [status, setStatus] = useState<Status>('NEW_CHAT');
  const webSocketRef = useRef<ProjectWebSocketService | null>(null);
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const chat = chats?.find((c) => c.id === +chatId);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/');
    }
    if (!chatId) {
      router.push('/chats/new');
    }
  }, [chatId, router]);

  const initializeWebSocket = async (wsProjectId: string) => {
    if (webSocketRef.current) {
      webSocketRef.current.disconnect();
    }
    const ws = new ProjectWebSocketService(parseInt(wsProjectId));
    webSocketRef.current = ws;

    const connectWS = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          ws.connect();
          if (!ws.ws) {
            reject(new Error('WebSocket not initialized'));
            return;
          }
          ws.ws.onopen = () => resolve();
          ws.ws.onerror = (error) => reject(error);
          ws.ws.onmessage = (event) => {
            const data = JSON.parse(event.data) as SocketData;
            handleSocketMessage(data);
          };
          ws.ws.onclose = (e) => {
            setStatus('DISCONNECTED');
            console.log('WebSocket connection closed', e.code, e.reason);
            if ([1002, 1003].includes(e.code)) {
              initializeWebSocket(chatId);
            }
          };
          setTimeout(
            () => reject(new Error('WebSocket connection timeout')),
            5000
          );
        });

        const handleSocketMessage = (data: SocketData) => {
          console.log('handleMessage', data);
          if (data.for_type === 'status') {
            handleStatus(data);
          } else if (data.for_type === 'chat_update') {
            handleChatUpdate(data);
          } else if (data.for_type === 'chat_chunk') {
            handleChatChunk(data);
          }
        };

        const handleStatus = (data: SocketData) => {
          if (data.sandbox_status) {
            setStatus(data.sandbox_status);
          }
          if (data.tunnels) {
            setProjectPreviewUrl(data.tunnels[3000]);
          }
          if (data.file_paths) {
            setProjectFileTree(data.file_paths);
          }
        };

        const handleChatUpdate = (data: SocketData) => {
          setMessages((prev) => {
            const existingMessageIndex = prev.findIndex(
              (m) => m.id === data.message?.id
            );
            if (existingMessageIndex >= 0) {
              return [
                ...prev.slice(0, existingMessageIndex),
                data.message!,
                ...prev.slice(existingMessageIndex + 1),
              ];
            }
            const lastMessage = prev[prev.length - 1];
            if (
              lastMessage?.role === 'assistant' &&
              data.message?.role === 'assistant'
            ) {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: data.message.content },
              ];
            }
            return [...prev, data.message!];
          });
          if (data.follow_ups) {
            setSuggestedFollowUps(data.follow_ups);
          }
          if (data.navigate_to) {
            setProjectPreviewPath(data.navigate_to);
          }
          setPreviewHash((prev) => prev + 1);
        };

        const handleChatChunk = (data: SocketData) => {
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  content: lastMessage.content + data.content!,
                  thinking_content:
                    (lastMessage?.thinking_content || '') +
                    data.thinking_content!,
                },
              ];
            }
            return [
              ...prev,
              {
                role: 'assistant',
                content: data.content!,
                thinking_content: data.thinking_content!,
              },
            ];
          });
        };

        return ws;
      } catch (error) {
        setStatus('DISCONNECTED');
      }
    };

    await connectWS();
    return { ws };
  };

  useEffect(() => {
    if (chatId !== 'new') {
      initializeWebSocket(chatId).catch((error) => {
        console.error('Failed to initialize WebSocket:', error);
      });
    }
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.disconnect();
      }
    };
  }, [chatId]);

  const handleStackPackSelect = (stackPackId: number | null) => {
    setProjectStackPackId(stackPackId);
  };

  const handleProjectSelect = (projectId: number | null) => {
    setProjectId(projectId?.toString() ?? null);
  };

  const handleSendMessage = async (message: { content: string; images?: string[] }) => {
    if (!message.content.trim() && message.images?.length === 0) return;

    const userMessage: Message = {
      role: 'user',
      content: message.content,
      images: message.images || [],
    };
    if (chatId === 'new') {
      try {
        const chatRequest: CreateChatRequest = {
          name: message.content,
          stack_pack_id: projectStackPackId,
          project_id: projectId,
          team_id: team?.id,
          seed_prompt: message.content,
          is_public: false,
        };
        const chat = await api.createChat(chatRequest);
        toast({
          title: 'Chat created',
          description: 'Setting things up...',
        });
        await refreshProjects();
        addChat(chat);
        router.push(
          `/chats/${chat.id}?message=${encodeURIComponent(
            JSON.stringify(userMessage)
          )}`
        );
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        if (error.message.includes('credits')) {
          router.push('/settings?buy=true');
        }
      }
    } else {
      setStatus((prevStatus) => 'WORKING' as Status);
      webSocketRef.current!.sendMessage(userMessage);
    }
  };

  useEffect(() => {
    (async () => {
      if (chatId !== 'new') {
        setStatus((prevStatus) => 'DISCONNECTED' as Status);
        const chat = await api.getChat(parseInt(chatId));
        setChatTitle(chat.name);
        setMessages([]);
        setProjectId(chat.project?.id?.toString() ?? null);
      } else {
        setChatTitle('New Chat');
        setMessages([]);
        setProjectPreviewUrl(null);
        setProjectFileTree([]);
        setStatus((prevStatus) => 'NEW_CHAT' as Status);
      }
    })();
  }, [chatId]);

  useEffect(() => {
    (async () => {
      if (status === 'READY') {
        const params = new URLSearchParams(window.location.search);
        const messageParam = params.get('message');
        if (messageParam) {
          try {
            const message = JSON.parse(decodeURIComponent(messageParam));
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.delete('message');
            router.replace(
              `${window.location.pathname}?${searchParams.toString()}`,
              {
                scroll: false,
              }
            );
            await webSocketRef.current!.sendMessage(message);
          } catch (error) {
            console.error('Failed to process message parameter:', error);
          }
        }
      }
    })();
  }, [chatId, status, router]);

  const handleReconnect = async () => {
    if (chatId !== 'new') {
      try {
        setStatus('CONNECTING');
        await initializeWebSocket(chatId);
      } catch (error) {
        console.error('Failed to reconnect:', error);
        setStatus('DISCONNECTED');
      }
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        {!isPreviewOpen && (
          <div className="md:hidden fixed top-4 right-4 z-40">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            >
              View
            </Button>
          </div>
        )}

        {isMobile ? (
          <div className="flex-1">
            <div className={`h-full ${isPreviewOpen ? 'hidden' : 'block'}`}>
              <Chat
                chat={chat}
                messages={messages}
                onSendMessage={handleSendMessage}
                projectTitle={chatTitle}
                status={status}
                onProjectSelect={handleProjectSelect}
                onStackSelect={handleStackPackSelect}
                showStackPacks={chatId === 'new'}
                suggestedFollowUps={suggestedFollowUps}
                onReconnect={handleReconnect}
              />
            </div>
            <div className={`h-full ${isPreviewOpen ? 'block' : 'hidden'}`}>
              <RightPanel
                onSendMessage={handleSendMessage}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                projectPreviewUrl={projectPreviewUrl}
                projectPreviewPath={projectPreviewPath}
                setProjectPreviewPath={setProjectPreviewPath}
                projectPreviewHash={previewHash}
                projectFileTree={projectFileTree}
                project={projects.find(
                  (p) => p.id.toString() === projectId
                )}
                chatId={chatId}
                status={status}
              />
            </div>
          </div>
        ) : (
          <Splitter
            defaultLeftWidth="60%"
            minLeftWidth={400}
            minRightWidth={400}
            className="h-full"
          >
            <Chat
              chat={chat}
              messages={messages}
              onSendMessage={handleSendMessage}
              projectTitle={chatTitle}
              status={status}
              onProjectSelect={handleProjectSelect}
              onStackSelect={handleStackPackSelect}
              showStackPacks={chatId === 'new'}
              suggestedFollowUps={suggestedFollowUps}
              onReconnect={handleReconnect}
            />
            <RightPanel
              onSendMessage={handleSendMessage}
              isOpen={isPreviewOpen}
              onClose={() => setIsPreviewOpen(false)}
              projectPreviewUrl={projectPreviewUrl}
              projectPreviewPath={projectPreviewPath}
              setProjectPreviewPath={setProjectPreviewPath}
              projectPreviewHash={previewHash}
              projectFileTree={projectFileTree}
              project={projects.find(
                (p) => p.id.toString() === projectId
              )}
              chatId={chatId}
              status={status}
            />
          </Splitter>
        )}
      </div>
    </div>
  );
}