// DearDay Service Worker — PWA push 알림용
// 푸시 수신 → 시스템 알림 표시 → 클릭 시 /cards/new?type=... 열기

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'DearDay', body: event.data.text() };
  }
  const title = payload.title || 'DearDay';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || 'dearday-reminder',
    renotify: true,
    data: payload.data || {},
    actions: payload.actions || []
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      // 이미 열린 탭 있으면 해당 탭으로
      for (const client of clientsArr) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // 없으면 새 탭
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
