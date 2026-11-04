import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

// Apply the saved theme before first paint so the login page matches too.
if (localStorage.getItem('edms_theme') === 'light') {
  document.documentElement.classList.add('light-theme');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--app-menu-bg)',
            color: 'var(--app-heading)',
            border: '1px solid var(--app-user-chip-border)',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontFamily: 'Cairo, sans-serif',
            backdropFilter: 'blur(20px)',
            direction: 'rtl',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: 'var(--app-menu-bg)' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: 'var(--app-menu-bg)' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
