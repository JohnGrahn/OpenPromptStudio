'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WhatIsThisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatIsThisModal({ isOpen, onClose }: WhatIsThisModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What is Open Prompt Studio?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            Open Prompt Studio is an experimental tool for building and sharing AI chat
            interfaces. It&apos;s designed to help you:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and test different chat prompts</li>
            <li>Organize prompts into projects</li>
            <li>Share chat interfaces with others</li>
            <li>Collaborate with team members</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            This is an early version and features may change or be removed without
            notice. Your feedback helps shape the direction of the tool.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}