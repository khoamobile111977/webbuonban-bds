import { createClient } from '@supabase/supabase-js';
import { DEFAULT_SITE_SETTINGS, LandPlot, SiteSettings } from './types';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://irckeiwfvlaqhnxnprzh.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyY2tlaXdmdmxhcWhueG5wcnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMDYxOTksImV4cCI6MjEwOTc4MjE5OX0.aVcxxrMFEUpSR9VeDmSeVdYmljxOAV-aXaswN-jbPHI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SETTINGS_CACHE_KEY = 'bds_site_settings_cache_v2';
const PLOTS_CACHE_KEY = 'bds_land_plots_cache_v2';
const STORAGE_BUCKET = 'land-media';
const STORAGE_PUBLIC_PREFIX = `/storage/v1/object/public/${STORAGE_BUCKET}/`;

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
    // Ignore storage quota errors
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
    // Ignore storage quota errors
  }
}

/**
 * Extracts the internal bucket file path (e.g., "images/179421000-abc.jpg")
 * if the URL points to our Supabase Storage bucket 'land-media'.
 */
export function extractStorageFilePath(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const idx = url.indexOf(STORAGE_PUBLIC_PREFIX);
  if (idx === -1) return null;
  const rawPath = url.slice(idx + STORAGE_PUBLIC_PREFIX.length).split('?')[0];
  return rawPath ? decodeURIComponent(rawPath) : null;
}

/**
 * Permanently deletes an array of media URLs from the Supabase Storage bucket 'land-media'.
 */
