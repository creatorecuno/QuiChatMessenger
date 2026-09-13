import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { ChatList } from './components/ChatList';

export function App() {
  const [session, setSession] = useState<any>(null);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const { error: signUpErr } = await supabase.auth.signUp({ email, password });
      if (signUpErr) setAuthError(signUpErr.message);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <form onSubmit={handleAuth} className="bg-slate-900 p-6 rounded-xl border border-slate-800 w-full max-w-sm space-y-4">
          <h2 className="text-xl font-bold text-center">Вход в QuiChat</h2>
          {authError && <div className="text-red-400 text-xs text-center">{authError}</div>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            required
          />
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 p-2 rounded text-sm font-semibold transition-colors">
            Войти / Зарегистрироваться
          </button>
        </form>
      </div>
    );
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
