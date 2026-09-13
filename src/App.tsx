import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { ChatList } from './components/ChatList';
import { ChatArea } from './components/ChatArea';
import { NavRail } from './components/NavRail';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';

export function App() {
  const [session, setSession] = useState<any>(null);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) {
    return <AuthModal isOpen={true} onClose={() => {}} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <NavRail onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden">
        <ChatList 
          onSelectUser={(user) => setActiveUser(user)} 
          activeUserId={activeUser?.id} 
        />
        
        <ChatArea 
          recipient={activeUser} 
          currentUserId={session.user.id} 
        />
      </div>

      {isSettingsOpen && (
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </div>
  );
}

export default App;
