importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDYGTd87e7Y2kjfbHlS8ZNDMASJSTDi6Xg',
  authDomain: 'projeto-prova-alexandre.firebaseapp.com',
  projectId: 'projeto-prova-alexandre',
  storageBucket: 'projeto-prova-alexandre.firebasestorage.app',
  messagingSenderId: '1071178847441',
  appId: '1:1071178847441:web:3c312202f15f3563a9e1f0',
  measurementId: 'G-1JLGVG6RBC',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'MesaRapida';
  const options = {
    body: payload.notification?.body || 'Voce recebeu uma nova notificacao.',
    icon: '/favicon.ico',
  };

  self.registration.showNotification(title, options);
});
