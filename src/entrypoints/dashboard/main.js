import '../../assets/tailwind.css';
import { mount } from 'svelte';
import App from './App.svelte';

// Bridge prefers-color-scheme → .dark class for shadcn components
function applyDarkMode() {
  document.documentElement.classList.toggle(
    'dark',
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}
applyDarkMode();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyDarkMode);

const app = mount(App, {
  target: document.getElementById('app'),
});

export default app;
