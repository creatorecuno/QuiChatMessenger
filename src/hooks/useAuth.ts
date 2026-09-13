import { Session, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { OnlineStatus, Profile } from '../types';

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

  const setStatus = useCallback(async (userId: string, status: OnlineStatus) => {
    await supabase
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
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
        await setStatus(session.user.id, 'online');
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
            await setStatus(session.user.id, 'online');
          }
        }
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, setStatus]);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        email,
        avatar_url: null,
        status: 'online',
      });
      if (profileError) {
        console.error('Profile creation error:', profileError.message);
      }
    }
    return data;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    if (state.user) {
      await setStatus(state.user.id, 'offline');
    }
    await supabase.auth.signOut();
  }, [state.user, setStatus]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!state.user) return;
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', state.user.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (data) {
      setState((prev) => ({ ...prev, profile: data as Profile }));
    }
  }, [state.user]);

  return { ...state, signUp, signIn, signOut, updateProfile };
}
