import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DEFAULT_SITE_SETTINGS, LandPlot, SiteSettings } from './types';
import { fetchLandPlots, fetchSiteSettings } from './supabase';
import { HomePage } from './HomePage';
import { LoginPage } from './LoginPage';
import { AdminPage } from './AdminPage';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [plots, setPlots] = useState<LandPlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('bds_admin_authenticated') === 'true';
  });

  const loadAllData = useCallback(async () => {
    const [fetchedSettings, fetchedPlots] = await Promise.all([
      fetchSiteSettings(),
      fetchLandPlots(),
    ]);
    setSettings(fetchedSettings);
    setPlots(fetchedPlots);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (settings.brand_name) {
      document.title = `${settings.brand_name} — ${settings.brand_tagline}`;
    }
  }, [settings.brand_name, settings.brand_tagline]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<HomePage settings={settings} plots={plots} loading={loading} />}
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/admin" replace />
            ) : (
              <LoginPage
                settings={settings}
                onLoginSuccess={() => setIsAuthenticated(true)}
              />
            )
          }
        />
        <Route
          path="/admin"
          element={
            isAuthenticated ? (
              <AdminPage
                settings={settings}
                plots={plots}
                onRefreshData={loadAllData}
                onLogout={() => setIsAuthenticated(false)}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
