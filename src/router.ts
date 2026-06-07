import { createRouter, createWebHistory } from 'vue-router';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';

const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginView,
    meta: { publicOnly: true },
  },
  {
    path: '/painel',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

let currentUser: User | null = auth.currentUser;
let authReady = false;
const authReadyPromise = new Promise<User | null>((resolve) => {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (!authReady) {
      authReady = true;
      resolve(user);
    }
  });
});

async function waitForUser() {
  if (!authReady) {
    await authReadyPromise;
  }

  return currentUser;
}

router.beforeEach(async (to) => {
  const user = await waitForUser();

  if (to.meta.requiresAuth && !user) {
    return { name: 'login' };
  }

  if (to.meta.publicOnly && user) {
    return { name: 'dashboard' };
  }

  return true;
});
