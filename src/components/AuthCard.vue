<template>
  <section class="auth-card">
    <div class="brand-block">
      <span class="brand-mark">MR</span>
      <div>
        <p class="eyebrow">MesaRapida</p>
        <h1>Controle de mesas e reservas para restaurante.</h1>
      </div>
    </div>

    <div class="tabs" aria-label="Alternar autenticacao">
      <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Entrar</button>
      <button :class="{ active: mode === 'register' }" @click="mode = 'register'">Cadastrar</button>
    </div>

    <form class="form" @submit.prevent="submit">
      <label v-if="mode === 'register'">
        Nome
        <input v-model.trim="name" type="text" autocomplete="name" placeholder="Seu nome" required />
      </label>

      <label>
        E-mail
        <input v-model.trim="email" type="email" autocomplete="email" placeholder="voce@email.com" required />
      </label>

      <label>
        Senha
        <input v-model="password" type="password" autocomplete="current-password" minlength="6" placeholder="Minimo 6 caracteres" required />
      </label>

      <p v-if="error" class="error">{{ error }}</p>

      <button class="primary-button" type="submit" :disabled="loading">
        {{ loading ? loadingLabel : mode === 'login' ? 'Entrar no painel' : 'Criar conta' }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginUser, registerUser } from '../services/authService';

const router = useRouter();
const mode = ref<'login' | 'register'>('login');
const name = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const loadingLabel = ref('Aguarde...');

async function submit() {
  loading.value = true;
  loadingLabel.value = mode.value === 'register' ? 'Criando conta...' : 'Entrando...';
  error.value = '';

  try {
    if (mode.value === 'register') {
      await registerUser(name.value, email.value, password.value, 'cliente');
    } else {
      await loginUser(email.value, password.value);
    }

    await router.push('/painel');
  } catch (exception) {
    error.value = authErrorMessage(exception);
  } finally {
    loading.value = false;
  }
}

function authErrorMessage(exception: unknown) {
  const code = typeof exception === 'object' && exception && 'code' in exception ? String(exception.code) : '';

  if (code === 'auth/email-already-in-use') {
    return 'Este e-mail ja esta cadastrado. Exclua a conta em Authentication ou use outro e-mail.';
  }

  if (code === 'auth/invalid-credential') {
    return 'E-mail ou senha incorretos.';
  }

  return 'Nao foi possivel autenticar. Verifique os dados e tente novamente.';
}
</script>
