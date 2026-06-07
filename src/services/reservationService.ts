import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Reservation, ReservationForm, UserRole } from '../types';

const reservationsRef = collection(db, 'reservas_restaurante');

export function createReservation(userId: string, data: ReservationForm) {
  return addDoc(reservationsRef, {
    ...data,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

function normalizeReservations(docs: Array<{ id: string; data: () => unknown }>) {
  const reservations = docs.map((item) => ({
    id: item.id,
    ...(item.data() as Record<string, unknown>),
  })) as Reservation[];

  reservations.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return reservations;
}

export function watchReservations(
  userId: string,
  role: UserRole,
  callback: (reservations: Reservation[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const reservationsQuery =
    role === 'cliente' ? query(reservationsRef, where('createdBy', '==', userId)) : query(reservationsRef);

  return onSnapshot(reservationsQuery, (snapshot) => {
    callback(normalizeReservations(snapshot.docs));
    onError?.('');
  }, () => {
    onError?.('Nao foi possivel carregar as reservas. Verifique as regras do Firestore para permitir leitura ao garcom.');
  });
}

export async function listAllReservations() {
  const snapshot = await getDocs(query(reservationsRef));
  return normalizeReservations(snapshot.docs);
}

export function updateReservation(id: string, data: Partial<ReservationForm>) {
  return updateDoc(doc(db, 'reservas_restaurante', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export function deleteReservation(id: string) {
  return deleteDoc(doc(db, 'reservas_restaurante', id));
}
