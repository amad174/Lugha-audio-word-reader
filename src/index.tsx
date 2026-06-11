import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tokens.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { connectFirebaseEmulators } from './firebase/config';

if (process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
  connectFirebaseEmulators();
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
