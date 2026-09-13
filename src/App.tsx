import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import { useConversations } from './hooks/useConversations';
import AuthModal from './components/AuthModal';
import NavRail from './components/NavRail';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import EmptyState from './components/EmptyState';
import InstallPrompt from './components/InstallPrompt';
import type { Profile } from './types';

export function App() {
  const { session, user, profile, loading, signIn, signUp, signOut } = useAuth();
  const onlineIds = usePresence(user?.id);
  const { conversations, loading: conversationsLoading, upsertPeer } = useConversations(user?.id);
  const [activeUser, setActiveUser] = useState<Profile | null>(null);

  const handleSelectUser = (u: Profile) => {
    setActiveUser(u);
    upsertPeer(u);
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-violet-500" />
      </div>
    );
  }

  if (!session || !user || !profile) {
    return (
      <div className="h-screen bg-[#0a0a0f] relative overflow-hidden">
        <div className="ambient-glow bg-violet-600 w-[500px] h-[500px] -top-40 -left-40" />
        <div className="ambient-glow bg-indigo-600 w-[500px] h-[500px] -bottom-40 -right-40" />
        <AuthModal open onClose={() => {}} onSignIn={signIn} onSignUp={signUp} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      <div className="ambient-glow bg-violet-600 w-[500px] h-[500px] -top-40 -left-40" />
      <div className="ambient-glow bg-indigo-600 w-[500px] h-[500px] -bottom-40 -right-40" />

      <InstallPrompt />

      <NavRail currentUser={profile} onSignOut={signOut} />

      <div className={`${activeUser ? 'hidden md:flex' : 'flex'} w-full md:w-auto h-full relative`}>
        <ChatList
          currentUserId={user.id}
          conversations={conversations}
          conversationsLoading={conversationsLoading}
          onlineIds={onlineIds}
          activeUserId={activeUser?.id}
          onSelectUser={handleSelectUser}
        />
      </div>

      <div className={`${activeUser ? 'flex' : 'hidden md:flex'} flex-1 h-full relative min-w-0`}>
        {activeUser ? (
          <ChatWindow
            currentUser={profile}
            peer={activeUser}
            isPeerOnline={onlineIds.has(activeUser.id)}
            onBack={() => setActiveUser(null)}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

export default App;
