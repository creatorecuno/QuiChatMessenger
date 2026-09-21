import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(userId: string | undefined) {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        !!VAPID_PUBLIC_KEY
    );
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!supported || !userId || !VAPID_PUBLIC_KEY) return false;
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });
      }
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: userId,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
        { onConflict: 'endpoint' }
      );
      if (error) {
        console.error('Error saving push subscription:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Push subscribe error:', err);
      return false;
    }
  }, [supported, userId]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
      }
    } catch (err) {
      console.error('Push unsubscribe error:', err);
    }
  }, [supported]);

  return { supported, subscribe, unsubscribe };
}
