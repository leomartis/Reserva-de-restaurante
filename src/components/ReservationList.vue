<template>
  <section class="list-panel">
    <div class="section-heading">
      <div>
        <h2>Reservas do restaurante</h2>
      </div>
      <span class="counter">{{ reservations.length }}</span>
    </div>

    <div v-if="reservations.length === 0" class="empty-state">
      Nenhuma reserva cadastrada.
    </div>

    <article v-for="reservation in reservations" :key="reservation.id" class="reservation-card">
      <div>
        <div class="card-title-row">
          <h3>Mesa {{ reservation.tableNumber }} - {{ reservation.customerName }}</h3>
          <span class="status" :class="reservation.status">{{ labelStatus(reservation.status) }}</span>
        </div>
        <p>{{ reservation.guests }} pessoas - {{ reservation.customerPhone }}</p>
        <strong>{{ formatDate(reservation.date) }} as {{ reservation.time }}</strong>
        <div v-if="reservation.orderItems?.length" class="order-lines">
          <span v-for="item in reservation.orderItems" :key="item.menuItemId">
            {{ item.quantity }}x {{ item.name }}
          </span>
          <strong>Total: {{ formatCurrency(orderTotal(reservation)) }}</strong>
        </div>
        <small v-if="reservation.notes">{{ reservation.notes }}</small>
      </div>

      <div class="card-actions">
        <button v-if="canEdit" class="ghost-button" type="button" @click="$emit('edit', reservation)">Editar</button>
        <button v-if="canServe && reservation.status === 'reservada'" class="ghost-button" type="button" @click="$emit('serve', reservation)">
          Indo atender
        </button>
        <button v-if="canFinalize && reservation.status !== 'livre'" class="primary-button" type="button" @click="$emit('finalize', reservation.id)">
          Finalizar
        </button>
        <button v-if="canDelete" class="danger-button" type="button" @click="$emit('delete', reservation.id)">Excluir</button>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { Reservation, TableStatus } from '../types';

defineProps<{
  reservations: Reservation[];
  canEdit: boolean;
  canDelete: boolean;
  canFinalize: boolean;
  canServe: boolean;
}>();

defineEmits<{
  edit: [reservation: Reservation];
  delete: [id: string];
  finalize: [id: string];
  serve: [reservation: Reservation];
}>();

function formatDate(date: string) {
  if (!date) return '';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${date}T00:00:00`));
}

function labelStatus(status: TableStatus) {
  const labels: Record<TableStatus, string> = {
    livre: 'Livre',
    reservada: 'Reservada',
    ocupada: 'Lotada',
    cancelada: 'Cancelada',
  };

  return labels[status];
}

function orderTotal(reservation: Reservation) {
  return reservation.orderItems?.reduce((total, item) => total + item.quantity * item.unitPrice, 0) ?? 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
</script>
