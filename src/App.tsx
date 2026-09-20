import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import { useConversations } from './hooks/useConversations';
import { useAppearance } from './hooks/useAppearance';
import { usePushNotifications } from './hooks/usePushNotifications';
import AuthModal from './components/AuthModal';
import NavRail from './components/NavRail';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import EmptyState from './components/EmptyState';
import InstallPrompt from './components/InstallPrompt';
import ProfileModal from './components/ProfileModal';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import SettingsModal from './components/SettingsModal';
import type { Profile } from './types';

const NOTIFICATIONS_KEY = 'quichat_notifications_enabled';

export function App() {
  const { session, user, profile, loading, signIn, signUp, signOut, updateProfile } = useAuth();
  const onlineIds = usePresence(user?.id);
  const { conversations, loading: conversationsLoading, upsertPeer, totalUnread } = useConversations(user?.id);
  const { appearance, update: updateAppearance } = useAppearance();
  const { subscribe: subscribePush, unsubscribe: unsubscribePush } = usePushNotifications(user?.id);
  const [activeUser, setActiveUser] = useState<Profile | null>(null);
  const [browseAll, setBrowseAll] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
      await unsubscribePush();
      return;
    }
    if (typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
      const permission =
        Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem(NOTIFICATIONS_KEY, 'true');
        setNotificationsEnabled(true);
        await subscribePush();
        return;
      }
    }
  };

  return (
    <MotionConfig reducedMotion={appearance.reduceMotion ? 'always' : 'never'}>
      {loading ? (
        <div className="h-screen bg-[#0a0a0f] flex items-center justify-center" style={{ height: '100dvh' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-violet-500" />
        </div>
      ) : !session || !user || !profile ? (
        <div className="h-screen bg-[#0a0a0f] relative overflow-hidden" style={{ height: '100dvh' }}>
          <div className="ambient-glow ambient-glow-accent w-[500px] h-[500px] -top-40 -left-40" />
          <div className="ambient-glow ambient-glow-accent w-[500px] h-[500px] -bottom-40 -right-40" />
          <AuthModal
            open
            onClose={() => {}}
            onSignIn={signIn}
            onSignUp={signUp}
            onOpenPrivacy={() => setPrivacyOpen(true)}
          />
          <PrivacyPolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
        </div>
      ) : (
        <div
          className="flex h-screen w-screen bg-[#0a0a0f] text-white overflow-hidden relative"
          style={{ height: '100dvh' }}
        >
          <div className="ambient-glow ambient-glow-accent w-[500px] h-[500px] -top-40 -left-40" />
          <div className="ambient-glow ambient-glow-accent w-[500px] h-[500px] -bottom-40 -right-40" />

          <InstallPrompt />

          <NavRail
            currentUser={profile}
            browseAll={browseAll}
            onToggleBrowseAll={() => setBrowseAll((v) => !v)}
            onOpenProfile={() => setProfileOpen(true)}
            onSignOut={signOut}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={handleToggleNotifications}
            onOpenSettings={() => setSettingsOpen(true)}
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
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </div>

          <div className={`${activeUser ? 'flex' : 'hidden md:flex'} flex-1 h-full relative min-w-0`}>
            {activeUser ? (
              <ChatWindow
                currentUser={profile}
                peer={activeUser}
                isPeerOnline={onlineIds.has(activeUser.id)}
                conversations={conversations}
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
          <SettingsModal
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            appearance={appearance}
            onUpdate={updateAppearance}
          />
        </div>
      )}
    </MotionConfig>
  );
}

export default App;
