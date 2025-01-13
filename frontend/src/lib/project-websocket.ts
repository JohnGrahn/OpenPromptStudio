import { API_URL } from '@/lib/api';

interface Message {
  role: string;
  content: string;
  images?: string[];
  id?: number;
  thinking_content?: string;
  [key: string]: unknown;
}

interface ChatType {
  id: number;
  name: string;
  messages: Message[];
  project: {
    id: string;
  };
  is_public?: boolean;
}

interface Status {
  status: string;
  [key: string]: unknown;
}

export class ProjectWebSocketService {
  public ws: WebSocket | null;
  private chatId: number;

  constructor(chatId: number) {
    this.ws = null;
    this.chatId = chatId;
  }

  connect(): void {
    const wsUrl = API_URL;
    const wsProtocol = wsUrl.startsWith('https') ? 'wss://' : 'ws://';
    const baseUrl = wsUrl.replace(/^https?:\/\//, '');

    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    this.ws = new WebSocket(
      `${wsProtocol}${baseUrl}/api/ws/chat/${this.chatId}?token=${token}`
    );
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(message: Message): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  public onOpen(callback: () => void) {
    if (this.ws) {
      this.ws.onopen = callback;
    }
  }

  public onError(callback: (error: Event) => void) {
    if (this.ws) {
      this.ws.onerror = callback;
    }
  }

  public onMessage(callback: (event: MessageEvent) => void) {
    if (this.ws) {
      this.ws.onmessage = callback;
    }
  }

  public onClose(callback: (event: CloseEvent) => void) {
    if (this.ws) {
      this.ws.onclose = callback;
    }
  }
}