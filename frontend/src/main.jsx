import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/general.css';
import './styles/adminpages.css';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);