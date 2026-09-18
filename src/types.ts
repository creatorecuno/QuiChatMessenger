export type OnlineStatus = 'online' | 'offline' | 'away';
export type MessageType = 'text' | 'image' | 'file' | 'voice';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  status: OnlineStatus;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
  message_type: MessageType;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  duration_seconds: number | null;
  pinned: boolean;
  edited: boolean;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface ConversationPreview {
  peer: Profile;
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
  statusMessage: string;
  status: OnlineStatus;
}

export interface AppSettings {
  notifications: boolean;
  messageSound: boolean;
  readReceipts: boolean;
  typingIndicators: boolean;
  theme: 'midnight' | 'aurora' | 'ocean' | 'sunset';
}
