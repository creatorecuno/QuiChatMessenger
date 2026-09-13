import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function usePresence(userId: string | undefined): Set<string> {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('presence:online-users', {
      config: { presence: { key: userId } },
    });

    const syncState = () => {
      const state = channel.presenceState<{ user_id: string }>();
      setOnlineIds(new Set(Object.keys(state)));
    };

    channel
      .on('presence', { event: 'sync' }, syncState)
      .on('presence', { event: 'join' }, syncState)
      .on('presence', { event: 'leave' }, syncState)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return onlineIds;
}
