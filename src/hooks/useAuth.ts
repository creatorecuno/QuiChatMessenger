import { createClient, Session, User } from '@supabase/supabase-js';
import { useEffect, useState, useCallback } from 'react';
import { supabase, Profile } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
  });

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
    return data as Profile | null;
  }, []);

  const setOnlineStatus = useCallback(async (userId: string, status: 'online' | 'away' | 'offline') => {
    await supabase
      .from('profiles')
      .update({ online_status: status })
      .eq('id', userId);
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (!mounted) return;
        setState({ session, user: session.user, profile, loading: false });
        await setOnlineStatus(session.user.id, 'online');
      } else {
        setState({ session: null, user: null, profile: null, loading: false });
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT') {
          if (mounted) setState({ session: null, user: null, profile: null, loading: false });
          return;
        }
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (!mounted) return;
          setState({ session, user: session.user, profile, loading: false });
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await setOnlineStatus(session.user.id, 'online');
          }
        }
      })();
    });

    const handleBeforeUnload = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${currentSession.user.id}`,
          new Blob(
            [JSON.stringify({ online_status: 'offline' })],
            { type: 'application/json' }
          )
        );
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [fetchProfile, setOnlineStatus]);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    if (error) throw error;

    if (data.user) {
      const initials = username.slice(0, 2).toUpperCase();
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username,
          avatar_initials: initials,
          online_status: 'online',
        });
      if (profileError) {
        console.error('Profile creation error:', profileError.message);
      }
    }
    return data;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    if (state.user) {
      await setOnlineStatus(state.user.id, 'offline');
    }
    await supabase.auth.signOut();
  }, [state.user, setOnlineStatus]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!state.user) return;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', state.user.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (data) {
      setState((prev) => ({ ...prev, profile: data as Profile }));
    }
  }, [state.user]);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile: async () => {
      if (state.user) {
        const profile = await fetchProfile(state.user.id);
        if (profile) setState((prev) => ({ ...prev, profile }));
      }
    },
  };
}
