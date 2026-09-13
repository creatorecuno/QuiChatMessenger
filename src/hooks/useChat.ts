import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage, MessageType } from '../types';

function pairChannelName(a: string, b: string) {
  return ['typing', ...[a, b].sort()].join(':');
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

export function useChat(currentUserId: string | undefined, peerId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [peerTyping, setPeerTyping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
        setSendError(error.message);
      }
    },
    [currentUserId, peerId]
  );

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

        const { data: publicUrlData } = supabase.storage.from('chat-media').getPublicUrl(path);

        const { error: insertError } = await supabase.from('messages').insert({
          sender_id: currentUserId,
          receiver_id: peerId,
          content: '',
          status: 'sent',
          message_type: type,
          file_url: publicUrlData.publicUrl,
          file_name: fileName,
          file_size: file.size,
          duration_seconds: durationSeconds ?? null,
        });
        if (insertError) throw insertError;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось загрузить файл';
        console.error('Error sending media message:', message);
        setSendError(message);
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
    peerTyping,
    sendMessage,
    sendMediaMessage,
    deleteMessage,
    notifyTyping,
    sendError,
    uploading,
  };
}
