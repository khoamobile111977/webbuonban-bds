import { createClient } from '@supabase/supabase-js';
import { DEFAULT_SITE_SETTINGS, LandPlot, SiteSettings } from './types';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://irckeiwfvlaqhnxnprzh.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyY2tlaXdmdmxhcWhueG5wcnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMDYxOTksImV4cCI6MjEwOTc4MjE5OX0.aVcxxrMFEUpSR9VeDmSeVdYmljxOAV-aXaswN-jbPHI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !data) {
    return DEFAULT_SITE_SETTINGS;
  }
  return { ...DEFAULT_SITE_SETTINGS, ...data };
}

export async function updateSiteSettings(
  updates: Partial<SiteSettings>
): Promise<{ data: SiteSettings | null; error: string | null }> {
  const payload = {
    ...updates,
    id: 1,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('site_settings')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data as SiteSettings, error: null };
}

export async function fetchLandPlots(): Promise<LandPlot[]> {
  const { data, error } = await supabase
    .from('land_plots')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    ...row,
    price_billion: Number(row.price_billion ?? 0),
    area_m2: Number(row.area_m2 ?? 0),
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    images: Array.isArray(row.images) ? row.images : [],
    videos: Array.isArray(row.videos) ? row.videos : [],
  }));
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
  updates: Partial<LandPlot>
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
  return { data: data as LandPlot, error: null };
}

export async function deleteLandPlot(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('land_plots').delete().eq('id', id);
  return { error: error ? error.message : null };
}

export async function uploadMediaFile(
  file: File,
  folder: 'images' | 'videos' | 'site' = 'images'
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('land-media')
    .upload(safeName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from('land-media').getPublicUrl(safeName);
  return { url: data.publicUrl, error: null };
}

export function buildZaloUrl(zaloPhone: string): string {
  const cleanPhone = (zaloPhone || '').replace(/[^0-9]/g, '');
  return `https://zalo.me/${cleanPhone || '0909123456'}`;
}

export function formatZaloMessage(
  template: string,
  plot: Pick<LandPlot, 'code' | 'title' | 'price_display' | 'area_m2' | 'location_name'>
): string {
  return (
    template ||
    'Chào anh/chị, tôi đang quan tâm đến lô đất {code} ({title}) giá {price} trên website.'
  )
    .replace(/\{code\}/g, plot.code)
    .replace(/\{title\}/g, plot.title)
    .replace(/\{price\}/g, plot.price_display)
    .replace(/\{area\}/g, `${plot.area_m2}m²`)
    .replace(/\{location\}/g, plot.location_name);
}
