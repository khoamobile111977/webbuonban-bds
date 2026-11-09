import { createClient } from '@supabase/supabase-js';
import { DEFAULT_SITE_SETTINGS, LandPlot, SiteSettings } from './types';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://irckeiwfvlaqhnxnprzh.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyY2tlaXdmdmxhcWhueG5wcnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMDYxOTksImV4cCI6MjEwOTc4MjE5OX0.aVcxxrMFEUpSR9VeDmSeVdYmljxOAV-aXaswN-jbPHI';

const SETTINGS_CACHE_KEY = 'bds_site_settings_cache_v3';
const PLOTS_CACHE_KEY = 'bds_land_plots_cache_v3';
const ADMIN_SESSION_STORAGE_KEY = 'bds_admin_session_token_v3';
const STORAGE_BUCKET = 'land-media';
const STORAGE_PUBLIC_PREFIX = `/storage/v1/object/public/${STORAGE_BUCKET}/`;

interface StoredAdminSession {
  token: string;
  expiresAt: number;
}

export function getAdminToken(): string | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredAdminSession = JSON.parse(raw);
    if (!parsed.token || !parsed.expiresAt || Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      return null;
    }
    return parsed.token;
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    const session: StoredAdminSession = {
      token,
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    };
    sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore storage quota errors
  }
}

export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: (url, options = {}) => {
      const headers = new Headers(options.headers);
      const token = getAdminToken();
      if (token) {
        headers.set('x-admin-token', token);
      }
      return fetch(url, { ...options, headers });
    },
  },
});

export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed;
    }
    return '';
  } catch {
    return '';
  }
}

export function getCachedSiteSettings(): SiteSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SITE_SETTINGS, ...parsed };
  } catch {
    return null;
  }
}

export function setCachedSiteSettings(settings: SiteSettings): void {
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota errors
  }
}

export function getCachedLandPlots(): LandPlot[] | null {
  try {
    const raw = localStorage.getItem(PLOTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setCachedLandPlots(plots: LandPlot[]): void {
  try {
    localStorage.setItem(PLOTS_CACHE_KEY, JSON.stringify(plots));
  } catch {
    // ignore quota errors
  }
}

export function extractStorageFilePath(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const idx = url.indexOf(STORAGE_PUBLIC_PREFIX);
  if (idx === -1) return null;
  const rawPath = url.slice(idx + STORAGE_PUBLIC_PREFIX.length).split('?')[0].split('#')[0];
  return rawPath ? decodeURIComponent(rawPath) : null;
}

export async function deleteStorageFilesByUrls(urls: string[]): Promise<void> {
  const paths = Array.from(
    new Set(
      urls
        .map((u) => extractStorageFilePath(u))
        .filter((p): p is string => Boolean(p && p.length > 0))
    )
  );
  if (paths.length === 0) return;
  await supabase.storage.from(STORAGE_BUCKET).remove(paths);
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    return getCachedSiteSettings() || DEFAULT_SITE_SETTINGS;
  }

  const merged: SiteSettings = {
    ...DEFAULT_SITE_SETTINGS,
    ...data,
  };
  setCachedSiteSettings(merged);
  return merged;
}

export async function updateSiteSettings(
  settings: Partial<SiteSettings>,
  previousSettings?: SiteSettings
): Promise<{ error: string | null; updated?: SiteSettings }> {
  const urlsToClean: string[] = [];
  if (
    previousSettings?.broker_avatar &&
    settings.broker_avatar !== undefined &&
    settings.broker_avatar !== previousSettings.broker_avatar
  ) {
    urlsToClean.push(previousSettings.broker_avatar);
  }
  if (
    previousSettings?.hero_image &&
    settings.hero_image !== undefined &&
    settings.hero_image !== previousSettings.hero_image
  ) {
    urlsToClean.push(previousSettings.hero_image);
  }
  if (
    previousSettings?.favicon_url &&
    settings.favicon_url !== undefined &&
    settings.favicon_url !== previousSettings.favicon_url
  ) {
    urlsToClean.push(previousSettings.favicon_url);
  }

  const payload = {
    ...settings,
    id: 1,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('site_settings')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    return { error: error.message };
  }

  if (urlsToClean.length > 0) {
    await deleteStorageFilesByUrls(urlsToClean);
  }

  const merged: SiteSettings = {
    ...DEFAULT_SITE_SETTINGS,
    ...(data || payload),
  };
  setCachedSiteSettings(merged);
  return { error: null, updated: merged };
}

export async function fetchLandPlots(): Promise<LandPlot[]> {
  const { data, error } = await supabase
    .from('land_plots')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error || !data) {
    return getCachedLandPlots() || [];
  }

  const normalized = (data as LandPlot[]).map((item) => ({
    ...item,
    price_display: item.price_display ?? '',
    price_per_m2: item.price_per_m2 ?? '',
    dimensions: item.dimensions ?? '',
    direction: item.direction ?? '',
    road_width: item.road_width ?? '',
    legal_status: item.legal_status ?? '',
    map_url: sanitizeUrl(item.map_url),
    description: item.description ?? '',
    highlights: Array.isArray(item.highlights) ? item.highlights : [],
    images: Array.isArray(item.images) ? item.images.map(sanitizeUrl).filter(Boolean) : [],
    videos: Array.isArray(item.videos) ? item.videos.map(sanitizeUrl).filter(Boolean) : [],
  }));

  setCachedLandPlots(normalized);
  return normalized;
}

export async function createLandPlot(
  plot: Omit<LandPlot, 'id' | 'created_at'>
): Promise<{ data: LandPlot | null; error: string | null }> {
  const newId = `plot-${Date.now()}`;
  const { data, error } = await supabase
    .from('land_plots')
    .insert([{ ...plot, id: newId }])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as LandPlot, error: null };
}

