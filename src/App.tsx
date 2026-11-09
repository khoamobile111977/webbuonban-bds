import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DEFAULT_SITE_SETTINGS, LandPlot, SiteSettings } from './types';
import {
  fetchLandPlots,
  fetchSiteSettings,
  getCachedLandPlots,
  getCachedSiteSettings,
} from './supabase';
import { HomePage } from './HomePage';
import { LoginPage } from './LoginPage';
import { AdminPage } from './AdminPage';

const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function checkValidAdminSession(): boolean {
  try {
    const isAuth = sessionStorage.getItem('bds_admin_auth_v2') === 'true' ||
      localStorage.getItem('bds_admin_authenticated') === 'true';
    const loginTime = Number(localStorage.getItem('bds_admin_login_time') || 0);
    if (!isAuth) return false;
    if (loginTime && Date.now() - loginTime > ADMIN_SESSION_TTL_MS) {
      sessionStorage.removeItem('bds_admin_auth_v2');
      localStorage.removeItem('bds_admin_authenticated');
      localStorage.removeItem('bds_admin_login_time');
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export const App: React.FC = () => {
  const [cachedInitialSettings] = useState<SiteSettings | null>(() => getCachedSiteSettings());
  const [cachedInitialPlots] = useState<LandPlot[] | null>(() => getCachedLandPlots());

  const [settings, setSettings] = useState<SiteSettings>(
    cachedInitialSettings || DEFAULT_SITE_SETTINGS
  );
  const [plots, setPlots] = useState<LandPlot[]>(cachedInitialPlots || []);
  const [initialBootstrapping, setInitialBootstrapping] = useState<boolean>(
    !cachedInitialSettings
  );
  const [loadingPlots, setLoadingPlots] = useState<boolean>(!cachedInitialPlots);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    checkValidAdminSession()
  );

  const loadAllData = useCallback(async () => {
    const [fetchedSettings, fetchedPlots] = await Promise.all([
      fetchSiteSettings(),
      fetchLandPlots(),
    ]);
    setSettings(fetchedSettings);
    setPlots(fetchedPlots);
    setInitialBootstrapping(false);
    setLoadingPlots(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (!initialBootstrapping && settings.brand_name) {
      document.title = settings.brand_tagline
        ? `${settings.brand_name} — ${settings.brand_tagline}`
        : settings.brand_name;
    }
  }, [initialBootstrapping, settings.brand_name, settings.brand_tagline]);

  // Prevent flashing outdated default text on first uncached load
  if (initialBootstrapping) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-2xl border-4 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-slate-300 tracking-wide">
            Đang tải dữ liệu trang web...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<HomePage settings={settings} plots={plots} loading={loadingPlots} />}
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
                onLogout={() => {
                  sessionStorage.removeItem('bds_admin_auth_v2');
                  localStorage.removeItem('bds_admin_authenticated');
                  localStorage.removeItem('bds_admin_login_time');
                  setIsAuthenticated(false);
                }}
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
