import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Initialises i18next before the first render, so no component ever mounts
// against an empty resource store.
import './i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
