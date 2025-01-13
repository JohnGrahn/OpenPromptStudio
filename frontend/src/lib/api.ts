export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface CreateAccountResponse {
  token: string;
  user: User;
}

export interface User {
  username: string;
}

export interface Team {
  id: number;
  name: string;
}

export interface Chat {
  id: number;
  name: string;
  is_public: boolean;
  project?: {
    id: number;
  };
}

export interface Project {
  id: number;
  name: string;
}

export interface ImageUploadResponse {
  upload_url: string;
  url: string;
}

export interface DeleteResponse {
  message: string;
}

class ApiClient {
  private async _post<T>(endpoint: string, data?: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || `API error: ${res.statusText}`);
    }

    return res.json();
  }

  private async _get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || `API error: ${res.statusText}`);
    }

    return res.json();
  }

  private async _delete<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || `API error: ${res.statusText}`);
    }

    return res.json();
  }

  private async _patch<T>(endpoint: string, data: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || `API error: ${res.statusText}`);
    }

    return res.json();
  }

  private async _get_stream(
    endpoint: string,
    params: Record<string, unknown> = {},
    onMessage?: (data: string) => void
  ): Promise<void> {
    if (typeof params === 'function' && !onMessage) {
      onMessage = params as (data: string) => void;
      params = {};
    }

    const searchParams = new URLSearchParams({
      ...params as Record<string, string>,
      token: localStorage.getItem('token') || '',
    });

    const eventSource = new EventSource(
      `${API_URL}${endpoint}?${searchParams.toString()}`
    );

    return new Promise((resolve, reject) => {
      eventSource.onmessage = (event) => {
        onMessage?.(event.data);
      };

      eventSource.onerror = (error) => {
        eventSource.close();
        console.warn(error);
        resolve();
      };

      eventSource.addEventListener('complete', () => {
        eventSource.close();
        resolve();
      });
    });
  }

  async createAccount(username: string, email: string): Promise<User> {
    const res = await this._post<CreateAccountResponse>('/api/auth/create', { username, email });
    localStorage.setItem('token', res.token);
    localStorage.setItem('username', res.user.username);
    return res.user;
  }

  async getCurrentUser(): Promise<User> {
    return this._get<User>('/api/auth/me');
  }

  async getTeams(): Promise<Team[]> {
    return this._get<Team[]>('/api/teams');
  }

  async getChats(): Promise<Chat[]> {
    return this._get<Chat[]>('/api/chats');
  }

  async createChat(chat: Partial<Chat>): Promise<Chat> {
    return this._post<Chat>('/api/chats', chat);
  }

  async getChat(chatId: number): Promise<Chat> {
    return this._get<Chat>(`/api/chats/${chatId}`);
  }

  async updateChat(chatId: number, chat: Partial<Chat>): Promise<Chat> {
    return this._patch<Chat>(`/api/chats/${chatId}`, chat);
  }

  async getTeamProjects(teamId: number): Promise<Project[]> {
    return this._get<Project[]>(`/api/teams/${teamId}/projects`);
  }

  async getProject(teamId: number, projectId: number): Promise<Project> {
    return this._get<Project>(`/api/teams/${teamId}/projects/${projectId}`);
  }

  async getProjectFile(teamId: number, projectId: number, filePath: string): Promise<string> {
    return this._get<string>(
      `/api/teams/${teamId}/projects/${projectId}/file/${filePath}`
    );
  }

  async getProjectGitLog(teamId: number, projectId: number): Promise<unknown> {
    return this._get(`/api/teams/${teamId}/projects/${projectId}/git-log`);
  }

  async getStackPacks(): Promise<unknown> {
    return this._get('/api/stacks');
  }

  async deleteChat(chatId: number): Promise<DeleteResponse> {
    return this._delete<DeleteResponse>(`/api/chats/${chatId}`);
  }

  async getImageUploadUrl(contentType: string): Promise<ImageUploadResponse> {
    return this._post<ImageUploadResponse>(`/api/uploads/image-upload-url`, {
      content_type: contentType,
    });
  }

  async updateProject(
    teamId: number,
    projectId: number,
    projectData: Partial<Project>
  ): Promise<Project> {
    return this._patch<Project>(
      `/api/teams/${teamId}/projects/${projectId}`,
      projectData
    );
  }

  async getProjectChats(teamId: number, projectId: number): Promise<Chat[]> {
    return this._get<Chat[]>(`/api/teams/${teamId}/projects/${projectId}/chats`);
  }

  async deleteProject(teamId: number, projectId: number): Promise<DeleteResponse> {
    return this._delete<DeleteResponse>(`/api/teams/${teamId}/projects/${projectId}`);
  }

  async restartProject(teamId: number, projectId: number): Promise<unknown> {
    return this._post(`/api/teams/${teamId}/projects/${projectId}/restart`);
  }

  async generateTeamInvite(teamId: number): Promise<{ code: string }> {
    return this._post<{ code: string }>(`/api/teams/${teamId}/invites`);
  }

  async joinTeamWithInvite(inviteCode: string): Promise<Team> {
    return this._post<Team>(`/api/teams/join/${inviteCode}`);
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    return this._patch<User>('/api/auth/me', updates);
  }

  async updateTeam(teamId: number, teamData: Partial<Team>): Promise<Team> {
    return this._patch<Team>(`/api/teams/${teamId}`, teamData);
  }

  async getTeamMembers(teamId: number): Promise<User[]> {
    return this._get<User[]>(`/api/teams/${teamId}/members`);
  }

  async updateTeamMember(
    teamId: number,
    userId: number,
    memberData: Partial<User>
  ): Promise<User> {
    return this._patch<User>(`/api/teams/${teamId}/members/${userId}`, memberData);
  }

  async removeTeamMember(teamId: number, userId: number): Promise<DeleteResponse> {
    return this._delete<DeleteResponse>(`/api/teams/${teamId}/members/${userId}`);
  }

  async zipProject(teamId: number, projectId: number): Promise<unknown> {
    return this._post(`/api/teams/${teamId}/projects/${projectId}/zip`);
  }

  async deployCreateGithub(
    teamId: number,
    projectId: number,
    deployData: Record<string, unknown>,
    onMessage?: (data: string) => void
  ): Promise<void> {
    return this._get_stream(
      `/api/teams/${teamId}/projects/${projectId}/deploy-create/github`,
      deployData,
      onMessage
    );
  }

  async deployStatusGithub(teamId: number, projectId: number): Promise<unknown> {
    return this._get(
      `/api/teams/${teamId}/projects/${projectId}/deploy-status/github`
    );
  }

  async deployPushGithub(teamId: number, projectId: number): Promise<unknown> {
    return this._post(
      `/api/teams/${teamId}/projects/${projectId}/deploy-push/github`
    );
  }

  async getPublicChat(shareId: string): Promise<Chat> {
    return this._get<Chat>(`/api/chats/public/${shareId}`);
  }

  async getPublicChatPreviewUrl(shareId: string): Promise<{ url: string }> {
    return this._get<{ url: string }>(`/api/chats/public/${shareId}/preview-url`);
  }

  async shareChat(chatId: number): Promise<Chat> {
    return this._post<Chat>(`/api/chats/${chatId}/share`);
  }

  async unshareChat(chatId: number): Promise<Chat> {
    return this._post<Chat>(`/api/chats/${chatId}/unshare`);
  }
}

export async function uploadImage(
  imageData: Blob | string,
  contentType: string
): Promise<string> {
  const { upload_url, url } = await api.getImageUploadUrl(contentType);

  let blob: Blob;
  if (imageData instanceof Blob) {
    blob = imageData;
  } else {
    const response = await fetch(imageData);
    blob = await response.blob();
  }

  await fetch(upload_url, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': contentType || blob.type,
    },
  });

  return url;
}

// Export singleton instance
export const api = new ApiClient();