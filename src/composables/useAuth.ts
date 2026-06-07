import { onMounted, onUnmounted, ref } from 'vue';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';

export function useAuth() {
  const user = ref<User | null>(auth.currentUser);
  const loading = ref(true);
  let unsubscribe = () => undefined as void;

  onMounted(() => {
    unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser;
      loading.value = false;
    });
  });

  onUnmounted(() => unsubscribe());

  return { user, loading };
}
