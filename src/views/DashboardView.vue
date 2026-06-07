<template>
  <main class="dashboard">
    <header class="topbar">
      <div>
        <h1>MesaRapida</h1>
      </div>
      <div class="user-area">
        <span>{{ profile?.name || user?.displayName || user?.email }}</span>
        <strong>{{ roleLabel }}</strong>
        <button class="ghost-button" type="button" @click="logout">Sair</button>
      </div>
    </header>

    <section v-if="unreadNotifications.length > 0" class="notification-panel">
      <article v-for="notification in unreadNotifications" :key="notification.id">
        <div>
          <strong>{{ notification.title }}</strong>
          <p>{{ notification.message }}</p>
        </div>
        <button class="ghost-button" type="button" @click="readNotification(notification.id)">Ok</button>
      </article>
    </section>

    <section class="stats-band">
      <div>
        <span>Mesas</span>
        <strong>{{ totalTables }}</strong>
      </div>
      <div>
        <span>Lotadas</span>
        <strong>{{ occupiedCount }}</strong>
      </div>
      <div>
        <span>Livres</span>
        <strong>{{ freeCount }}</strong>
      </div>
    </section>

    <p v-if="reservationsError" class="error dashboard-error">{{ reservationsError }}</p>

    <section v-if="isWaiter" class="waiter-filter">
      <label>
        Data das reservas
        <input v-model="selectedWaiterDate" type="date" />
      </label>

      <div class="time-filter">
        <button type="button" :class="{ active: selectedWaiterTime === '' }" @click="selectedWaiterTime = ''">
          Todas
        </button>
        <button
          v-for="time in waiterTimes"
          :key="time"
          type="button"
          :class="{ active: selectedWaiterTime === time }"
          @click="selectedWaiterTime = time"
        >
          {{ time }}
        </button>
      </div>
    </section>

    <TableMap
      :reservations="mapReservations"
      :can-select="isClient"
      :selected-table="selectedTable"
      :show-only-available="isClient"
      @select="selectTable"
    />

    <AdminUsersPanel v-if="isAdmin" :users="users" :reservations="reservations" />

    <div class="dashboard-grid" :class="{ 'client-layout': isClient }">
      <section v-if="canCreateReservation" class="form-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">{{ isAdmin ? 'Admin' : 'Cliente' }}</p>
            <h2>{{ editingReservation ? 'Editar reserva' : 'Escolher mesa' }}</h2>
          </div>
        </div>

        <ReservationForm
          v-model:editing="editing"
          :editing-reservation="editingReservation"
          :selected-table="selectedTable"
          :can-edit-status="isAdmin"
          :available-table-numbers="isClient ? availableTableNumbers : undefined"
          :choose-table-on-map="isClient"
          @save="saveReservation"
          @cancel="clearEditing"
        />
      </section>

      <ReservationList
        :class="{ 'wide-list': !canCreateReservation }"
        :reservations="reservationsForList"
        :can-edit="canManage"
        :can-delete="isAdmin"
        :can-finalize="isWaiter"
        :can-serve="isWaiter"
        @edit="startEditing"
        @delete="removeReservation"
        @finalize="finalizeReservation"
        @serve="serveReservation"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Unsubscribe } from 'firebase/firestore';
import ReservationForm from '../components/ReservationForm.vue';
import ReservationList from '../components/ReservationList.vue';
import TableMap from '../components/TableMap.vue';
import AdminUsersPanel from '../components/AdminUsersPanel.vue';
import { useAuth } from '../composables/useAuth';
import { getUserProfile, listUserProfiles, logoutUser, saveUserProfile } from '../services/authService';
import {
  createReservation,
  deleteReservation,
  listAllReservations,
  updateReservation,
  watchReservations,
} from '../services/reservationService';
import {
  createNotification,
  markNotificationAsRead,
  watchUserNotifications,
} from '../services/notificationService';
import {
  listenForegroundMessages,
  requestAndSaveMessagingToken,
} from '../services/messagingService';
import {
  RESTAURANT_TABLES,
  type AppNotification,
  type Reservation,
  type ReservationForm as ReservationPayload,
  type UserProfile,
} from '../types';

const router = useRouter();
const { user } = useAuth();
const profile = ref<UserProfile | null>(null);
const reservations = ref<Reservation[]>([]);
const users = ref<UserProfile[]>([]);
const unreadNotifications = ref<AppNotification[]>([]);
const editingReservation = ref<Reservation | null>(null);
const editing = ref(false);
const selectedTable = ref<number | null>(null);
const selectedWaiterDate = ref(new Date().toISOString().slice(0, 10));
const selectedWaiterTime = ref('');
const reservationsError = ref('');
let unsubscribeReservations: Unsubscribe | null = null;
let unsubscribeNotifications: Unsubscribe | null = null;
let unsubscribeForegroundMessages = () => undefined as void;

