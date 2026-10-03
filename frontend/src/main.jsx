import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0d1424',
            color: '#f0f4ff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontFamily: 'Cairo, sans-serif',
            backdropFilter: 'blur(20px)',
            direction: 'rtl',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#0d1424' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0d1424' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
