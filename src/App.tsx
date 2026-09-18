import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import { useConversations } from './hooks/useConversations';
import AuthModal from './components/AuthModal';
import NavRail from './components/NavRail';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import EmptyState from './components/EmptyState';
import InstallPrompt from './components/InstallPrompt';
import ProfileModal from './components/ProfileModal';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import type { Profile } from './types';

const NOTIFICATIONS_KEY = 'quichat_notifications_enabled';

export function App() {
  const { session, user, profile, loading, signIn, signUp, signOut, updateProfile } = useAuth();
  const onlineIds = usePresence(user?.id);
  const { conversations, loading: conversationsLoading, upsertPeer, totalUnread } = useConversations(user?.id);
  const [activeUser, setActiveUser] = useState<Profile | null>(null);
  const [browseAll, setBrowseAll] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(NOTIFICATIONS_KEY) === 'true'
  );

  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread}) QuiChat` : 'QuiChat';
  }, [totalUnread]);

  const handleSelectUser = (u: Profile) => {
    setActiveUser(u);
    upsertPeer(u);
    setBrowseAll(false);
  };

  const openSavedMessages = () => {
    if (!profile) return;
    setActiveUser(profile);
    setBrowseAll(false);
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      localStorage.setItem(NOTIFICATIONS_KEY, 'false');
      setNotificationsEnabled(false);
      return;
    }
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      localStorage.setItem(NOTIFICATIONS_KEY, 'true');
      setNotificationsEnabled(true);
      return;
    }
    if (Notification.permission === 'denied') return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(NOTIFICATIONS_KEY, 'true');
      setNotificationsEnabled(true);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex items-center justify-center" style={{ height: '100dvh' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-violet-500" />
      </div>
    );
  }

  if (!session || !user || !profile) {
    return (
      <div className="h-screen bg-[#0a0a0f] relative overflow-hidden" style={{ height: '100dvh' }}>
        <div className="ambient-glow bg-violet-600 w-[500px] h-[500px] -top-40 -left-40" />
        <div className="ambient-glow bg-indigo-600 w-[500px] h-[500px] -bottom-40 -right-40" />
        <AuthModal
          open
          onClose={() => {}}
          onSignIn={signIn}
          onSignUp={signUp}
          onOpenPrivacy={() => setPrivacyOpen(true)}
        />
        <PrivacyPolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0f] text-white overflow-hidden relative" style={{ height: '100dvh' }}>
      <div className="ambient-glow bg-violet-600 w-[500px] h-[500px] -top-40 -left-40" />
      <div className="ambient-glow bg-indigo-600 w-[500px] h-[500px] -bottom-40 -right-40" />

      <InstallPrompt />

      <NavRail
        currentUser={profile}
        browseAll={browseAll}
        onToggleBrowseAll={() => setBrowseAll((v) => !v)}
        onOpenProfile={() => setProfileOpen(true)}
        onSignOut={signOut}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
      />

      <div className={`${activeUser ? 'hidden md:flex' : 'flex'} w-full md:w-auto h-full relative`}>
        <ChatList
          currentUser={profile}
          conversations={conversations}
          conversationsLoading={conversationsLoading}
          onlineIds={onlineIds}
          activeUserId={activeUser?.id}
          browseAll={browseAll}
          onToggleBrowseAll={() => setBrowseAll((v) => !v)}
          onSelectUser={handleSelectUser}
          onOpenSaved={openSavedMessages}
          isSavedActive={activeUser?.id === profile.id}
          onOpenProfile={() => setProfileOpen(true)}
          onSignOut={signOut}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={handleToggleNotifications}
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

      <ProfileModal
        open={profileOpen}
        profile={profile}
        onClose={() => setProfileOpen(false)}
        onSave={updateProfile}
      />
      <PrivacyPolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  );
}

export default App;
