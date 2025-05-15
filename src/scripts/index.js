import '../styles/styles.css';
import App from './pages/app';
import CONFIG from './config';

window.CONFIG = CONFIG;

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  const navList = document.getElementById('nav-list');

  function updateNav() {
    const token = localStorage.getItem('authToken');
    navList.innerHTML = '';

    navList.appendChild(createNavItem('#/', 'Beranda'));
    if (token) {
      navList.appendChild(createNavItem('#/add', 'Add Story'));
      navList.appendChild(createNavItem('#/logout', 'Logout'));
    } else {
      navList.appendChild(createNavItem('#/login', 'Login'));
      navList.appendChild(createNavItem('#/register', 'Register'));
    }
  }

  function createNavItem(href, text) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    a.tabIndex = 0;
    li.appendChild(a);
    return li;
  }

  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#/logout') {
      localStorage.removeItem('authToken');
      updateNav();
      window.location.hash = '#/';
    }
  });

  updateNav();

  await app.renderPage();

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const vapidPublicKey = window.CONFIG?.VAPID_PUBLIC_KEY || '';
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });

        console.log('Push subscription:', subscription);
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
    updateNav();
  });

  // Utility function to convert VAPID key
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
});
