import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  fetchLandPlots,
  fetchSiteSettings,
  getAdminToken,
  getCachedLandPlots,
  getCachedSiteSettings,
  logoutAdminSession,
  sanitizeUrl,
} from './supabase';
import { AdminPage } from './AdminPage';
import { HomePage } from './HomePage';
import { LoginPage } from './LoginPage';
import { DEFAULT_SITE_SETTINGS, LandPlot, SiteSettings } from './types';

const DEFAULT_SVG_FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231E40AF'/%3E%3Cstop offset='100%25' y2='100%25' stop-color='%230F172A'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Cpath d='M16 48V24l16-10 16 10v24H16z' fill='none' stroke='%23F59E0B' stroke-width='4' stroke-linejoin='round'/%3E%3Cpath d='M26 48V34h12v14' fill='none' stroke='%23FFFFFF' stroke-width='4' stroke-linejoin='round'/%3E%3Ccircle cx='32' cy='25' r='3' fill='%23F59E0B'/%3E%3C/svg%3E";

export function App() {
  const cachedSettings = getCachedSiteSettings();
  const cachedPlots = getCachedLandPlots();

  const [settings, setSettings] = useState<SiteSettings>(
    cachedSettings || DEFAULT_SITE_SETTINGS
  );
  const [plots, setPlots] = useState<LandPlot[]>(cachedPlots || []);
  const [loading, setLoading] = useState<boolean>(!cachedSettings);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() =>
    Boolean(getAdminToken())
  );

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
      document.title = settings.brand_tagline
        ? `${settings.brand_name} — ${settings.brand_tagline}`
        : settings.brand_name;
    }

    const faviconEl = document.getElementById('site-favicon') as HTMLLinkElement | null;
    if (faviconEl) {
      const customIcon = sanitizeUrl(settings.favicon_url);
      if (customIcon) {
        faviconEl.type = 'image/png';
        faviconEl.href = customIcon;
      } else {
        faviconEl.type = 'image/svg+xml';
        faviconEl.href = DEFAULT_SVG_FAVICON;
      }
    }
  }, [settings.brand_name, settings.brand_tagline, settings.favicon_url]);

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
  };

  const handleLogout = () => {
    logoutAdminSession();
    setIsAdminAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-3 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<HomePage settings={settings} plots={plots} loading={false} />}
        />
        <Route
          path="/login"
          element={
            isAdminAuthenticated ? (
              <Navigate to="/admin" replace />
            ) : (
              <LoginPage settings={settings} onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/admin"
          element={
            isAdminAuthenticated ? (
              <AdminPage
                settings={settings}
                plots={plots}
                onRefreshData={loadAllData}
                onLogout={handleLogout}
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
}

export default App;
