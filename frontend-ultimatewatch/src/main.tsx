import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import toast from 'react-hot-toast'

const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const response = await originalFetch(...args);

  if (response.status === 401) {
    console.warn("Session expired or invalid token. Forcing logout...");

    toast.dismiss();
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    window.location.href = '/login';
  }

  return response;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
