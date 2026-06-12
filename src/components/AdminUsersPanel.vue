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

   

    <form class="staff-form" @submit.prevent="submitWaiter">
      <div>
        <p class="eyebrow">Funcionario</p>
        <h3>Criar garcom</h3>
      </div>

      <label>
        Nome
        <input v-model.trim="waiterName" type="text" placeholder="Nome do garcom" required />
      </label>

      <label>
        E-mail
        <input v-model.trim="waiterEmail" type="email" placeholder="garcom@email.com" required />
      </label>

      <label>
        Senha
        <input v-model="waiterPassword" type="password" minlength="6" placeholder="Minimo 6 caracteres" required />
      </label>

      <button class="primary-button" type="submit" :disabled="creating">
        {{ creating ? 'Criando...' : 'Criar garcom' }}
      </button>
    </form>

    <p v-if="message" class="success-message">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

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
        <button class="danger-button" type="button" @click="removeUser(item.id)">Remover perfil</button>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Reservation, UserProfile, UserRole } from '../types';

const props = defineProps<{
  users: UserProfile[];
  reservations: Reservation[];
  createWaiter: (data: { name: string; email: string; password: string }) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}>();

const waiterName = ref('');
const waiterEmail = ref('');
const waiterPassword = ref('');
const creating = ref(false);
const message = ref('');
const error = ref('');

async function submitWaiter() {
  creating.value = true;
  message.value = '';
  error.value = '';

  try {
    await props.createWaiter({
      name: waiterName.value,
      email: waiterEmail.value,
      password: waiterPassword.value,
    });
    waiterName.value = '';
    waiterEmail.value = '';
    waiterPassword.value = '';
    message.value = 'Garcom criado com sucesso.';
  } catch (exception) {
    error.value = authErrorMessage(exception);
  } finally {
    creating.value = false;
  }
}

function countByRole(role: UserRole) {
  return props.users.filter((item) => item.role === role).length;
}

function reservationCount(userId: string) {
  return props.reservations.filter((item) => item.createdBy === userId).length;
}

async function removeUser(userId: string) {
  if (!window.confirm('Remover este perfil do Firestore? Para reutilizar o e-mail, exclua tambem a conta em Authentication.')) return;
  await props.deleteUser(userId);
}

function authErrorMessage(exception: unknown) {
  const code = typeof exception === 'object' && exception && 'code' in exception ? String(exception.code) : '';

  if (code === 'auth/email-already-in-use') {
    return 'Este e-mail ainda existe no Firebase Authentication. Exclua a conta em Authentication antes de criar outra com o mesmo e-mail.';
  }

  return 'Nao foi possivel criar o garcom.';
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
