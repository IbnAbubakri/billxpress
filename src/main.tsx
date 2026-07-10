import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryProvider } from './api/QueryProvider';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>
);
