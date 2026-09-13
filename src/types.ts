export type OnlineStatus = 'online' | 'offline' | 'away';

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
}

export interface ConversationPreview {
  peer: Profile;
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

/*
 * Ниже — старые типы под мок-компонент SettingsModal.tsx.
 * Он пока не подключён к реальным данным (этап 2), поэтому
 * оставляю эти типы, чтобы файл не сломался структурно.
 */
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
