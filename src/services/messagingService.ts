import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { db, messagingPromise } from '../firebase';

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function requestAndSaveMessagingToken(userId: string) {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    return null;
  }

  const messaging = await messagingPromise;

  if (!messaging || !vapidKey) {
    return null;
  }

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    return null;
  }

  await setDoc(doc(db, 'usuarios', userId, 'dispositivos', 'web'), {
    token,
    updatedAt: serverTimestamp(),
  });

  return token;
}

export async function listenForegroundMessages(callback: (title: string, body: string) => void) {
  const messaging = await messagingPromise;

  if (!messaging) {
    return () => undefined;
  }

  return onMessage(messaging, (payload) => {
    callback(payload.notification?.title || 'MesaRapida', payload.notification?.body || 'Nova notificacao.');
  });
}
