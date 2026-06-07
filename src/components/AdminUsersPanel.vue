<template>
  <section class="admin-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Administracao</p>
        <h2>Clientes e funcionarios</h2>
      </div>
      <span class="counter">{{ users.length }}</span>
    </div>

    <div class="admin-summary">
      <div>
        <span>Clientes</span>
        <strong>{{ countByRole('cliente') }}</strong>
      </div>
      <div>
        <span>Garcons</span>
        <strong>{{ countByRole('garcom') }}</strong>
      </div>
      <div>
        <span>Admins</span>
        <strong>{{ countByRole('admin') }}</strong>
      </div>
    </div>

    <div v-if="users.length === 0" class="empty-state">
      Nenhum usuario encontrado. Se as contas foram criadas antes da colecao usuarios estar liberada no Firestore, faca login nelas novamente para sincronizar o perfil.
    </div>

    <div v-else class="users-table">
      <article v-for="item in users" :key="item.id" class="user-row">
        <div>
          <strong>{{ item.name }}</strong>
          <span>{{ item.email }}</span>
        </div>
        <span class="status" :class="roleClass(item.role)">{{ roleLabel(item.role) }}</span>
        <span>{{ reservationCount(item.id) }} reserva(s)</span>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Reservation, UserProfile, UserRole } from '../types';

const props = defineProps<{
  users: UserProfile[];
  reservations: Reservation[];
}>();

function countByRole(role: UserRole) {
  return props.users.filter((item) => item.role === role).length;
}

function reservationCount(userId: string) {
  return props.reservations.filter((item) => item.createdBy === userId).length;
}

function roleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    admin: 'Admin',
    garcom: 'Garcom',
    cliente: 'Cliente',
  };

  return labels[role];
}

function roleClass(role: UserRole) {
  return role === 'garcom' ? 'reservada' : role === 'admin' ? 'ocupada' : 'livre';
}
</script>
