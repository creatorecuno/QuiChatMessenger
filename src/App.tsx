import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import { useConversations } from './hooks/useConversations';
import { useAppearance } from './hooks/useAppearance';
import { usePushNotifications } from './hooks/usePushNotifications';
import { canSeePresence, useSocial } from './hooks/useSocial';
import AuthModal from './components/AuthModal';
import NavRail from './components/NavRail';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import EmptyState from './components/EmptyState';
import InstallPrompt from './components/InstallPrompt';
import ProfileModal from './components/ProfileModal';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import SettingsModal from './components/SettingsModal';
import type { LastSeenVisibility, Profile } from './types';

const NOTIFICATIONS_KEY = 'quichat_notifications_enabled';

export function App() {
  const { session, user, profile, loading, signIn, signUp, signOut, updateProfile } = useAuth();
  const onlineIds = usePresence(user?.id);
  const social = useSocial(user?.id);
  const { conversations, loading: conversationsLoading, upsertPeer, totalUnread } = useConversations(user?.id, {
    mutedIds: social.mutedIds,
    blockedIds: social.blockedIds,
  });
  const { appearance, update: updateAppearance } = useAppearance();
  const { subscribe: subscribePush, unsubscribe: unsubscribePush } = usePushNotifications(user?.id);
  const [activeUser, setActiveUser] = useState<Profile | null>(null);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(NOTIFICATIONS_KEY) === 'true'
  );

  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread}) QuiChat` : 'QuiChat';
  }, [totalUnread]);

  useEffect(() => {
    if (activeUser && social.blockedIds.has(activeUser.id)) {
      setActiveUser(null);
    }
  }, [activeUser, social.blockedIds]);

  const handleSelectUser = (u: Profile) => {
    const relation = social.relationWith(u.id);
    if (relation.kind !== 'contact' && relation.kind !== 'self') return;
    setActiveUser(u);
    upsertPeer(u);
    setPeopleOpen(false);
  };

  const openSavedMessages = () => {
    if (!profile) return;
    setActiveUser(profile);
    setPeopleOpen(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    const req = social.incoming.find((row) => row.id === requestId);
    const ok = await social.acceptRequest(requestId);
    if (ok && req) {
      const peer = social.requestProfiles.get(req.requester_id);
      if (peer) {
        upsertPeer(peer);
        setActiveUser(peer);
        setPeopleOpen(false);
      }
    }
    return ok;
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

  const lastSeenVisibility: LastSeenVisibility =
    profile?.last_seen_visibility === 'contacts' || profile?.last_seen_visibility === 'nobody'
      ? profile.last_seen_visibility
      : 'everyone';

  const activeIsOnline = activeUser
    ? canSeePresence(profile?.id, activeUser, social.contactIds.has(activeUser.id)) &&
      onlineIds.has(activeUser.id)
    : false;

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
            peopleOpen={peopleOpen}
            incomingCount={social.incoming.length}
            onTogglePeople={() => setPeopleOpen((v) => !v)}
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
              mutedIds={social.mutedIds}
              contactIds={social.contactIds}
              incoming={social.incoming}
              outgoing={social.outgoing}
              relationWith={social.relationWith}
              profilesById={social.requestProfiles}
              activeUserId={activeUser?.id}
              peopleOpen={peopleOpen}
              onTogglePeople={() => setPeopleOpen((v) => !v)}
              onSelectUser={handleSelectUser}
              onOpenSaved={openSavedMessages}
              isSavedActive={activeUser?.id === profile.id}
              onOpenProfile={() => setProfileOpen(true)}
              onSignOut={signOut}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={handleToggleNotifications}
              onOpenSettings={() => setSettingsOpen(true)}
              onSendRequest={social.sendRequest}
              onAcceptRequest={handleAcceptRequest}
              onDeclineRequest={social.declineRequest}
              onCancelRequest={social.cancelRequest}
            />
          </div>

          <div className={`${activeUser ? 'flex' : 'hidden md:flex'} flex-1 h-full relative min-w-0`}>
            {activeUser ? (
              <ChatWindow
                currentUser={profile}
                peer={activeUser}
                isPeerOnline={activeIsOnline}
                conversations={conversations}
                muted={social.mutedIds.has(activeUser.id)}
                onBack={() => setActiveUser(null)}
                onToggleMute={() =>
                  social.mutedIds.has(activeUser.id)
                    ? social.unmutePeer(activeUser.id)
                    : social.mutePeer(activeUser.id)
                }
                onBlock={async () => {
                  await social.blockUser(activeUser.id);
                  setActiveUser(null);
                }}
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
            lastSeenVisibility={lastSeenVisibility}
            onUpdateLastSeen={(value) => updateProfile({ last_seen_visibility: value })}
          />
        </div>
      )}
    </MotionConfig>
  );
}

export default App;
