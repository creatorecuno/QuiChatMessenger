import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../types';

export function useForwardMessage(currentUserId: string | undefined) {
  const [forwarding, setForwarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forwardMessage = useCallback(
    async (message: ChatMessage, targetPeerId: string) => {
      if (!currentUserId) return false;
      setForwarding(true);
      setError(null);
      const { error: insertError } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: targetPeerId,
        content: message.content,
        status: 'sent',
        message_type: message.message_type,
        file_path: message.file_path,
        file_name: message.file_name,
        file_size: message.file_size,
        duration_seconds: message.duration_seconds,
      });
      setForwarding(false);
      if (insertError) {
        setError(insertError.message);
        return false;
      }
      return true;
    },
    [currentUserId]
  );

  return { forwardMessage, forwarding, error };
}
