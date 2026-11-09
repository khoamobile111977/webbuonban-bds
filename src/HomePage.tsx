import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Building2,
  Clock,
  Compass,
  Eye,
  FileCheck,
  Filter,
  Image as ImageIcon,
  LayoutGrid,
  ListFilter,
  Mail,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  Route,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
} from 'lucide-react';
import { PlotDetailModal } from './PlotDetailModal';
import { formatZaloLink } from './supabase';
import { LAND_CATEGORIES, LandPlot, PlotStatus, SiteSettings } from './types';

interface HomePageProps {
  settings: SiteSettings;
  plots: LandPlot[];
  loading: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ settings, plots, loading }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDirection, setSelectedDirection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'area_desc'>(
    'featured'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activePlot, setActivePlot] = useState<LandPlot | null>(null);

  const availableDirections = useMemo(() => {
    const dirs = new Set<string>();
    plots.forEach((p) => {
      if (p.direction && p.direction.trim()) {
        dirs.add(p.direction.trim());
      }
    });
    return Array.from(dirs);
  }, [plots]);

  const filteredPlots = useMemo(() => {
    return plots
      .filter((plot) => {
        if (selectedCategory !== 'Tất cả' && plot.category !== selectedCategory) {
          return false;
        }
        if (selectedStatus !== 'all' && plot.status !== selectedStatus) {
          return false;
        }
        if (selectedDirection !== 'all' && plot.direction !== selectedDirection) {
          return false;
        }
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchTitle = (plot.title || '').toLowerCase().includes(q);
          const matchCode = (plot.code || '').toLowerCase().includes(q);
          const matchLocation = (plot.location_name || '').toLowerCase().includes(q);
          const matchProvince = (plot.province || '').toLowerCase().includes(q);
          if (!matchTitle && !matchCode && !matchLocation && !matchProvince) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return (a.price_billion || 0) - (b.price_billion || 0);
        if (sortBy === 'price_desc') return (b.price_billion || 0) - (a.price_billion || 0);
        if (sortBy === 'area_desc') return (b.area_m2 || 0) - (a.area_m2 || 0);
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return 0;
      });
  }, [plots, selectedCategory, selectedStatus, selectedDirection, searchQuery, sortBy]);

  const handleDirectZaloPlot = (e: React.MouseEvent, _plot: LandPlot) => {
    e.stopPropagation();
    const zaloUrl = formatZaloLink(settings.zalo_phone);
    window.open(zaloUrl, '_blank', 'noopener,noreferrer');
  };

  const renderStatusPill = (status: PlotStatus) => {
    if (status === 'available') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          Đang Mở Bán
        </span>
      );
    }
    if (status === 'reserved') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1 text-xs font-bold text-slate-950 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-slate-950" />
          Đã Nhận Cọc
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
        Đã Bán
      </span>
    );
  };

  const hasStats = Boolean(
    (settings.stat_1_value && settings.stat_1_value.trim()) ||
      (settings.stat_2_value && settings.stat_2_value.trim()) ||
      (settings.stat_3_value && settings.stat_3_value.trim())
  );

  const hasProcessSteps = Boolean(
    settings.show_process_section &&
      ((settings.step_1_title && settings.step_1_title.trim()) ||
        (settings.step_2_title && settings.step_2_title.trim()) ||
        (settings.step_3_title && settings.step_3_title.trim()) ||
        (settings.step_4_title && settings.step_4_title.trim()))
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9] text-[#0F172A]">
      {/* Top Announcement Bar */}
      {(settings.brand_tagline?.trim() ||
        settings.office_address?.trim() ||
        settings.zalo_phone?.trim()) && (
        <div className="bg-[#0F172A] text-slate-200 border-b border-white/10 text-xs sm:text-sm">
          <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-10 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-medium text-amber-400">
              {settings.brand_tagline?.trim() && <span>{settings.brand_tagline}</span>}
            </div>
            <div className="flex items-center gap-5 text-xs sm:text-sm">
              {settings.office_address?.trim() && (
                <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  Địa chỉ: <strong className="text-white">{settings.office_address}</strong>
                </span>
              )}
              {settings.zalo_phone?.trim() && (
                <a
                  href={formatZaloLink(settings.zalo_phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-tech font-bold text-amber-400 hover:text-amber-300"
                >
                  Zalo: {settings.zalo_phone} ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-3.5 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-slate-900 text-amber-400 shadow-md transition group-hover:scale-105">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 block leading-none">
                {settings.brand_name}
              </span>
              {settings.brand_subtitle && settings.brand_subtitle.trim() && (
                <span className="mt-1 text-[11px] font-bold uppercase tracking-widest text-blue-700 block">
                  {settings.brand_subtitle}
                </span>
              )}
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-8 text-base font-bold text-slate-700">
            <a href="#danh-sach-lo-dat" className="hover:text-blue-600 transition">
              Danh Sách Lô Đất ({plots.length})
            </a>
            {hasProcessSteps && (
              <a href="#quy-trinh" className="hover:text-blue-600 transition">
                {settings.process_title || 'Quy Trình'}
              </a>
            )}
            <a href="#lien-he" className="hover:text-blue-600 transition">
              Liên Hệ {settings.broker_name}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {settings.hotline?.trim() && (
              <a
                href={`tel:${settings.hotline.replace(/\D/g, '')}`}
                className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-900 hover:text-white"
              >
                <Phone className="h-4 w-4 text-blue-600" />
                <span className="font-tech">{settings.hotline}</span>
              </a>
            )}

            <a
              href={formatZaloLink(settings.zalo_phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0068FF] px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-blue-600/25 transition hover:bg-[#0055D4]"
            >
              <MessageCircle className="h-4 w-4 fill-current" />
              <span>Liên Hệ Zalo</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#0F172A] text-white">
        <div className="absolute inset-0 opacity-30">
          <img
            src={settings.hero_image}
            alt={settings.brand_name}
            loading="eager"
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-[#0F172A]/65" />
        </div>

        <div className="relative mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-center">
            {/* Hero Left Column */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {settings.hero_badge && settings.hero_badge.trim() && (
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/15 px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
                  <Sparkles className="h-4 w-4" />
                  <span>{settings.hero_badge}</span>
                </div>
              )}

              <h1 className="font-display text-3xl sm:text-5xl lg:text-[54px] font-extrabold leading-[1.15] tracking-tight text-white">
                {settings.hero_title}
              </h1>

              {settings.hero_subtitle && settings.hero_subtitle.trim() && (
                <p className="max-w-3xl text-base sm:text-lg lg:text-xl leading-relaxed text-slate-200 font-normal">
                  {settings.hero_subtitle}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#danh-sach-lo-dat"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-amber-500 px-7 py-4 text-base font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
                >
                  <span>Xem Danh Sách Lô Đất ({plots.length})</span>
                  <span>↘</span>
                </a>

                <a
                  href={formatZaloLink(settings.zalo_phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-[#0068FF] px-7 py-4 text-base font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:bg-[#0055D4]"
                >
                  <MessageCircle className="h-5 w-5 fill-current" />
                  <span>Nhắn Tin Zalo Ngay</span>
                </a>
              </div>

              {hasStats && (
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/15 max-w-2xl">
                  {settings.stat_1_value?.trim() && (
                    <div>
                      <div className="font-tech text-2xl sm:text-4xl font-extrabold text-amber-400">
                        {settings.stat_1_value}
                      </div>
                      {settings.stat_1_label?.trim() && (
                        <div className="mt-1 text-xs sm:text-sm text-slate-300 font-medium">
                          {settings.stat_1_label}
                        </div>
                      )}
                    </div>
                  )}
                  {settings.stat_2_value?.trim() && (
                    <div>
                      <div className="font-tech text-2xl sm:text-4xl font-extrabold text-amber-400">
                        {settings.stat_2_value}
                      </div>
                      {settings.stat_2_label?.trim() && (
                        <div className="mt-1 text-xs sm:text-sm text-slate-300 font-medium">
                          {settings.stat_2_label}
                        </div>
                      )}
                    </div>
                  )}
                  {settings.stat_3_value?.trim() && (
                    <div>
                      <div className="font-tech text-2xl sm:text-4xl font-extrabold text-amber-400">
                        {settings.stat_3_value}
                      </div>
                      {settings.stat_3_label?.trim() && (
                        <div className="mt-1 text-xs sm:text-sm text-slate-300 font-medium">
                          {settings.stat_3_label}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hero Right Column: Broker Card */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="rounded-3xl border border-white/15 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={settings.broker_avatar}
                      alt={settings.broker_name}
                      className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border-2 border-amber-400 shadow-lg"
                    />
                    <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-slate-900">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    {settings.broker_role_badge && settings.broker_role_badge.trim() && (
                      <div className="inline-flex items-center gap-1 rounded-md bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                        {settings.broker_role_badge}
                      </div>
                    )}
                    <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-white">
                      {settings.broker_name}
                    </h2>
                    {settings.broker_title && settings.broker_title.trim() && (
                      <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                        {settings.broker_title}
                      </p>
                    )}
                  </div>
                </div>

                {settings.broker_bio && settings.broker_bio.trim() && (
                  <p className="text-sm sm:text-base leading-relaxed text-slate-200 border-l-3 border-amber-400 pl-4">
                    {settings.broker_bio}
                  </p>
                )}

                <div className="rounded-2xl bg-slate-950/80 p-4 space-y-3 border border-white/10 text-xs sm:text-sm">
                  {settings.broker_info_1_label?.trim() &&
                    settings.broker_info_1_value?.trim() && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">{settings.broker_info_1_label}</span>
                        <span className="font-bold text-emerald-400 text-right">
                          {settings.broker_info_1_value}
                        </span>
                      </div>
                    )}

                  {settings.broker_info_2_label?.trim() &&
                    settings.broker_info_2_value?.trim() && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">{settings.broker_info_2_label}</span>
                        <span className="font-bold text-white text-right">
                          {settings.broker_info_2_value}
                        </span>
                      </div>
                    )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Số điện thoại / Zalo:</span>
                    <span className="font-tech font-bold text-amber-400 text-base">
                      {settings.zalo_phone}
                    </span>
                  </div>

                  {settings.office_address?.trim() && (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                      <span className="text-slate-400">Khu vực / Địa chỉ:</span>
                      <span className="font-semibold text-white text-right">
                        {settings.office_address}
                      </span>
                    </div>
                  )}
                </div>

                <a
                  href={formatZaloLink(settings.zalo_phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#0068FF] hover:bg-[#0055D4] py-4 px-5 text-base font-extrabold text-white shadow-lg transition"
                >
                  <MessageCircle className="h-5 w-5 fill-current" />
                  <span>Liên Hệ Zalo Với {settings.broker_name}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Plots Showcase Section */}
      <section
        id="danh-sach-lo-dat"
        className="mx-auto max-w-[1720px] w-full px-4 sm:px-6 lg:px-10 py-14 sm:py-20 space-y-8 flex-1"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            {settings.plots_section_badge && settings.plots_section_badge.trim() && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-blue-800">
                <span>{settings.plots_section_badge}</span>
              </div>
            )}
            <h2 className="mt-2 font-display text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {settings.plots_section_title || 'Danh Sách Các Lô Đất Đang Giới Thiệu'}
            </h2>
            {settings.plots_section_subtitle && settings.plots_section_subtitle.trim() && (
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
                {settings.plots_section_subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Dạng Thẻ Lớn</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="h-4 w-4" />
              <span>Bảng Tổng Hợp</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {['Tất cả', ...LAND_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-12 pt-4 border-t border-slate-100">
            <div className="lg:col-span-5 relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã lô (VD: LK-01), tên lô đất, khu vực..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="lg:col-span-2 relative">
              <Filter className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Lọc theo trạng thái"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-10 pr-3 py-3 text-sm font-semibold text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="available">Đang mở bán</option>
                <option value="reserved">Đã nhận cọc</option>
                <option value="sold">Đã bán</option>
              </select>
            </div>

            <div className="lg:col-span-2 relative">
              <Compass className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedDirection}
                onChange={(e) => setSelectedDirection(e.target.value)}
                aria-label="Lọc theo hướng đất"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-10 pr-3 py-3 text-sm font-semibold text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả hướng</option>
                {availableDirections.map((d) => (
                  <option key={d} value={d}>
                    Hướng: {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3 relative">
              <ArrowUpDown className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Sắp xếp lô đất"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-10 pr-3 py-3 text-sm font-semibold text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="featured">Sắp xếp: Lô Nổi Bật & Mới Nhất</option>
                <option value="price_asc">Giá: Từ Thấp Đến Cao</option>
                <option value="price_desc">Giá: Từ Cao Đến Thấp</option>
                <option value="area_desc">Diện Tích: Lớn Nhất Trước</option>
              </select>
            </div>
          </div>
        </div>

        {/* Plots Display */}
        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[480px] rounded-3xl bg-white border border-slate-200 p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="h-60 rounded-2xl bg-slate-200" />
                <div className="space-y-3">
                  <div className="h-5 w-2/3 rounded bg-slate-200" />
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="h-12 w-full rounded-xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPlots.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center space-y-4">
            <p className="font-display text-2xl font-bold text-slate-800">
              Không tìm thấy lô đất nào khớp với bộ lọc hiện tại
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Tất cả');
                setSelectedStatus('all');
                setSelectedDirection('all');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 cursor-pointer"
            >
              Xem lại toàn bộ lô đất
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlots.map((plot, index) => {
              const totalMedia = (plot.images?.length || 0) + (plot.videos?.length || 0);
              const hasPrice = Boolean(plot.price_display && plot.price_display.trim());
              const hasPricePerM2 = Boolean(plot.price_per_m2 && plot.price_per_m2.trim());

              const cardSpecs = [
                plot.area_m2 && plot.area_m2 > 0
                  ? {
                      icon: <Maximize2 className="h-4 w-4 text-blue-600 flex-shrink-0" />,
                      label: 'Diện tích',
                      value: `${plot.area_m2} m²`,
                    }
                  : null,
                plot.dimensions && plot.dimensions.trim()
                  ? {
                      icon: <Ruler className="h-4 w-4 text-blue-600 flex-shrink-0" />,
                      label: 'Kích thước',
                      value: plot.dimensions.trim(),
                    }
                  : null,
                plot.direction && plot.direction.trim()
                  ? {
                      icon: <Compass className="h-4 w-4 text-blue-600 flex-shrink-0" />,
                      label: 'Hướng',
                      value: plot.direction.trim(),
                    }
                  : null,
                plot.road_width && plot.road_width.trim()
                  ? {
                      icon: <Route className="h-4 w-4 text-blue-600 flex-shrink-0" />,
                      label: 'Đường trước đất',
                      value: plot.road_width.trim(),
                    }
                  : null,
                plot.legal_status && plot.legal_status.trim()
                  ? {
                      icon: <FileCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />,
                      label: 'Pháp lý',
                      value: plot.legal_status.trim(),
                    }
                  : null,
              ].filter((item): item is NonNullable<typeof item> => item !== null);

              return (
                <article
                  key={plot.id}
                  onClick={() => setActivePlot(plot)}
                  className="group rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-blue-500/40 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                      <img
                        src={
                          plot.images?.[0] ||
                          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80'
                        }
                        alt={plot.title}
                        loading={index < 3 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-tech rounded-xl bg-slate-950/90 px-3 py-1 text-xs font-bold text-amber-400 backdrop-blur-xs border border-amber-400/30">
                            {plot.code}
                          </span>
                          {renderStatusPill(plot.status)}
                        </div>

                        {plot.is_featured && (
                          <span className="inline-flex items-center gap-1 rounded-xl bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold uppercase text-slate-950 shadow-xs">
                            <Star className="h-3 w-3 fill-current" />
                            Lô Nổi Bật
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-2 text-white">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-slate-300 block font-semibold">
                            Giá bán
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="font-tech text-2xl sm:text-3xl font-extrabold text-amber-400">
                              {hasPrice ? plot.price_display : 'Liên hệ để trao đổi'}
                            </span>
                            {hasPrice && hasPricePerM2 && (
                              <span className="font-tech text-xs text-slate-200">
                                ({plot.price_per_m2})
                              </span>
                            )}
                          </div>
                        </div>

                        {totalMedia > 0 && (
                          <div className="flex items-center gap-1.5 rounded-xl bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xs">
                            <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                            <span>Hình ảnh / Video ({totalMedia})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      {(plot.location_name || plot.province) && (
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-700">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {[plot.location_name, plot.province].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}

                      <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 line-clamp-2 group-hover:text-blue-700 transition leading-snug">
                        {plot.title}
                      </h3>

                      {cardSpecs.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-xs sm:text-sm">
                          {cardSpecs.slice(0, 4).map((spec, idx) => (
                            <div key={idx} className="flex items-center gap-2 min-w-0">
                              {spec.icon}
                              <div className="min-w-0">
                                <span className="text-slate-500 block text-[11px]">
                                  {spec.label}
                                </span>
                                <span className="font-tech font-bold text-slate-900 truncate block">
                                  {spec.value}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-1 grid grid-cols-12 gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePlot(plot);
                      }}
                      className="col-span-5 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-300 bg-white px-3 py-3.5 text-xs sm:text-sm font-bold text-slate-800 transition hover:bg-slate-900 hover:text-white cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Xem Chi Tiết</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDirectZaloPlot(e, plot)}
                      className="col-span-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0068FF] hover:bg-[#0055D4] px-4 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-blue-600/20 transition cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4 fill-current" />
                      <span>Liên Hệ Ngay</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Table View (No horizontal scroll on desktop) */
          <div
            tabIndex={0}
            role="region"
            aria-label="Bảng tổng hợp danh sách lô đất"
            className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            <table className="w-full lg:table-fixed text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-900 text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                  <th className="py-4 px-5 lg:w-[110px]">Mã Lô</th>
                  <th className="py-4 px-5 lg:w-[32%]">Tên Lô Đất & Khu Vực</th>
                  <th className="py-4 px-5 lg:w-[15%]">Diện Tích / Kích Thước</th>
                  <th className="py-4 px-5 lg:w-[10%]">Hướng</th>
                  <th className="py-4 px-5 lg:w-[15%]">Giá Bán</th>
                  <th className="py-4 px-5 lg:w-[140px]">Trạng Thái</th>
                  <th className="py-4 px-5 lg:w-[150px] text-right">Liên Hệ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm sm:text-base">
                {filteredPlots.map((plot) => {
                  const hasPrice = Boolean(plot.price_display && plot.price_display.trim());
                  return (
                    <tr
                      key={plot.id}
                      onClick={() => setActivePlot(plot)}
                      className="hover:bg-blue-50/40 transition cursor-pointer"
                    >
                      <td className="py-4 px-5 font-tech font-bold text-slate-900">
                        {plot.code}
                      </td>
                      <td className="py-4 px-5 break-words">
                        <div className="font-bold text-slate-900">{plot.title}</div>
                        {(plot.location_name || plot.province) && (
                          <div className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            {[plot.location_name, plot.province].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 font-tech text-slate-800 break-words">
                        {plot.area_m2 && plot.area_m2 > 0 ? (
                          <strong>{plot.area_m2} m²</strong>
                        ) : (
                          <span>—</span>
                        )}
                        {plot.dimensions && plot.dimensions.trim() && (
                          <span className="block text-xs text-slate-500">
                            {plot.dimensions}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-slate-700 font-medium break-words">
                        {plot.direction && plot.direction.trim() ? plot.direction : '—'}
                      </td>
                      <td className="py-4 px-5 font-tech font-extrabold text-blue-700 break-words">
                        {hasPrice ? plot.price_display : 'Liên hệ để trao đổi'}
                        {hasPrice && plot.price_per_m2?.trim() && (
                          <span className="block text-xs font-normal text-slate-500">
                            {plot.price_per_m2}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5">{renderStatusPill(plot.status)}</td>
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={(e) => handleDirectZaloPlot(e, plot)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0068FF] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#0055D4] cursor-pointer"
                        >
                          <MessageCircle className="h-3.5 w-3.5 fill-current" />
                          Liên Hệ Ngay
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Optional 4-Step Process Section */}
      {hasProcessSteps && (
        <section id="quy-trinh" className="bg-[#0F172A] text-white py-16 sm:py-20">
          <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-10 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              {settings.process_badge && settings.process_badge.trim() && (
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  {settings.process_badge}
                </span>
              )}
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold">
                {settings.process_title}
              </h2>
              {settings.process_subtitle && settings.process_subtitle.trim() && (
                <p className="text-slate-300 text-sm sm:text-base">
                  {settings.process_subtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { step: '01', title: settings.step_1_title, desc: settings.step_1_desc },
                { step: '02', title: settings.step_2_title, desc: settings.step_2_desc },
                { step: '03', title: settings.step_3_title, desc: settings.step_3_desc },
                { step: '04', title: settings.step_4_title, desc: settings.step_4_desc },
              ]
                .filter((item) => item.title && item.title.trim())
                .map((item) => (
                  <div
                    key={item.step}
                    className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3 hover:border-amber-400/50 transition"
                  >
                    <span className="font-tech text-3xl font-extrabold text-amber-400 block">
                      {item.step}
                    </span>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                      {item.title}
                    </h3>
                    {item.desc && item.desc.trim() && (
                      <p className="text-sm text-slate-300 leading-relaxed">{item.desc}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Optional Bottom Contact CTA Banner */}
      {settings.show_cta_section && (
        <section
          id="lien-he"
          className="mx-auto max-w-[1720px] w-full px-4 sm:px-6 lg:px-10 py-14 sm:py-16"
        >
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-lg grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-8 space-y-4">
              {settings.cta_badge && settings.cta_badge.trim() && (
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{settings.cta_badge}</span>
                </div>
              )}
              {settings.cta_title && settings.cta_title.trim() && (
                <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-900">
                  {settings.cta_title}
                </h2>
              )}
              {settings.cta_description && settings.cta_description.trim() && (
                <p className="text-slate-600 text-sm sm:text-lg leading-relaxed max-w-2xl">
                  {settings.cta_description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href={formatZaloLink(settings.zalo_phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-[#0068FF] px-7 py-4 text-base font-extrabold text-white shadow-md hover:bg-[#0055D4] transition"
                >
                  <MessageCircle className="h-5 w-5 fill-current" />
                  <span>Nhắn Tin Zalo ({settings.zalo_phone})</span>
                </a>
                {settings.hotline?.trim() && (
                  <a
                    href={`tel:${settings.hotline.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-slate-50 px-6 py-4 text-base font-bold text-slate-800 hover:bg-slate-900 hover:text-white transition"
                  >
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span>Gọi Điện: {settings.hotline}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <img
                src={settings.broker_avatar}
                alt={settings.broker_name}
                className="h-24 w-24 rounded-full object-cover border-3 border-blue-600 mb-3"
              />
              <h3 className="font-display text-xl font-extrabold text-slate-900">
                {settings.broker_name}
              </h3>
              {settings.broker_title?.trim() && (
                <p className="text-xs sm:text-sm text-slate-500 mb-3">
                  {settings.broker_title}
                </p>
              )}
              <div className="w-full pt-3 border-t border-slate-200 text-xs sm:text-sm text-slate-600 space-y-1">
                <div>
                  Zalo / SĐT: <strong className="text-slate-900">{settings.zalo_phone}</strong>
                </div>
                {settings.office_address?.trim() && (
                  <div>Địa chỉ: {settings.office_address}</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Comprehensive Legal Business Footer */}
      <footer className="bg-[#0F172A] text-slate-300 border-t border-slate-800 mt-auto">
        <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-10 py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
            {/* Column 1: Business Brand, Representative & Tax/License Info */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-amber-400 shadow-md">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-display text-xl font-extrabold text-white">
                    {settings.footer_company_name?.trim() || settings.brand_name}
                  </div>
                  {settings.brand_subtitle?.trim() && (
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      {settings.brand_subtitle}
                    </div>
                  )}
                </div>
              </div>

              {(settings.footer_about?.trim() || settings.brand_tagline?.trim()) && (
                <p className="text-sm text-slate-300 leading-relaxed">
                  {settings.footer_about?.trim() || settings.brand_tagline}
                </p>
              )}

              <div className="space-y-2 pt-1 text-xs sm:text-sm text-slate-300">
                {settings.footer_representative?.trim() && (
                  <div className="flex items-start gap-2">
                    <UserCheck className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Người đại diện / Phụ trách:{' '}
                      <strong className="text-white">{settings.footer_representative}</strong>
                    </span>
                  </div>
                )}

                {settings.footer_tax_code?.trim() && (
                  <div className="flex items-start gap-2">
                    <FileCheck className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Mã số thuế / GPKD:{' '}
                      <strong className="text-white">{settings.footer_tax_code}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Official Contact & Office Info */}
            <div className="lg:col-span-4 space-y-4">
              <h3 className="font-display text-base font-extrabold uppercase tracking-wider text-white">
                Thông Tin Liên Hệ Chính Thức
              </h3>

              <ul className="space-y-3 text-sm text-slate-300">
                {settings.office_address?.trim() && (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-amber-400 flex-shrink-0 mt-1" />
                    <span>
                      Địa chỉ: <strong className="text-white">{settings.office_address}</strong>
                    </span>
                  </li>
                )}

                {settings.hotline?.trim() && (
                  <li className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>
                      Điện thoại / Hotline:{' '}
                      <a
                        href={`tel:${settings.hotline.replace(/\D/g, '')}`}
                        className="font-tech font-bold text-amber-400 hover:underline"
                      >
                        {settings.hotline}
                      </a>
                    </span>
                  </li>
                )}

                {settings.zalo_phone?.trim() && (
                  <li className="flex items-center gap-2.5">
                    <MessageCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>
                      Zalo trực tuyến:{' '}
                      <a
                        href={formatZaloLink(settings.zalo_phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-tech font-bold text-white hover:text-amber-400 hover:underline"
                      >
                        {settings.zalo_phone}
                      </a>
                    </span>
                  </li>
                )}

                {settings.email?.trim() && (
                  <li className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>
                      Email:{' '}
                      <a
                        href={`mailto:${settings.email}`}
                        className="text-white hover:text-amber-400 hover:underline"
                      >
                        {settings.email}
                      </a>
                    </span>
                  </li>
                )}

                {settings.footer_working_hours?.trim() && (
                  <li className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>
                      Giờ làm việc:{' '}
                      <strong className="text-white">{settings.footer_working_hours}</strong>
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 3: Legal Notice & Quick Links */}
            <div className="lg:col-span-4 space-y-4">
              <h3 className="font-display text-base font-extrabold uppercase tracking-wider text-white">
                {settings.footer_legal_title?.trim() || 'Thông Tin Pháp Lý & Quy Định'}
              </h3>

              {settings.footer_legal_notice?.trim() && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {settings.footer_legal_notice}
                </p>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-bold">
                <a
                  href="#danh-sach-lo-dat"
                  className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-slate-200 hover:border-amber-400 hover:text-white transition"
                >
                  Danh sách lô đất ({plots.length})
                </a>
                <a
                  href={formatZaloLink(settings.zalo_phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-[#0068FF] px-3.5 py-2 text-white hover:bg-[#0055D4] transition"
                >
                  Kết nối Zalo trực tiếp
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="mt-10 pt-6 border-t border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>
              {settings.footer_copyright && settings.footer_copyright.trim()
                ? settings.footer_copyright
                : `© ${new Date().getFullYear()} ${
                    settings.footer_company_name?.trim() || settings.brand_name
                  }. Bảo lưu mọi quyền.`}
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition">
                Lên đầu trang ↑
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Direct Zalo Button */}
      <a
        href={formatZaloLink(settings.zalo_phone)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Liên hệ ngay qua Zalo"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-[#0068FF] pl-4 pr-5 py-3.5 text-white shadow-2xl shadow-blue-600/40 ring-4 ring-white transition hover:scale-105"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <MessageCircle className="h-5 w-5 fill-current" />
        <span className="text-xs sm:text-sm font-extrabold tracking-wide">
          Chat Zalo: {settings.zalo_phone}
        </span>
      </a>

      {/* Plot Detail Modal */}
      <PlotDetailModal
        plot={activePlot}
        settings={settings}
        onClose={() => setActivePlot(null)}
      />
    </div>
  );
};
