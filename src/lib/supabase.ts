import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface Profile {
  id: string;
  username: string;
  avatar_initials: string;
  status_message: string;
  online_status: 'online' | 'away' | 'offline';
  is_typing: boolean;
  created_at: string;
}

export interface MessageRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  status: string;
  created_at: string;
}
