import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Initialises i18next before the first render, so no component ever mounts
// against an empty resource store.
import './i18n';
// Self-hosted rather than a CDN link: index.css has always named Inter first
// in its font stack and nothing ever fetched it, so the app has been rendering
// in whatever the system had. Bundling it keeps "no account, no server" true
// and means the typography still holds up offline.
import '@fontsource-variable/inter';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
