export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  provider?: string;
  isDeepResearch?: boolean;
  isWebSearch?: boolean;
  attachments?: { name: string; size: string; type: string }[];
  sources?: { title: string; url: string; snippet: string }[];
  isThinking?: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  dateGroup: 'Today' | 'Yesterday' | '7 days';
  createdAt: string;
  messages: ChatMessage[];
  model: string;
}

export interface SavedPrompt {
  id: string;
  category: string;
  title: string;
  prompt: string;
  iconName: string;
}
