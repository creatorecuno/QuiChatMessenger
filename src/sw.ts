/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
  let data: { title?: string; body?: string } = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'QuiChat', body: event.data ? event.data.text() : 'Новое сообщение' };
  }

  const title = data.title || 'QuiChat';
  const options: NotificationOptions = {
    body: data.body || 'Новое сообщение',
    icon: '/icon-192.png',
    badge: '/favicon.png',
    tag: 'quichat-message',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
