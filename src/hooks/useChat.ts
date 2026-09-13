import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../types';

function pairChannelName(a: string, b: string) {
  return ['typing', ...[a, b].sort()].join(':');
}

export function useChat(currentUserId: string | undefined, peerId: string | undefined) {
  // в начало функции useChat, рядом с остальными useState:
const [sendError, setSendError] = useState<string | null>(null);

// замени тело sendMessage на:
const sendMessage = useCallback(
  async (content: string) => {
    if (!currentUserId || !peerId || !content.trim()) return;
    setSendError(null);
    const { error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: peerId,
      content: content.trim(),
      status: 'sent',
    });
    if (error) {
      console.error('Error sending message:', error.message);
      setSendError(error.message);
    }
  },
  [currentUserId, peerId]
);

// и в конце функции добавь sendError в возвращаемый объект:
return { messages, loading, peerTyping, sendMessage, deleteMessage, notifyTyping, sendError };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [peerTyping, setPeerTyping] = useState(false);

  
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingReadyRef = useRef(false);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    if (!currentUserId || !peerId) return;
    let active = true;
    setLoading(true);
    setMessages([]);

    const load = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${currentUserId})`
        )
        .order('created_at', { ascending: true });

      if (!active) return;
      if (error) {
        console.error('Error loading messages:', error.message);
      } else {
        setMessages((data || []) as ChatMessage[]);
      }
      setLoading(false);
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
      supabase.removeChannel(typingChannel);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [currentUserId, peerId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentUserId || !peerId || !content.trim()) return;
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: peerId,
        content: content.trim(),
        status: 'sent',
      });
      if (error) console.error('Error sending message:', error.message);
    },
    [currentUserId, peerId]
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) console.error('Error deleting message:', error.message);
  }, []);

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

  return { messages, loading, peerTyping, sendMessage, deleteMessage, notifyTyping };
}
