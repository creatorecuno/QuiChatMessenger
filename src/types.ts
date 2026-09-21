export type OnlineStatus = 'online' | 'offline' | 'away';
export type MessageType = 'text' | 'image' | 'file' | 'voice';
export type LastSeenVisibility = 'everyone' | 'contacts' | 'nobody';
export type ContactRequestStatus = 'pending' | 'accepted' | 'declined';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  status: OnlineStatus;
  email: string;
  created_at: string;
  updated_at: string;
  last_seen_visibility?: LastSeenVisibility;
}

export interface ContactRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ContactRequestStatus;
  created_at: string;
  responded_at: string | null;
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
