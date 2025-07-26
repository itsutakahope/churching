import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css'; // Import Tailwind CSS entry file
import { app } from './firebaseConfig.js'; // Import Firebase app instance
import { AuthProvider } from './AuthContext.jsx'; // Import AuthProvider
import { ThemeProvider } from './ThemeContext.jsx'; // Import ThemeProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
