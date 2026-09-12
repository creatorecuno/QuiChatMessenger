export type MessageType = 'text' | 'image' | 'voice';

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: MessageType;
  status: 'sent' | 'delivered' | 'read';
  date: string;
}

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  unread: number;
  isTyping: boolean;
  isFavorite: boolean;
  bio: string;
}

export interface Conversation {
  contactId: string;
  messages: Message[];
}

export interface UserProfile {
  name: string;
  avatar: string;
  statusMessage: string;
  status: 'online' | 'offline' | 'away';
}

export interface AppSettings {
  notifications: boolean;
  messageSound: boolean;
  readReceipts: boolean;
  typingIndicators: boolean;
  theme: 'midnight' | 'aurora' | 'ocean' | 'sunset';
}
