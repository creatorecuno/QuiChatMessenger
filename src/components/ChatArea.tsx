import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ChatAreaProps {
  recipient: {
    id: string;
    username: string | null;
    email: string | null;
    avatar_url?: string | null;
  };
  currentUserId: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ recipient, currentUserId }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!recipient?.id || !currentUserId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat:${recipient.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new;
          if (
            (msg.sender_id === currentUserId && msg.receiver_id === recipient.id) ||
            (msg.sender_id === recipient.id && msg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recipient?.id, currentUserId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage;
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: recipient.id,
      content: text,
    });

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  const getInitial = (name?: string | null, email?: string | null) => {
    const str = name || email || 'U';
    return str.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-white">
      {/* Top Header */}
      <div className="h-16 border-b border-slate-800 px-6 flex items-center space-x-4 bg-slate-900/60 backdrop-blur">
        <div className="w-10 h-10 rounded-full bg-indigo-600 font-bold flex items-center justify-center border border-indigo-400">
          {getInitial(recipient.username, recipient.email)}
        </div>
        <div>
          <h3 className="font-semibold text-white">{recipient.username || recipient.email}</h3>
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> online
          </span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            Напишите первое сообщение...
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id || Math.random()} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center gap-3">
        <input
          type="text"
          placeholder="Напишите сообщение..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
        >
          Отправить
        </button>
      </form>
    </div>
  );
};

export default ChatArea;
