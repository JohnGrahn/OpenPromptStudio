'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserType {
  value: string;
  label: string;
  description: string;
}

const USER_TYPES: Record<string, UserType> = {
  web_designer: {
    value: 'web_designer',
    label: 'Web Designer',
    description: 'Focus on web design and UI/UX with basic coding knowledge',
  },
  learning_to_code: {
    value: 'learning_to_code',
    label: 'Learning to Code',
    description: 'New to programming, learning the basics',
  },
  expert_developer: {
    value: 'expert_developer',
    label: 'Expert Developer',
    description: 'Experienced in software development and architecture',
  },
};

export interface UserTypeSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export function UserTypeSelect({ value, onChange, className }: UserTypeSelectProps) {
  return (
    <div className={className}>
      <Select
        value={value ?? ''}
        onValueChange={(newValue) => onChange(newValue || null)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select user type">
            {value && USER_TYPES[value]?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(USER_TYPES).map(([type, { label, description }]) => (
            <SelectItem key={type} value={type}>
              <div className="flex flex-col gap-1">
                <div>{label}</div>
                <div className="text-sm text-muted-foreground">{description}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { USER_TYPES }; 