<template>
  <form class="reservation-form" @submit.prevent="submit">
    <div class="form-grid">
      <label>
        Cliente
        <input v-model.trim="form.customerName" type="text" placeholder="Ex.: Ana Souza" required />
      </label>

      <label>
        Telefone
        <input
          v-model="form.customerPhone"
          type="tel"
          inputmode="numeric"
          maxlength="15"
          placeholder="(00) 00000-0000"
          required
          @input="formatPhone"
        />
      </label>

      <label>
        Mesa
        <div v-if="chooseTableOnMap" class="selected-table-box" :class="{ empty: !selectedTable }">
          {{ selectedTable ? `Mesa ${selectedTable} selecionada` : 'Clique em uma mesa disponivel acima' }}
        </div>
        <select v-else v-model.number="form.tableNumber" required>
          <option v-for="table in tables" :key="table.number" :value="table.number">
            Mesa {{ table.number }} - {{ table.seats }} lugares - {{ table.area }}
          </option>
        </select>
      </label>

      <label>
        Pessoas
        <input v-model.number="form.guests" type="number" min="1" :max="selectedTableSeats" required />
        <small class="field-help">Maximo: {{ selectedTableSeats }} lugares</small>
      </label>

      <label>
        Data
        <input v-model="form.date" type="date" required />
      </label>

      <label>
        Hora
        <input v-model="form.time" type="time" required />
      </label>

      <label>
        Status da mesa
        <select v-model="form.status" :disabled="!canEditStatus" required>
          <option value="reservada">Reservada</option>
          <option value="ocupada">Lotada/Ocupada</option>
          <option value="livre">Livre</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </label>
    </div>

    <label>
      Observacoes
      <textarea v-model.trim="form.notes" rows="3" placeholder="Ex.: aniversario, mesa proxima da janela, cadeira infantil" />
    </label>

    <section class="menu-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Cardapio</p>
          <h3>Selecione os pedidos</h3>
        </div>
        <strong>{{ formatCurrency(orderTotal) }}</strong>
      </div>

      <div class="menu-grid">
        <article v-for="item in menuItems" :key="item.id" class="menu-item">
          <div class="menu-copy">
            <span>{{ item.category }}</span>
            <h4>{{ item.name }}</h4>
            <p>{{ item.description }}</p>
            <strong class="menu-price">{{ formatCurrency(item.price) }}</strong>
          </div>

          <div class="quantity-control">
            <button type="button" aria-label="Diminuir item" @click="decreaseItem(item.id)">-</button>
            <output>{{ getQuantity(item.id) }}</output>
            <button type="button" aria-label="Adicionar item" @click="increaseItem(item)">+</button>
          </div>
        </article>
      </div>

      <div class="order-summary" :class="{ empty: form.orderItems.length === 0 }">
        <div>
          <strong>Pedido selecionado</strong>
          <p>{{ form.orderItems.length === 0 ? 'Nenhum item escolhido ainda.' : `${form.orderItems.length} item(ns) no pedido.` }}</p>
        </div>
        <div v-if="form.orderItems.length > 0" class="order-summary-items">
          <span v-for="item in form.orderItems" :key="item.menuItemId">
            {{ item.quantity }}x {{ item.name }}
          </span>
        </div>
        <strong class="order-total">{{ formatCurrency(orderTotal) }}</strong>
      </div>
    </section>

    <p v-if="formError" class="error">{{ formError }}</p>

    <div class="form-actions">
      <button v-if="editing" class="ghost-button" type="button" @click="cancel">Cancelar</button>
      <button class="primary-button" type="submit">{{ editing ? 'Atualizar reserva' : 'Inserir reserva' }}</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { MenuItem, Reservation, ReservationForm } from '../types';
import { MENU_ITEMS, RESTAURANT_TABLES } from '../types';

const props = defineProps<{
  editingReservation: Reservation | null;
  selectedTable?: number | null;
  canEditStatus?: boolean;
  availableTableNumbers?: number[];
  chooseTableOnMap?: boolean;
}>();

