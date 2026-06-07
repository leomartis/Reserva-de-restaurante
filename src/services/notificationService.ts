import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { AppNotification } from '../types';

const notificationsRef = collection(db, 'notificacoes');

export function createNotification(userId: string, title: string, message: string, reservationId?: string) {
  return addDoc(notificationsRef, {
    userId,
    title,
    message,
    reservationId: reservationId ?? '',
    read: false,
    createdAt: serverTimestamp(),
  });
}

export function watchUserNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void,
): Unsubscribe {
  return onSnapshot(query(notificationsRef, where('userId', '==', userId)), (snapshot) => {
    const notifications = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as AppNotification[];

    callback(notifications.filter((item) => !item.read));
  });
}

export function markNotificationAsRead(id: string) {
  return updateDoc(doc(db, 'notificacoes', id), {
    read: true,
  });
}
