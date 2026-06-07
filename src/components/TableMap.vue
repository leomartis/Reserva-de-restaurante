<template>
  <section class="table-map">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Visao do salao</p>
        <h2>{{ showOnlyAvailable ? 'Mesas disponiveis' : 'Mesas do restaurante' }}</h2>
      </div>
    </div>

    <div v-if="tablesWithStatus.length === 0" class="empty-state">
      Nenhuma mesa disponivel no momento.
    </div>

    <div class="table-grid">
      <article
        v-for="table in tablesWithStatus"
        :key="table.number"
        class="table-tile"
        :class="[table.status, { selected: selectedTable === table.number, selectable: canSelect && table.status === 'livre' }]"
        :role="canSelect && table.status === 'livre' ? 'button' : undefined"
        :tabindex="canSelect && table.status === 'livre' ? 0 : undefined"
        @click="selectTable(table.number, table.status)"
        @keydown.enter="selectTable(table.number, table.status)"
      >
        <span class="table-number">Mesa {{ table.number }}</span>
        <strong>{{ labelStatus(table.status) }}</strong>
        <p>{{ table.seats }} lugares - {{ table.area }}</p>
        <small v-if="table.reservation">
          {{ table.reservation.customerName }} as {{ table.reservation.time }}
        </small>
        <div v-if="table.reservation?.orderItems?.length" class="table-order">
          <span v-for="item in table.reservation.orderItems" :key="item.menuItemId">
            {{ item.quantity }}x {{ item.name }}
          </span>
        </div>
        <span v-else-if="canSelect" class="table-choice">Clique para reservar</span>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Reservation, TableStatus } from '../types';
import { RESTAURANT_TABLES } from '../types';

const props = defineProps<{
  reservations: Reservation[];
  canSelect?: boolean;
  selectedTable?: number | null;
  showOnlyAvailable?: boolean;
}>();

const emit = defineEmits<{
  select: [tableNumber: number];
}>();

const tablesWithStatus = computed(() => {
  const tables = RESTAURANT_TABLES.map((table) => {
    const reservation = props.reservations.find(
      (item) => item.tableNumber === table.number && item.status !== 'cancelada' && item.status !== 'livre',
    );

    return {
      ...table,
      reservation,
      status: reservation?.status ?? 'livre',
    };
  });

  return props.showOnlyAvailable ? tables.filter((table) => table.status === 'livre') : tables;
});

function labelStatus(status: TableStatus) {
  const labels: Record<TableStatus, string> = {
    livre: 'Livre',
    reservada: 'Reservada',
    ocupada: 'Lotada',
    cancelada: 'Cancelada',
  };

  return labels[status];
}

function selectTable(tableNumber: number, status: TableStatus) {
  if (!props.canSelect || status !== 'livre') return;
  emit('select', tableNumber);
}
</script>
