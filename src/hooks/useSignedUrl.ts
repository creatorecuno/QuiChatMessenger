import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const cache = new Map<string, { url: string; expiresAt: number }>();

export function useSignedUrl(path: string | null) {
  const [url, setUrl] = useState<string | null>(() => {
    if (!path) return null;
    const cached = cache.get(path);
    return cached && cached.expiresAt > Date.now() ? cached.url : null;
  });

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    const cached = cache.get(path);
    if (cached && cached.expiresAt > Date.now()) {
      setUrl(cached.url);
      return;
    }
    let active = true;
    supabase.storage
      .from('chat-media')
      .createSignedUrl(path, 3600)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Error signing url:', error.message);
          return;
        }
        if (data?.signedUrl) {
          cache.set(path, { url: data.signedUrl, expiresAt: Date.now() + 3500 * 1000 });
          setUrl(data.signedUrl);
        }
      });
    return () => {
      active = false;
    };
  }, [path]);

  return url;
}
