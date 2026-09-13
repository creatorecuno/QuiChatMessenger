import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage, ConversationPreview, Profile } from '../types';

export function useConversations(currentUserId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);

    const { data: msgs, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Error loading conversations:', error.message);
      setLoading(false);
      return;
    }

    const lastByPeer = new Map<string, ChatMessage>();
    (msgs || []).forEach((m) => {
      const row = m as ChatMessage;
      const peerId = row.sender_id === currentUserId ? row.receiver_id : row.sender_id;
      if (!lastByPeer.has(peerId)) lastByPeer.set(peerId, row);
    });

    const peerIds = Array.from(lastByPeer.keys());
    if (peerIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', peerIds);

    if (profilesError) {
      console.error('Error loading profiles:', profilesError.message);
      setLoading(false);
      return;
    }

    const profileById = new Map((profiles || []).map((p) => [p.id, p as Profile]));

    const list: ConversationPreview[] = peerIds
      .map((peerId) => {
        const peer = profileById.get(peerId);
        if (!peer) return null;
        return { peer, lastMessage: lastByPeer.get(peerId) || null, unreadCount: 0 };
      })
      .filter((c): c is ConversationPreview => c !== null)
      .sort((a, b) => {
        const at = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
        const bt = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
        return bt - at;
      });

    setConversations(list);
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as ChatMessage;
          if (msg.sender_id === currentUserId || msg.receiver_id === currentUserId) {
            loadConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadConversations]);

  const upsertPeer = useCallback((peer: Profile) => {
    setConversations((prev) => {
      if (prev.some((c) => c.peer.id === peer.id)) return prev;
      return [{ peer, lastMessage: null, unreadCount: 0 }, ...prev];
    });
  }, []);

  return { conversations, loading, upsertPeer, refresh: loadConversations };
}
