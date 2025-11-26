export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reaction?: 'up' | 'down' | null;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  pinned: boolean;
}

export interface ExportFormat {
  value: 'json' | 'markdown' | 'txt' | 'csv';
  label: string;
  icon: string;
  description: string;
}
