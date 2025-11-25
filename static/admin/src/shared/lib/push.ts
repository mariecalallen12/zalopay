import { AuthService } from './auth';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    // Ensure user authenticated
    if (!AuthService.isAuthenticated()) return;

    // Request permission
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') return;

    // Register SW
    const swReg = await navigator.serviceWorker.register('/admin/sw.js');
    await navigator.serviceWorker.ready;

    // Fetch VAPID public key
    const resp = await fetch('/api/admin/push/public-key');
    const { publicKey } = await resp.json();
    if (!publicKey) return;

    const subscription = await swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Send to backend
    await AuthService.apiRequest('/admin/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
    });
  } catch (e) {
    // Silent fail to avoid UI disruption
    console.warn('Push registration failed', e);
  }
}

