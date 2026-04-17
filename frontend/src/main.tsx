import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App';
// @ts-ignore
import SolarScope from './components/solarscope-landing';
import 'leaflet/dist/leaflet.css';
import './index.css';
import './store/themeStore'; // Initialize theme on load
import { useAuthStore } from './store/authStore';

const LandingWrapper = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/app" replace /> : <SolarScope onGetStarted={() => {}} />;
};

const isNative = Capacitor.isNativePlatform();

if (isNative) {
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#0A0A0A' });
  SplashScreen.hide();
}

// Use HashRouter for generic file:// protocol on Android/iOS to prevent white screens,
// but use standard BrowserRouter for the web.
const Router = isNative ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<LandingWrapper />} />
        <Route path="/app" element={<App />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
