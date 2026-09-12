import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NavRail from './components/NavRail';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import EmptyState from './components/EmptyState';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import InstallPrompt from './components/InstallPrompt';
import { useAuth } from './hooks/useAuth';
import { supabase, Profile, MessageRow } from './lib/supabase';
import type { Message, AppSettings } from './types';
import { defaultSettings } from './data';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

interface ContactItem {
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

function profileToContact(p: Profile): ContactItem {
  const lastSeenMap: Record<string, string> = {
    online: 'Active now',
    away: 'Away',
    offline: 'Offline',
  };
  return {
    id: p.id,
    name: p.username,
    avatar: p.avatar_initials,
    status: p.online_status as 'online' | 'offline' | 'away',
    lastSeen: lastSeenMap[p.online_status] || 'Offline',
    unread: 0,
    isTyping: p.is_typing,
    isFavorite: false,
    bio: p.status_message,
  };
}

function messageRowToMessage(row: MessageRow, myId: string): Message {
  const d = new Date(row.created_at);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  let dateLabel: string;
  if (d.toDateString() === today.toDateString()) dateLabel = 'Today';
  else if (d.toDateString() === yesterday.toDateString()) dateLabel = 'Yesterday';
  else dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    id: row.id,
    senderId: row.sender_id === myId ? 'me' : row.sender_id,
    content: row.content,
    timestamp: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    type: 'text',
    status: (row.status as 'sent' | 'delivered' | 'read') || 'sent',
    date: dateLabel,
  };
}

