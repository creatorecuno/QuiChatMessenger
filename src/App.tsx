import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { ChatList } from './components/ChatList';
import { AuthModal } from './components/AuthModal';

export function App() {
  const [session, setSession] = useState<any>(null);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <ChatList 
        onSelectUser={(user) => setActiveUser(user)} 
        activeUserId={activeUser?.id} 
      />
      
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-6">
        {activeUser ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 text-white">
              {activeUser.username || activeUser.email}
            </h2>
            <p className="text-slate-400">Пользователь выбран. Чат готов к работе.</p>
          </div>
        ) : (
          <div className="text-center text-slate-500">
            Выберите пользователя из списка слева
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
