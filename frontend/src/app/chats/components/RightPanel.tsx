'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PreviewTab } from './PreviewTab';
import { FilesTab } from './FilesTab';
import { ProjectTab } from './ProjectTab';
import { PanelRightIcon } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description?: string;
  custom_instructions?: string;
}

interface Status {
  status: string;
  [key: string]: any;
}

interface Message {
  role: string;
  content: string;
  images?: string[];
  id?: number;
  thinking_content?: string;
  [key: string]: any;
}

interface RightPanelProps {
  projectPreviewUrl: string | null;
  projectPreviewHash: number;
  projectFileTree: string[];
  project?: Project;
  projectPreviewPath: string;
  setProjectPreviewPath: (path: string) => void;
  onSendMessage: (message: Message) => void;
  status: string;
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}

export function RightPanel({
  projectPreviewUrl,
  projectPreviewHash,
  projectFileTree,
  project,
  projectPreviewPath,
  setProjectPreviewPath,
  onSendMessage,
  status,
  isOpen,
  onClose,
  chatId,
}: RightPanelProps) {
  const [selectedTab, setSelectedTab] = useState<'preview' | 'editor' | 'info'>('preview');

  return (
    <div className="flex flex-col w-full h-full md:pt-0 pt-14">
      <div className="border-b bg-background">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-4">
            <Button
              variant={selectedTab === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('preview')}
            >
              Preview
            </Button>
            <Button
              variant={selectedTab === 'editor' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('editor')}
            >
              Files
            </Button>
            <Button
              variant={selectedTab === 'info' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab('info')}
            >
              Project
            </Button>
          </div>
          {isOpen && (
            <div className="md:hidden">
              <Button variant="outline" size="sm" onClick={() => onClose()}>
                <PanelRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {selectedTab === 'preview' ? (
          <PreviewTab
            projectPreviewUrl={projectPreviewUrl}
            projectPreviewHash={projectPreviewHash.toString()}
            projectPreviewPath={projectPreviewPath}
            setProjectPreviewPath={setProjectPreviewPath}
          />
        ) : selectedTab === 'editor' && project ? (
          <FilesTab projectFileTree={projectFileTree} project={project} />
        ) : selectedTab === 'editor' ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No project selected
          </div>
        ) : project ? (
          <ProjectTab 
            project={project} 
            onSendMessage={({ content, images }) => onSendMessage({ 
              role: 'user',
              content,
              images: images || [],
            })} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No project selected
          </div>
        )}
      </div>
    </div>
  );
}