export default function App() {
  const { session, user, profile, loading, signIn, signUp, signOut, updateProfile } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const channelsRef = useRef<Record<string, ReturnType<typeof supabase.channel>>>({});

  const activeContact = useMemo(
    () => contacts.find((c) => c.id === activeChatId) || null,
    [contacts, activeChatId]
  );

  const activeMessages = useMemo(
    () => (activeChatId ? messagesByChat[activeChatId] || [] : []),
    [messagesByChat, activeChatId]
  );

  // Show auth modal automatically when not signed in
  useEffect(() => {
    if (!loading && !session) {
      setAuthModalOpen(true);
    } else if (session) {
      setAuthModalOpen(false);
    }
  }, [loading, session]);

  // Fetch all profiles (contacts list)
  const fetchContacts = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching contacts:', error.message);
      return;
    }

    if (data) {
      const contactList = (data as Profile[]).map(profileToContact);
      setContacts(contactList);
    }
  }, [user]);

  // Fetch messages for a specific chat
  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error.message);
      return [];
    }

    if (data) {
      const rows = data as MessageRow[];
      const conversationMessages = rows
        .filter((r) =>
          (r.sender_id === user.id && r.receiver_id === otherUserId) ||
          (r.sender_id === otherUserId && r.receiver_id === user.id)
        )
        .map((r) => messageRowToMessage(r, user.id));
      return conversationMessages;
    }
    return [];
  }, [user]);

  // Load contacts when user signs in
  useEffect(() => {
    if (user) {
      fetchContacts();
    } else {
      setContacts([]);
      setMessagesByChat({});
      setActiveChatId(null);
    }
  }, [user, fetchContacts]);

  // Fetch messages when active chat changes
  useEffect(() => {
    if (!activeChatId || !user) return;

    (async () => {
      const msgs = await fetchMessages(activeChatId);
      setMessagesByChat((prev) => ({ ...prev, [activeChatId]: msgs }));
    })();
  }, [activeChatId, user, fetchMessages]);

  // Subscribe to realtime for new messages
  useEffect(() => {
    if (!user) return;

    const channelName = `messages:${user.id}`;
    // Clean up existing channel
    if (channelsRef.current[channelName]) {
      supabase.removeChannel(channelsRef.current[channelName]);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as MessageRow;
          const msg = messageRowToMessage(newRow, user.id);
          setMessagesByChat((prev) => ({
            ...prev,
            [newRow.sender_id]: [...(prev[newRow.sender_id] || []), msg],
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as MessageRow;
          const msg = messageRowToMessage(newRow, user.id);
          setMessagesByChat((prev) => ({
            ...prev,
            [newRow.receiver_id]: [...(prev[newRow.receiver_id] || []), msg],
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const updatedRow = payload.new as MessageRow;
          const chatPartnerId = updatedRow.sender_id === user.id ? updatedRow.receiver_id : updatedRow.sender_id;
          setMessagesByChat((prev) => ({
            ...prev,
            [chatPartnerId]: (prev[chatPartnerId] || []).map((m) =>
              m.id === updatedRow.id ? { ...m, status: updatedRow.status as 'sent' | 'delivered' | 'read' } : m
            ),
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const oldRow = payload.old as MessageRow;
          if (!oldRow) return;
          const chatPartnerId = oldRow.sender_id === user.id ? oldRow.receiver_id : oldRow.sender_id;
          setMessagesByChat((prev) => ({
            ...prev,
            [chatPartnerId]: (prev[chatPartnerId] || []).filter((m) => m.id !== oldRow.id),
          }));
        }
      )
      .subscribe();

    channelsRef.current[channelName] = channel;

    return () => {
      supabase.removeChannel(channel);
      delete channelsRef.current[channelName];
    };
  }, [user]);

  // Subscribe to profiles realtime for status updates
  useEffect(() => {
    if (!user) return;

    const channelName = `profiles:${user.id}`;
    if (channelsRef.current[channelName]) {
      supabase.removeChannel(channelsRef.current[channelName]);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          fetchContacts();
        }
      )
      .subscribe();

    channelsRef.current[channelName] = channel;

    return () => {
      supabase.removeChannel(channel);
      delete channelsRef.current[channelName];
    };
  }, [user, fetchContacts]);

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setMobileView('chat');
  };

  const handleSend = useCallback(async (content: string) => {
    if (!activeChatId || !user) return;
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: activeChatId,
        content,
        status: 'sent',
      });
    if (error) {
      console.error('Error sending message:', error.message);
    }
  }, [activeChatId, user]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    if (error) {
      console.error('Error deleting message:', error.message);
    }
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    await signIn(email, password);
  }, [signIn]);

  const handleSignUp = useCallback(async (email: string, password: string, username: string) => {
    await signUp(email, password, username);
  }, [signUp]);

  const handleUpdateProfile = useCallback(async (updates: Partial<Profile>) => {
    await updateProfile(updates);
  }, [updateProfile]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setSettingsOpen(false);
  }, [signOut]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={spring}
          className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center glow-accent-strong"
        >
          <span className="text-white font-bold text-2xl">Q</span>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
          <div className="ambient-glow w-[400px] h-[400px] bg-violet-600 top-[20%] left-[30%]" />
          <div className="ambient-glow w-[300px] h-[300px] bg-indigo-600 bottom-[20%] right-[30%]" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="text-center relative z-10"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-3xl gradient-accent flex items-center justify-center glow-accent-strong mx-auto mb-6"
            >
              <span className="text-white font-bold text-4xl">Q</span>
            </motion.div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">QuiChat</h1>
            <p className="text-sm text-zinc-500">Sign in to start chatting</p>
          </motion.div>
        </div>
        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
        />
        <InstallPrompt />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Ambient background glows */}
      <div className="ambient-glow w-[500px] h-[500px] bg-violet-600 top-[-100px] left-[10%]" />
      <div className="ambient-glow w-[400px] h-[400px] bg-indigo-600 bottom-[-100px] right-[5%]" />

      {/* Nav rail */}
      <NavRail active="chats" onNavigate={() => {}} onSignOut={handleSignOut} />

      {/* Chat list panel */}
      <div
        className={`w-full md:w-[360px] lg:w-[380px] shrink-0 glass border-r border-white/5 relative z-10 ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        } flex-col`}
      >
        <ChatList
          contacts={contacts}
          activeChatId={activeChatId}
          onSelect={handleSelectChat}
          onOpenSettings={() => setSettingsOpen(true)}
          profileName={profile?.username || 'You'}
          profileStatus={profile?.status_message || 'Available'}
        />
      </div>

      {/* Conversation panel */}
      <div
        className={`flex-1 relative z-10 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-col`}
      >
        <AnimatePresence mode="wait">
          {activeContact ? (
            <motion.div
              key={activeContact.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={spring}
              className="flex-1 flex flex-col h-full"
            >
              <ChatWindow
                contact={activeContact}
                messages={activeMessages}
                onBack={() => setMobileView('list')}
                onSend={handleSend}
                onDeleteMessage={handleDeleteMessage}
              />
            </motion.div>
          ) : (
            <EmptyState key="empty" />
          )}
        </AnimatePresence>
      </div>

      {/* Install app prompt */}
      <InstallPrompt />

      {/* Settings modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={profile ? {
          name: profile.username,
          avatar: profile.avatar_initials,
          statusMessage: profile.status_message,
          status: profile.online_status as 'online' | 'offline' | 'away',
        } : {
          name: 'You',
          avatar: 'ME',
          statusMessage: 'Available',
          status: 'online',
        }}
        settings={settings}
        onUpdateProfile={(p) => handleUpdateProfile({
          username: p.name,
          avatar_initials: p.avatar,
          status_message: p.statusMessage,
          online_status: p.status,
        })}
        onUpdateSettings={setSettings}
      />
    </div>
  );
}
