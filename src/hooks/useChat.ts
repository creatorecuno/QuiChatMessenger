import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage, MessageType, ReactionSummary } from '../types';

interface RawReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

const PAGE_SIZE = 40;

function pairChannelName(a: string, b: string) {
  return ['typing', ...[a, b].sort()].join(':');
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

function translateSendError(message: string): string {
  if (message.includes('rate_limit_exceeded')) {
    return 'Слишком много сообщений подряд. Подожди немного.';
  }
  return message;
}

export function useChat(currentUserId: string | undefined, peerId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rawReactions, setRawReactions] = useState<RawReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingReadyRef = useRef(false);
  const lastTypingSentRef = useRef(0);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const oldestLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    messageIdsRef.current = new Set(messages.map((m) => m.id));
  }, [messages]);

  const markPeerMessagesRead = useCallback(async () => {
    if (!currentUserId || !peerId) return;
    await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('sender_id', peerId)
      .eq('receiver_id', currentUserId)
      .neq('status', 'read');
  }, [currentUserId, peerId]);

  const fetchReactionsFor = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const { data, error } = await supabase.from('message_reactions').select('*').in('message_id', ids);
    if (error) {
      console.error('Error loading reactions:', error.message);
      return;
    }
    setRawReactions((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const fresh = ((data || []) as RawReaction[]).filter((r) => !existingIds.has(r.id));
      return [...prev, ...fresh];
    });
  }, []);

  useEffect(() => {
    if (!currentUserId || !peerId) return;
    let active = true;
    setLoading(true);
    setMessages([]);
    setRawReactions([]);
    setHasMore(false);
    oldestLoadedRef.current = null;

    const orCondition = `and(sender_id.eq.${currentUserId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${currentUserId})`;

    const load = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(orCondition)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (!active) return;
      if (error) {
        console.error('Error loading messages:', error.message);
        setLoading(false);
        return;
      }

      const rows = ((data || []) as ChatMessage[]).slice().reverse();
      setMessages(rows);
      setHasMore((data || []).length === PAGE_SIZE);
      oldestLoadedRef.current = rows[0]?.created_at ?? null;
      setLoading(false);
      markPeerMessagesRead();
      await fetchReactionsFor(rows.map((m) => m.id));
    };

    load();

    const dataChannel = supabase
      .channel(`messages:${currentUserId}:${peerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as ChatMessage;
          const belongsHere =
            (msg.sender_id === currentUserId && msg.receiver_id === peerId) ||
            (msg.sender_id === peerId && msg.receiver_id === currentUserId);
          if (belongsHere) {
            setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
            if (msg.sender_id === peerId) markPeerMessagesRead();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as ChatMessage;
          const belongsHere =
            (msg.sender_id === currentUserId && msg.receiver_id === peerId) ||
            (msg.sender_id === peerId && msg.receiver_id === currentUserId);
          if (belongsHere) {
            setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const oldRow = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== oldRow.id));
        }
      )
      .subscribe();

    const reactionChannel = supabase
      .channel(`reactions:${currentUserId}:${peerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reactions' },
        (payload) => {
          const row = payload.new as RawReaction;
          if (messageIdsRef.current.has(row.message_id)) {
            setRawReactions((prev) => (prev.some((r) => r.id === row.id) ? prev : [...prev, row]));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'message_reactions' },
        (payload) => {
          const oldRow = payload.old as { id: string };
          setRawReactions((prev) => prev.filter((r) => r.id !== oldRow.id));
        }
      )
      .subscribe();

    const typingChannel = supabase.channel(pairChannelName(currentUserId, peerId));
    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if ((payload.payload as { from?: string })?.from === peerId) {
          setPeerTyping(true);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setPeerTyping(false), 2500);
        }
      })
      .subscribe((status) => {
        typingReadyRef.current = status === 'SUBSCRIBED';
      });
    typingChannelRef.current = typingChannel;

    return () => {
      active = false;
      typingReadyRef.current = false;
      supabase.removeChannel(dataChannel);
      supabase.removeChannel(reactionChannel);
      supabase.removeChannel(typingChannel);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [currentUserId, peerId, markPeerMessagesRead, fetchReactionsFor]);

  const loadMore = useCallback(async () => {
    if (!currentUserId || !peerId || !oldestLoadedRef.current || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${currentUserId})`
      )
      .lt('created_at', oldestLoadedRef.current)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error('Error loading more messages:', error.message);
      setLoadingMore(false);
      return;
    }

    const rows = ((data || []) as ChatMessage[]).slice().reverse();
    if (rows.length > 0) {
      oldestLoadedRef.current = rows[0].created_at;
      setMessages((prev) => [...rows, ...prev]);
      await fetchReactionsFor(rows.map((m) => m.id));
    }
    setHasMore((data || []).length === PAGE_SIZE);
    setLoadingMore(false);
  }, [currentUserId, peerId, loadingMore, hasMore, fetchReactionsFor]);

  const reactionsByMessage = useMemo(() => {
    const map: Record<string, ReactionSummary[]> = {};
    rawReactions.forEach((r) => {
      if (!map[r.message_id]) map[r.message_id] = [];
      let entry = map[r.message_id].find((e) => e.emoji === r.emoji);
      if (!entry) {
        entry = { emoji: r.emoji, count: 0, reactedByMe: false };
        map[r.message_id].push(entry);
      }
      entry.count += 1;
      if (r.user_id === currentUserId) entry.reactedByMe = true;
    });
    return map;
  }, [rawReactions, currentUserId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentUserId || !peerId || !content.trim()) return;
      setSendError(null);
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: peerId,
        content: content.trim(),
        status: 'sent',
        message_type: 'text',
      });
      if (error) {
        console.error('Error sending message:', error.message);
        setSendError(translateSendError(error.message));
      }
    },
    [currentUserId, peerId]
  );

  const editMessage = useCallback(async (messageId: string, content: string) => {
    if (!content.trim()) return;
    const { error } = await supabase
      .from('messages')
      .update({ content: content.trim(), edited: true })
      .eq('id', messageId);
    if (error) console.error('Error editing message:', error.message);
  }, []);

  const sendMediaMessage = useCallback(
    async (file: Blob, type: MessageType, fileName: string, durationSeconds?: number) => {
      if (!currentUserId || !peerId) return;
      setSendError(null);
      setUploading(true);
      try {
        const path = `${currentUserId}/${Date.now()}-${sanitizeFileName(fileName)}`;
        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase.from('messages').insert({
          sender_id: currentUserId,
          receiver_id: peerId,
          content: '',
          status: 'sent',
          message_type: type,
          file_path: path,
          file_name: fileName,
          file_size: file.size,
          duration_seconds: durationSeconds ?? null,
        });
        if (insertError) throw insertError;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось загрузить файл';
        console.error('Error sending media message:', message);
        setSendError(translateSendError(message));
      } finally {
        setUploading(false);
      }
    },
    [currentUserId, peerId]
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) console.error('Error deleting message:', error.message);
  }, []);

  const togglePin = useCallback(
    async (messageId: string) => {
      if (!currentUserId || !peerId) return;
      const target = messages.find((m) => m.id === messageId);
      if (!target) return;
      const newPinned = !target.pinned;
      if (newPinned) {
        await supabase
          .from('messages')
          .update({ pinned: false })
          .or(
            `and(sender_id.eq.${currentUserId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${currentUserId})`
          )
          .eq('pinned', true);
      }
      const { error } = await supabase.from('messages').update({ pinned: newPinned }).eq('id', messageId);
      if (error) console.error('Error toggling pin:', error.message);
    },
    [messages, currentUserId, peerId]
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!currentUserId) return;
      const existing = rawReactions.find(
        (r) => r.message_id === messageId && r.user_id === currentUserId && r.emoji === emoji
      );
      if (existing) {
        setRawReactions((prev) => prev.filter((r) => r.id !== existing.id));
        const { error } = await supabase.from('message_reactions').delete().eq('id', existing.id);
        if (error) console.error('Error removing reaction:', error.message);
        return;
      }

      const tempId = `temp-${Date.now()}`;
      setRawReactions((prev) => [...prev, { id: tempId, message_id: messageId, user_id: currentUserId, emoji }]);
      const { data, error } = await supabase
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: currentUserId, emoji })
        .select()
        .maybeSingle();
      if (error) {
        console.error('Error adding reaction:', error.message);
        setRawReactions((prev) => prev.filter((r) => r.id !== tempId));
      } else if (data) {
        const row = data as RawReaction;
        setRawReactions((prev) => prev.map((r) => (r.id === tempId ? row : r)));
      }
    },
    [currentUserId, rawReactions]
  );

  const notifyTyping = useCallback(() => {
    if (!currentUserId || !typingChannelRef.current || !typingReadyRef.current) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { from: currentUserId },
    });
  }, [currentUserId]);

  return {
    messages,
    loading,
    hasMore,
    loadingMore,
    loadMore,
    peerTyping,
    sendMessage,
    sendMediaMessage,
    editMessage,
    deleteMessage,
    togglePin,
    toggleReaction,
    reactionsByMessage,
    notifyTyping,
    sendError,
    uploading,
  };
}
