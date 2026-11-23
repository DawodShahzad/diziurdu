import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

try {
  registerSW({
    immediate: true,
    onOfflineReady() {
      // Service worker precache complete
    }
  });
} catch {
  // Ignore SW registration issues in restricted contexts
}

createRoot(document.getElementById('root')!).render(<App />);