export async function updateLandPlot(
  id: string,
  updates: Partial<LandPlot>,
  previousPlot?: LandPlot | null
): Promise<{ error: string | null }> {
  if (previousPlot) {
    const oldMedia = [...(previousPlot.images || []), ...(previousPlot.videos || [])];
    const newMedia = new Set([
      ...(updates.images !== undefined ? updates.images : previousPlot.images || []),
      ...(updates.videos !== undefined ? updates.videos : previousPlot.videos || []),
    ]);
    const removedUrls = oldMedia.filter((url) => !newMedia.has(url));
    if (removedUrls.length > 0) {
      await deleteStorageFilesByUrls(removedUrls);
    }
  }

  const { error } = await supabase.from('land_plots').update(updates).eq('id', id);
  return { error: error ? error.message : null };
}

export async function deleteLandPlot(plot: LandPlot): Promise<{ error: string | null }> {
  const allMediaUrls = [...(plot.images || []), ...(plot.videos || [])];
  if (allMediaUrls.length > 0) {
    await deleteStorageFilesByUrls(allMediaUrls);
  }

  const { error } = await supabase.from('land_plots').delete().eq('id', plot.id);
  return { error: error ? error.message : null };
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

export async function uploadMediaFile(
  file: File,
  folder: 'images' | 'videos' | 'site' = 'images'
): Promise<{ url: string | null; error: string | null }> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      url: null,
      error: 'Định dạng tệp không hợp lệ. Chỉ chấp nhận ảnh (JPG, PNG, WEBP) hoặc video (MP4, MOV, WEBM).',
    };
  }

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(safeName, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(safeName);
  return { url: data.publicUrl, error: null };
}

export async function verifyAdminLogin(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('verify_admin_login', {
    p_username: username.trim(),
    p_password: password,
  });

  if (error) {
    return { success: false, error: 'Không thể kết nối máy chủ xác thực.' };
  }

  const res = data as { success?: boolean; token?: string; error?: string } | null;
  if (!res || !res.success || !res.token) {
    return {
      success: false,
      error: res?.error || 'Tài khoản hoặc mật khẩu không chính xác.',
    };
  }

  setAdminToken(res.token);
  return { success: true };
}

export async function changeAdminPassword(
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('change_admin_password', {
    p_old_password: oldPassword,
    p_new_password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const res = data as { success?: boolean; error?: string } | null;
  if (!res || !res.success) {
    return {
      success: false,
      error: res?.error || 'Đổi mật khẩu thất bại.',
    };
  }

  return { success: true };
}

export async function logoutAdminSession(): Promise<void> {
  try {
    await supabase.rpc('logout_admin_session');
  } catch {
    // ignore network error on logout
  } finally {
    clearAdminToken();
  }
}

export function formatZaloLink(phone: string): string {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  return `https://zalo.me/${cleanPhone}`;
}
