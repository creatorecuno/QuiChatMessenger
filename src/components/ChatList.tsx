import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url?: string | null;
}

interface ChatListProps {
  onSelectUser: (user: Profile) => void;
  activeUserId?: string;
}

export const ChatList: React.FC<ChatListProps> = ({ onSelectUser, activeUserId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, email, avatar_url')
          .neq('id', currentUser?.id || '')
          .or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } else {
          setSearchResults(data || []);
        }
      } catch (err) {
        console.error('Unexpected search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Безопасное получение первой буквы имени (защита от краша charCodeAt)
  const getInitial = (name?: string | null, email?: string | null) => {
    const str = name || email || 'U';
    return str.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white mb-4">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && (
          <div className="p-4 text-center text-slate-400 text-sm">Searching...</div>
        )}

        {!loading && searchQuery && searchResults.length === 0 && (
          <div className="p-4 text-center text-slate-400 text-sm">No users found</div>
        )}

        {!loading && searchResults.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user)}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeUserId === user.id
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-800 text-slate-200'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold flex items-center justify-center border border-indigo-500/30 shrink-0">
              {getInitial(user.username, user.email)}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="font-medium truncate text-sm">
                {user.username || user.email || 'Unknown User'}
              </div>
              <div className="text-xs text-slate-400 truncate">Click to start chat</div>
            </div>
            <UserPlus className="h-4 w-4 text-slate-400 shrink-0" />
          </button>
        ))}

        {!searchQuery && (
          <div className="p-8 text-center text-slate-500 text-sm">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Search for users to start chatting
          </div>
        )}
      </div>
    </div>
  );
};