export async function deleteStorageFilesByUrls(urls: (string | undefined | null)[]): Promise<void> {
  const paths = Array.from(
    new Set(
      urls
        .map((u) => extractStorageFilePath(u))
        .filter((p): p is string => Boolean(p))
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
    .single();

  if (error || !data) {
    const cached = getCachedSiteSettings();
    return cached || DEFAULT_SITE_SETTINGS;
  }

  const merged: SiteSettings = { ...DEFAULT_SITE_SETTINGS, ...data };
  setCachedSiteSettings(merged);
  return merged;
}

export async function updateSiteSettings(
  updates: Partial<SiteSettings>,
  previousSettings?: SiteSettings
): Promise<{ data: SiteSettings | null; error: string | null }> {
  const cleanUpdates: Record<string, any> = {
    ...updates,
    id: 1,
    updated_at: new Date().toISOString(),
  };
  delete cleanUpdates.admin_username;
  delete cleanUpdates.admin_password;
  delete cleanUpdates.zalo_greeting_template;

  // Directly overwrite row id = 1 in public.site_settings
  const { data, error } = await supabase
    .from('site_settings')
    .update(cleanUpdates)
    .eq('id', 1)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  // Clean up old replaced site images from Supabase Storage so DB/Storage stays lean
  if (previousSettings) {
    const obsoleteUrls: string[] = [];
    if (
      previousSettings.broker_avatar &&
      updates.broker_avatar !== undefined &&
      previousSettings.broker_avatar !== updates.broker_avatar
    ) {
      obsoleteUrls.push(previousSettings.broker_avatar);
    }
    if (
      previousSettings.hero_image &&
      updates.hero_image !== undefined &&
      previousSettings.hero_image !== updates.hero_image
    ) {
      obsoleteUrls.push(previousSettings.hero_image);
    }
    if (obsoleteUrls.length > 0) {
      await deleteStorageFilesByUrls(obsoleteUrls);
    }
  }

  const merged: SiteSettings = { ...DEFAULT_SITE_SETTINGS, ...data };
  setCachedSiteSettings(merged);
  return { data: merged, error: null };
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

  const normalized: LandPlot[] = data.map((row: any) => ({
    ...row,
    price_display: row.price_display ?? '',
    price_billion: Number(row.price_billion ?? 0),
    price_per_m2: row.price_per_m2 ?? '',
    area_m2: Number(row.area_m2 ?? 0),
    dimensions: row.dimensions ?? '',
    direction: row.direction ?? '',
    road_width: row.road_width ?? '',
    legal_status: row.legal_status ?? '',
    map_url: row.map_url ?? '',
    description: row.description ?? '',
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    images: Array.isArray(row.images) ? row.images : [],
    videos: Array.isArray(row.videos) ? row.videos : [],
  }));

  setCachedLandPlots(normalized);
  return normalized;
}

export async function createLandPlot(
  plot: Omit<LandPlot, 'id' | 'created_at'>
): Promise<{ data: LandPlot | null; error: string | null }> {
  const { data, error } = await supabase
    .from('land_plots')
    .insert([plot])
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as LandPlot, error: null };
}

export async function updateLandPlot(
  id: string,
  updates: Partial<LandPlot>,
  previousPlot?: LandPlot
): Promise<{ data: LandPlot | null; error: string | null }> {
  const { id: _unusedId, created_at: _unusedCreated, ...cleanUpdates } = updates as any;
  const { data, error } = await supabase
    .from('land_plots')
    .update(cleanUpdates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  // If any images or videos were removed during editing, purge them from Supabase Storage
  if (previousPlot) {
    const newImages = new Set(updates.images ?? previousPlot.images ?? []);
    const newVideos = new Set(updates.videos ?? previousPlot.videos ?? []);
    const removedUrls: string[] = [];

    for (const oldImg of previousPlot.images || []) {
      if (!newImages.has(oldImg)) removedUrls.push(oldImg);
    }
    for (const oldVid of previousPlot.videos || []) {
      if (!newVideos.has(oldVid)) removedUrls.push(oldVid);
    }
    if (removedUrls.length > 0) {
      await deleteStorageFilesByUrls(removedUrls);
    }
  }

  return { data: data as LandPlot, error: null };
}

/**
 * Deletes a land plot AND permanently deletes all associated images and videos from Supabase Storage.
 */
export async function deleteLandPlot(plot: LandPlot): Promise<{ error: string | null }> {
  const allMediaUrls = [...(plot.images || []), ...(plot.videos || [])];
  if (allMediaUrls.length > 0) {
    await deleteStorageFilesByUrls(allMediaUrls);
  }

  const { error } = await supabase.from('land_plots').delete().eq('id', plot.id);
  return { error: error ? error.message : null };
}

export async function uploadMediaFile(
  file: File,
  folder: 'images' | 'videos' | 'site' = 'images'
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(safeName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(safeName);
  return { url: data.publicUrl, error: null };
}

/**
 * Server-side Bcrypt login verification via PostgreSQL RPC with brute-force protection.
 */
export async function verifyAdminLogin(
  username: string,
  password: string
): Promise<{ success: boolean; username?: string; error?: string }> {
  const { data, error } = await supabase.rpc('verify_admin_login', {
    p_username: username,
    p_password: password,
  });

  if (error) {
    return { success: false, error: 'Không thể kết nối máy chủ xác thực. Vui lòng thử lại.' };
  }
  return data as { success: boolean; username?: string; error?: string };
}

/**
 * Server-side password & username change requiring the current (old) password.
 */
export async function changeAdminCredentials(
  oldPassword: string,
  newUsername: string,
  newPassword: string
): Promise<{ success: boolean; username?: string; error?: string }> {
  const { data, error } = await supabase.rpc('change_admin_credentials', {
    p_old_password: oldPassword,
    p_new_username: newUsername,
    p_new_password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return data as { success: boolean; username?: string; error?: string };
}

export async function fetchAdminUsername(): Promise<string> {
  const { data, error } = await supabase.rpc('get_admin_username');
  if (error || !data) return 'admin';
  return String(data);
}

export function buildZaloUrl(zaloPhone: string): string {
  const cleanPhone = (zaloPhone || '').replace(/[^0-9]/g, '');
  return `https://zalo.me/${cleanPhone || '0823195002'}`;
}