const emit = defineEmits<{
  save: [data: ReservationForm];
  cancel: [];
}>();

const tables = computed(() => {
  if (!props.availableTableNumbers) {
    return RESTAURANT_TABLES;
  }

  return RESTAURANT_TABLES.filter((table) => props.availableTableNumbers?.includes(table.number));
});
const menuItems = MENU_ITEMS;
const emptyForm: ReservationForm = {
  customerName: '',
  customerPhone: '',
  tableNumber: 1,
  guests: 2,
  date: '',
  time: '',
  notes: '',
  status: 'reservada',
  orderItems: [],
};

const form = reactive<ReservationForm>({ ...emptyForm });
const editing = defineModel<boolean>('editing', { required: true });
const formError = ref('');
const orderTotal = computed(() =>
  form.orderItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0),
);
const selectedTableSeats = computed(() => {
  const table = RESTAURANT_TABLES.find((item) => item.number === (props.selectedTable ?? form.tableNumber));
  return table?.seats ?? 20;
});

watch(
  () => props.editingReservation,
  (reservation) => {
    Object.assign(form, reservation ? { ...reservation, orderItems: reservation.orderItems ?? [] } : emptyForm);
  },
  { immediate: true },
);

watch(
  () => props.selectedTable,
  (tableNumber) => {
    if (!props.editingReservation && tableNumber) {
      form.tableNumber = tableNumber;
      adjustGuestsToTableSeats();
    }
  },
  { immediate: true },
);

watch(
  tables,
  (availableTables) => {
    if (
      !props.chooseTableOnMap &&
      !props.editingReservation &&
      availableTables.length > 0 &&
      !availableTables.some((table) => table.number === form.tableNumber)
    ) {
      form.tableNumber = availableTables[0].number;
    }
  },
  { immediate: true },
);

watch(
  () => form.guests,
  () => adjustGuestsToTableSeats(),
);

function submit() {
  formError.value = '';
  adjustGuestsToTableSeats();

  if (props.chooseTableOnMap && !props.selectedTable) {
    formError.value = 'Selecione uma mesa disponivel clicando no mapa acima.';
    return;
  }

  emit('save', {
    ...form,
    tableNumber: props.selectedTable ?? form.tableNumber,
    orderItems: [...form.orderItems],
    status: props.canEditStatus ? form.status : 'reservada',
  });
  resetForm();
}

function cancel() {
  resetForm();
  emit('cancel');
}

function increaseItem(item: MenuItem) {
  const selectedItem = form.orderItems.find((orderItem) => orderItem.menuItemId === item.id);

  if (selectedItem) {
    selectedItem.quantity += 1;
    return;
  }

  form.orderItems.push({
    menuItemId: item.id,
    name: item.name,
    quantity: 1,
    unitPrice: item.price,
  });
}

function decreaseItem(menuItemId: string) {
  const selectedItem = form.orderItems.find((item) => item.menuItemId === menuItemId);

  if (!selectedItem) return;

  selectedItem.quantity -= 1;

  if (selectedItem.quantity <= 0) {
    form.orderItems = form.orderItems.filter((item) => item.menuItemId !== menuItemId);
  }
}

function getQuantity(menuItemId: string) {
  return form.orderItems.find((item) => item.menuItemId === menuItemId)?.quantity ?? 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function resetForm() {
  formError.value = '';
  Object.assign(form, { ...emptyForm, orderItems: [] });
}

function adjustGuestsToTableSeats() {
  if (form.guests > selectedTableSeats.value) {
    form.guests = selectedTableSeats.value;
  }

  if (form.guests < 1) {
    form.guests = 1;
  }
}

function formatPhone() {
  const digits = form.customerPhone.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) {
    form.customerPhone = digits;
    return;
  }

  if (digits.length <= 6) {
    form.customerPhone = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return;
  }

  if (digits.length <= 10) {
    form.customerPhone = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return;
  }

  form.customerPhone = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
</script>