const totalTables = RESTAURANT_TABLES.length;
const activeReservations = computed(() =>
  reservations.value.filter((item) => item.status !== 'cancelada' && item.status !== 'livre'),
);
const occupiedCount = computed(() => activeReservations.value.filter((item) => item.status === 'ocupada').length);
const freeCount = computed(() => totalTables - activeReservations.value.length);
const availableTableNumbers = computed(() => {
  const unavailableTables = new Set(activeReservations.value.map((item) => item.tableNumber));
  return RESTAURANT_TABLES.filter((table) => !unavailableTables.has(table.number)).map((table) => table.number);
});
const isAdmin = computed(() => profile.value?.role === 'admin');
const isWaiter = computed(() => profile.value?.role === 'garcom');
const isClient = computed(() => profile.value?.role === 'cliente');
const canManage = computed(() => isAdmin.value);
const canCreateReservation = computed(() => isAdmin.value || isClient.value);
const roleLabel = computed(() => {
  if (profile.value?.role === 'admin') return 'Admin';
  if (profile.value?.role === 'garcom') return 'Garcom';
  if (profile.value?.role === 'cliente') return 'Cliente';
  return 'Carregando...';
});
const visibleReservations = computed(() => {
  if (!isClient.value || !user.value) return reservations.value;
  return reservations.value.filter((item) => item.createdBy === user.value?.uid);
});
const waiterDateReservations = computed(() => {
  if (!isWaiter.value) return visibleReservations.value;
  return reservations.value.filter((item) => item.date === selectedWaiterDate.value && item.status !== 'cancelada');
});
const waiterTimes = computed(() =>
  [...new Set(waiterDateReservations.value.map((item) => item.time).filter(Boolean))].sort(),
);
const filteredWaiterReservations = computed(() => {
  if (!isWaiter.value) return visibleReservations.value;

  if (!selectedWaiterTime.value) {
    return waiterDateReservations.value;
  }

  return waiterDateReservations.value.filter((item) => item.time === selectedWaiterTime.value);
});
const reservationsForList = computed(() => (isWaiter.value ? filteredWaiterReservations.value : visibleReservations.value));
const mapReservations = computed(() => (isWaiter.value ? waiterDateReservations.value : activeReservations.value));

onMounted(async () => {
  if (!user.value) return;

  profile.value = await getUserProfile(user.value.uid);

  if (!profile.value) {
    profile.value = {
      id: user.value.uid,
      name: user.value.displayName || 'Usuario',
      email: user.value.email || '',
      role: 'cliente',
    };
  }

  await saveUserProfile(profile.value).catch(() => {
    reservationsError.value = 'Nao foi possivel sincronizar o perfil do usuario. Verifique as regras da colecao usuarios.';
  });

  unsubscribeReservations = watchReservations(user.value.uid, profile.value.role, async (items) => {
    reservations.value = items;

    if (profile.value?.role !== 'cliente' && items.length === 0) {
      reservations.value = await listAllReservations();
    }
  }, (message) => {
    reservationsError.value = message;
  });

  unsubscribeNotifications = watchUserNotifications(user.value.uid, (items) => {
    const previousIds = new Set(unreadNotifications.value.map((item) => item.id));
    unreadNotifications.value = items;

    items
      .filter((item) => !previousIds.has(item.id))
      .forEach((item) => showBrowserNotification(item.title, item.message));
  });

  requestAndSaveMessagingToken(user.value.uid).catch(() => undefined);
  unsubscribeForegroundMessages = await listenForegroundMessages((title, message) => {
    showBrowserNotification(title, message);
  });

  if (profile.value.role === 'admin') {
    users.value = await listUserProfiles();
  }
});

onUnmounted(() => {
  unsubscribeReservations?.();
  unsubscribeNotifications?.();
  unsubscribeForegroundMessages();
});

async function saveReservation(data: ReservationPayload) {
  if (!user.value || !canCreateReservation.value) return;

  try {
    if (editingReservation.value) {
      if (!canManage.value) return;
      await updateReservation(editingReservation.value.id, data);
    } else {
      const reservation = await createReservation(user.value.uid, data);
      await createNotification(
        user.value.uid,
        'Reserva salva',
        `Sua reserva da mesa ${data.tableNumber} foi registrada para ${data.date} as ${data.time}.`,
        reservation.id,
      );
    }

    reservationsError.value = '';
    clearEditing();
  } catch {
    reservationsError.value = 'Nao foi possivel salvar a reserva. No Firebase, permita create/read na colecao reservas_restaurante para usuarios autenticados.';
  }
}

function startEditing(reservation: Reservation) {
  if (!canManage.value) return;

  editingReservation.value = reservation;
  editing.value = true;
}

function clearEditing() {
  editingReservation.value = null;
  editing.value = false;
  selectedTable.value = null;
}

function selectTable(tableNumber: number) {
  if (!isClient.value) return;
  selectedTable.value = tableNumber;
}

async function removeReservation(id: string) {
  if (!isAdmin.value) return;
  await deleteReservation(id);
}

async function finalizeReservation(id: string) {
  if (!isWaiter.value) return;

  try {
    await updateReservation(id, { status: 'livre' });
    reservationsError.value = '';
  } catch {
    reservationsError.value = 'Nao foi possivel finalizar a reserva. Verifique se o garcom pode atualizar reservas no Firestore.';
  }
}

async function serveReservation(reservation: Reservation) {
  if (!isWaiter.value) return;

  try {
    await updateReservation(reservation.id, { status: 'ocupada' });
    await createNotification(
      reservation.createdBy,
      'Garcom indo atender',
      `O garcom esta indo atender sua mesa ${reservation.tableNumber}.`,
      reservation.id,
    );
    reservationsError.value = '';
  } catch {
    reservationsError.value = 'Nao foi possivel avisar o cliente. Verifique as permissoes de notificacoes no Firestore.';
  }
}

async function readNotification(id: string) {
  await markNotificationAsRead(id);
}

function showBrowserNotification(title: string, message: string) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(title, { body: message });
    return;
  }

  if (Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, { body: message });
      }
    });
  }
}

async function logout() {
  await logoutUser();
  await router.push('/');
}
</script>
