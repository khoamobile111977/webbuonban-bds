import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Compass,
  Eye,
  FileCheck2,
  Filter,
  Image as ImageIcon,
  LayoutGrid,
  ListFilter,
  MapPin,
  Maximize2,
  MessageCircle,
  PhoneCall,
  Route,
  Ruler,
  Search,
  Sparkles,
  Table as TableIcon,
} from 'lucide-react';
import { LAND_CATEGORIES, LandPlot, SiteSettings } from './types';
import { buildZaloUrl } from './supabase';
import { PlotDetailModal } from './PlotDetailModal';

interface HomePageProps {
  settings: SiteSettings;
  plots: LandPlot[];
  loading: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ settings, plots, loading }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDirection, setSelectedDirection] = useState<string>('Tất cả');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activePlot, setActivePlot] = useState<LandPlot | null>(null);

  const zaloUrl = buildZaloUrl(settings.zalo_phone);

  const availableDirections = useMemo(() => {
    const dirs = new Set<string>();
    plots.forEach((p) => {
      if (p.direction && p.direction.trim()) dirs.add(p.direction.trim());
    });
    return ['Tất cả', ...Array.from(dirs)];
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
        if (selectedDirection !== 'Tất cả' && plot.direction !== selectedDirection) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchCode = (plot.code || '').toLowerCase().includes(q);
          const matchTitle = (plot.title || '').toLowerCase().includes(q);
          const matchLoc = (plot.location_name || '').toLowerCase().includes(q);
          const matchProv = (plot.province || '').toLowerCase().includes(q);
          if (!matchCode && !matchTitle && !matchLoc && !matchProv) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return (a.price_billion || 0) - (b.price_billion || 0);
        if (sortBy === 'price-desc') return (b.price_billion || 0) - (a.price_billion || 0);
        if (sortBy === 'area-desc') return (b.area_m2 || 0) - (a.area_m2 || 0);
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return 0;
      });
  }, [plots, selectedCategory, selectedStatus, selectedDirection, sortBy, searchQuery]);

  const handleDirectZaloContact = (e?: React.MouseEvent<HTMLElement>) => {
    if (e) e.stopPropagation();
    window.open(zaloUrl, '_blank', 'noopener,noreferrer');
  };

  const renderStatusBadge = (status: LandPlot['status']) => {
    if (status === 'reserved') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-xs">
          <span className="h-2 w-2 rounded-full bg-white" />
          Đã Nhận Cọc
        </span>
      );
    }
    if (status === 'sold') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1 text-xs font-bold text-white shadow-xs">
          Đã Bán
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
        Đang Mở Bán
      </span>
    );
  };

  // Only show stats that have a non-empty value
  const activeStats = [
    { value: settings.stat_1_value?.trim(), label: settings.stat_1_label?.trim() },
    { value: settings.stat_2_value?.trim(), label: settings.stat_2_label?.trim() },
    { value: settings.stat_3_value?.trim(), label: settings.stat_3_label?.trim() },
  ].filter((s) => Boolean(s.value));

  // Process steps if process section is enabled
  const processSteps = [
    { step: '01', title: settings.step_1_title?.trim(), desc: settings.step_1_desc?.trim() },
    { step: '02', title: settings.step_2_title?.trim(), desc: settings.step_2_desc?.trim() },
    { step: '03', title: settings.step_3_title?.trim(), desc: settings.step_3_desc?.trim() },
    { step: '04', title: settings.step_4_title?.trim(), desc: settings.step_4_desc?.trim() },
  ].filter((s) => Boolean(s.title || s.desc));

  const hasTopBar = Boolean(
    settings.brand_tagline?.trim() || settings.office_address?.trim()
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9] text-slate-900">
      {/* Top Announcement Bar (Only rendered if tagline or address is provided) */}
      {hasTopBar && (
        <div className="bg-[#0B1120] text-slate-300 text-xs sm:text-sm py-2.5 px-4 border-b border-white/10">
          <div className="mx-auto max-w-[1440px] sm:px-4 lg:px-8 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium text-white">
              {settings.brand_tagline?.trim() && <span>{settings.brand_tagline}</span>}
            </div>
            <div className="flex items-center gap-6 text-xs sm:text-sm">
              {settings.office_address?.trim() && (
                <span className="hidden md:inline text-slate-300">
                  Địa chỉ: <strong className="text-white">{settings.office_address}</strong>
                </span>
              )}
              <a
                href={zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline font-bold flex items-center gap-1"
              >
                Zalo: {settings.zalo_phone}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 h-20 sm:h-22 flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-3.5 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-md shadow-blue-600/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 block leading-tight">
                {settings.brand_name}
              </span>
              {settings.brand_subtitle?.trim() && (
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mt-0.5 block">
                  {settings.brand_subtitle}
                </span>
              )}
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-8 text-base font-bold text-slate-700">
            <a href="#danh-sach-lo-dat" className="hover:text-blue-600 transition">
              Danh Sách Lô Đất ({plots.length})
            </a>
            {settings.show_process_section && (
              <a href="#quy-trinh" className="hover:text-blue-600 transition">
                {settings.process_title || 'Quy Trình'}
              </a>
            )}
            {settings.show_cta_section && (
              <a href="#lien-he" className="hover:text-blue-600 transition">
                Liên Hệ {settings.broker_name}
              </a>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {settings.hotline?.trim() && (
              <a
                href={`tel:${settings.zalo_phone}`}
                className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
              >
                <PhoneCall className="h-4 w-4 text-blue-600" />
                <span className="font-tech">{settings.hotline}</span>
              </a>
            )}
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0068FF] px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-blue-600/25 transition hover:bg-[#0054D1]"
            >
              <MessageCircle className="h-4 w-4 fill-current" />
              <span>Liên Hệ Zalo</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#0F172A] text-white py-12 sm:py-16 lg:py-20 border-b border-slate-800">
        {/* Background LCP Hero Image optimized per modern-web-guidance optimize-image-priority */}
        {settings.hero_image && (
          <div className="absolute inset-0 opacity-30">
            <img
              src={settings.hero_image}
              alt={settings.brand_name}
              fetchPriority="high"
              width={1920}
              height={1080}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120] via-[#0F172A]/90 to-[#0F172A]/70" />
          </div>
        )}

        <div className="relative mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6">
              {settings.hero_badge?.trim() && (
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/15 px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
                  <Sparkles className="h-4 w-4" />
                  <span>{settings.hero_badge}</span>
                </div>
              )}

              <h1 className="font-display text-3xl sm:text-5xl lg:text-[54px] font-extrabold leading-[1.16] tracking-tight text-white">
                {settings.hero_title}
              </h1>

              {settings.hero_subtitle?.trim() && (
                <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-slate-300 whitespace-pre-line">
                  {settings.hero_subtitle}
                </p>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#danh-sach-lo-dat"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-amber-500 px-7 py-4 text-base font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-400"
                >
                  <span>Xem Danh Sách Lô Đất ({plots.length})</span>
                  <ArrowUpRight className="h-5 w-5" />
                </a>
                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-[#0068FF] px-7 py-4 text-base font-extrabold text-white shadow-lg shadow-blue-600/30 transition hover:bg-[#0055D4]"
                >
                  <MessageCircle className="h-5 w-5 fill-current" />
                  <span>Nhắn Tin Zalo Ngay</span>
                </a>
              </div>

              {/* Optional Stats Bar (Only rendered if at least 1 stat has a value) */}
              {activeStats.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-white/15">
                  {activeStats.map((st, idx) => (
                    <div key={idx}>
                      <div className="font-tech text-2xl sm:text-3xl font-extrabold text-amber-400">
                        {st.value}
                      </div>
                      {st.label && (
                        <div className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                          {st.label}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hero Right: Broker Personal Card (100% Editable, No Hardcoded Claims) */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-white/15 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
                <div className="flex items-center gap-4">
                  {settings.broker_avatar && (
                    <div className="relative flex-shrink-0">
                      <img
                        src={settings.broker_avatar}
                        alt={settings.broker_name}
                        width={88}
                        height={88}
                        className="h-20 w-20 sm:h-22 sm:w-22 rounded-2xl object-cover border-2 border-amber-400"
                      />
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow">
                        <BadgeCheck className="h-4 w-4" />
                      </span>
                    </div>
                  )}
                  <div>
                    {settings.broker_role_badge?.trim() && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                        {settings.broker_role_badge}
                      </span>
                    )}
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                      {settings.broker_name}
                    </h2>
                    {settings.broker_title?.trim() && (
                      <p className="text-sm text-slate-300 mt-0.5">{settings.broker_title}</p>
                    )}
                  </div>
                </div>

                {settings.broker_bio?.trim() && (
                  <p className="text-sm sm:text-base leading-relaxed text-slate-200 border-l-3 border-amber-400 pl-4 whitespace-pre-line">
                    {settings.broker_bio}
                  </p>
                )}

                <div className="rounded-2xl bg-slate-950/80 p-4 border border-white/10 space-y-3 text-sm">
                  {(settings.broker_info_1_label?.trim() ||
                    settings.broker_info_1_value?.trim()) && (
                    <div className="flex items-center justify-between gap-3 text-slate-300">
                      <span>{settings.broker_info_1_label}</span>
                      <span className="font-bold text-emerald-400 text-right">
                        {settings.broker_info_1_value}
                      </span>
                    </div>
                  )}

                  {(settings.broker_info_2_label?.trim() ||
                    settings.broker_info_2_value?.trim()) && (
                    <div className="flex items-center justify-between gap-3 text-slate-300">
                      <span>{settings.broker_info_2_label}</span>
                      <span className="font-bold text-white text-right">
                        {settings.broker_info_2_value}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 text-slate-300">
                    <span>Số điện thoại / Zalo:</span>
                    <span className="font-tech text-base font-extrabold text-amber-400">
                      {settings.hotline || settings.zalo_phone}
                    </span>
                  </div>

                  {settings.office_address?.trim() && (
                    <div className="flex items-center justify-between gap-3 text-slate-300 pt-2 border-t border-white/10">
                      <span>Khu vực / Địa chỉ:</span>
                      <span className="font-semibold text-white text-right">
                        {settings.office_address}
                      </span>
                    </div>
                  )}
                </div>

                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#0068FF] px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-blue-600/30 transition hover:bg-[#0055D4]"
                >
                  <MessageCircle className="h-5 w-5 fill-current" />
                  <span>Liên Hệ Zalo Với {settings.broker_name}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Land Plots Catalog Section */}
      <section
        id="danh-sach-lo-dat"
        className="py-12 sm:py-16 mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 w-full"
      >
        {/* Section Heading */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            {settings.plots_section_badge?.trim() && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-blue-600/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-blue-700 mb-2">
                <span>{settings.plots_section_badge}</span>
              </div>
            )}
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
              {settings.plots_section_title || 'Danh Sách Các Lô Đất Đang Giới Thiệu'}
            </h2>
            {settings.plots_section_subtitle?.trim() && (
              <p className="mt-2 text-base text-slate-600 max-w-3xl">
                {settings.plots_section_subtitle}
              </p>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2 self-start lg:self-auto bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Dạng Thẻ Lớn
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TableIcon className="h-4 w-4" />
              Bảng Tổng Hợp
            </button>
          </div>
        </div>

        {/* Smart Filter & Search Toolbar */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs mb-10 space-y-5">
          {/* Category Pills */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {['Tất cả', ...LAND_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Dropdown Filters */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-5 relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã lô (VD: LK-01), tên lô đất, khu vực..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="lg:col-span-2">
              <div className="relative">
                <Filter className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  aria-label="Lọc theo trạng thái"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3 py-3 text-sm font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="available">Đang mở bán</option>
                  <option value="reserved">Đã nhận cọc</option>
                  <option value="sold">Đã bán</option>
                </select>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="relative">
                <Compass className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedDirection}
                  onChange={(e) => setSelectedDirection(e.target.value)}
                  aria-label="Lọc theo hướng đất"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3 py-3 text-sm font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  {availableDirections.map((dir) => (
                    <option key={dir} value={dir}>
                      {dir === 'Tất cả' ? 'Tất cả hướng' : `Hướng: ${dir}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="relative">
                <ListFilter className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sắp xếp lô đất"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3 py-3 text-sm font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="featured">Sắp xếp: Lô Nổi Bật & Mới Nhất</option>
                  <option value="price-asc">Giá: Từ Thấp Đến Cao</option>
                  <option value="price-desc">Giá: Từ Cao Đến Thấp</option>
                  <option value="area-desc">Diện Tích: Lớn Nhất Trước</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[500px] rounded-3xl border border-slate-200 bg-white p-6 animate-pulse flex flex-col justify-between"
              >
                <div className="h-60 rounded-2xl bg-slate-200" />
                <div className="space-y-3">
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="h-6 w-5/6 rounded bg-slate-200" />
                  <div className="h-16 w-full rounded bg-slate-100" />
                </div>
                <div className="h-12 w-full rounded-xl bg-slate-200" />
              </div>
            ))}
          </div>
        ) : filteredPlots.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center space-y-4 shadow-2xs">
            <p className="font-display text-2xl font-extrabold text-slate-900">
              Không tìm thấy lô đất nào khớp với bộ lọc hiện tại
            </p>
            <p className="text-base text-slate-600">
              Hãy thử đặt lại bộ lọc hoặc liên hệ trực tiếp qua Zalo để được tư vấn.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Tất cả');
                setSelectedStatus('all');
                setSelectedDirection('Tất cả');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white cursor-pointer hover:bg-blue-700"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Wide Business Grid Cards View */
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlots.map((plot) => {
              const coverImg =
                plot.images && plot.images.length > 0
                  ? plot.images[0]
                  : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';
              const totalMediaCount =
                (plot.images?.filter(Boolean).length || 0) +
                (plot.videos?.filter(Boolean).length || 0);
              const displayPrice = plot.price_display?.trim() || 'Liên hệ để trao đổi';
              const displayPricePerM2 = plot.price_per_m2?.trim() || '';

              // Only collect non-empty technical specs for this plot card
              const cardSpecs: Array<{
                key: string;
                label: string;
                value: string;
                icon: React.ReactNode;
              }> = [];

              if (plot.area_m2 && plot.area_m2 > 0) {
                cardSpecs.push({
                  key: 'area',
                  label: 'Diện tích',
                  value: `${plot.area_m2} m²`,
                  icon: <Maximize2 className="h-4 w-4 text-blue-600 flex-shrink-0" />,
                });
              }
              if (plot.dimensions && plot.dimensions.trim()) {
                cardSpecs.push({
                  key: 'dimensions',
                  label: 'Kích thước',
                  value: plot.dimensions.trim(),
                  icon: <Ruler className="h-4 w-4 text-blue-600 flex-shrink-0" />,
                });
              }
              if (plot.direction && plot.direction.trim()) {
                cardSpecs.push({
                  key: 'direction',
                  label: 'Hướng',
                  value: plot.direction.trim(),
                  icon: <Compass className="h-4 w-4 text-blue-600 flex-shrink-0" />,
                });
              }
              if (plot.road_width && plot.road_width.trim()) {
                cardSpecs.push({
                  key: 'road',
                  label: 'Đường trước đất',
                  value: plot.road_width.trim(),
                  icon: <Route className="h-4 w-4 text-blue-600 flex-shrink-0" />,
                });
              }

              return (
                <article
                  key={plot.id}
                  onClick={() => setActivePlot(plot)}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-blue-500/60 cursor-pointer"
                >
                  {/* Card Image Header */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                    {/* Standard below-the-fold lazy loading per optimize-image-priority */}
                    <img
                      src={coverImg}
                      alt={plot.title}
                      loading="lazy"
                      width={640}
                      height={400}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                    {/* Top Left Badges */}
                    <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                      <span className="font-tech rounded-lg bg-slate-900/90 px-3 py-1 text-xs font-extrabold text-amber-400 backdrop-blur-xs border border-amber-400/30">
                        {plot.code}
                      </span>
                      {renderStatusBadge(plot.status)}
                    </div>

                    {/* Top Right Featured Badge */}
                    {plot.is_featured && (
                      <div className="absolute top-4 right-4 rounded-lg bg-amber-400 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-slate-950 shadow-md">
                        Lô Nổi Bật
                      </div>
                    )}

                    {/* Bottom Image Overlay: Price & Unified Media Count */}
                    <div className="absolute bottom-4 inset-x-5 flex items-end justify-between gap-2 text-white">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                          Giá bán
                        </span>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-tech text-2xl sm:text-[26px] font-extrabold text-amber-400">
                            {displayPrice}
                          </span>
                          {displayPricePerM2 && (
                            <span className="font-tech text-xs font-semibold text-slate-200">
                              ({displayPricePerM2})
                            </span>
                          )}
                        </div>
                      </div>

                      {totalMediaCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-black/65 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-xs">
                          <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                          <span>Hình ảnh / Video ({totalMediaCount})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="flex flex-1 flex-col justify-between p-6 space-y-5">
                    <div className="space-y-4">
                      {(plot.location_name || plot.province) && (
                        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                          <span className="inline-flex items-center gap-1.5 font-bold text-blue-700 truncate">
                            <MapPin className="h-4 w-4 flex-shrink-0 text-blue-600" />
                            <span className="truncate">
                              {plot.location_name}
                              {plot.province ? `, ${plot.province}` : ''}
                            </span>
                          </span>
                        </div>
                      )}

                      <h3 className="font-display text-xl sm:text-[22px] font-extrabold leading-snug text-slate-900 group-hover:text-blue-600 transition line-clamp-2">
                        {plot.title}
                      </h3>

                      {/* Dynamic Key Technical Metrics (Only non-empty fields are shown) */}
                      {cardSpecs.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-xs sm:text-sm">
                          {cardSpecs.map((spec) => (
                            <div key={spec.key} className="flex items-center gap-2.5 min-w-0">
                              {spec.icon}
                              <div className="min-w-0">
                                <span className="text-slate-500 block text-xs font-medium">
                                  {spec.label}
                                </span>
                                <span className="font-bold text-slate-900 truncate block">
                                  {spec.value}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Legal Pill (Only shown if plot.legal_status is non-empty) */}
                      {plot.legal_status && plot.legal_status.trim() && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                          <FileCheck2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">{plot.legal_status}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-12 gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePlot(plot);
                        }}
                        className="col-span-5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-3.5 text-xs sm:text-sm font-bold text-slate-800 transition hover:bg-slate-900 hover:text-white cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Xem Chi Tiết</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDirectZaloContact}
                        className="col-span-7 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-4 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-blue-600/20 transition hover:bg-[#0055D4] cursor-pointer"
                      >
                        <MessageCircle className="h-4 w-4 fill-current" />
                        <span>Liên Hệ Ngay</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-900 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                    <th className="py-4 px-5">Mã Lô</th>
                    <th className="py-4 px-5">Tên Lô Đất & Khu Vực</th>
                    <th className="py-4 px-5">Diện Tích / Kích Thước</th>
                    <th className="py-4 px-5">Hướng & Đường</th>
                    <th className="py-4 px-5">Giá Bán</th>
                    <th className="py-4 px-5">Trạng Thái</th>
                    <th className="py-4 px-5 text-right">Liên Hệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm sm:text-base">
                  {filteredPlots.map((plot) => (
                    <tr
                      key={plot.id}
                      onClick={() => setActivePlot(plot)}
                      className="hover:bg-blue-50/40 transition cursor-pointer"
                    >
                      <td className="py-4 px-5 font-tech font-bold text-slate-900 whitespace-nowrap">
                        {plot.code}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900">{plot.title}</div>
                        {(plot.location_name || plot.province) && (
                          <div className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            {plot.location_name}
                            {plot.province ? `, ${plot.province}` : ''}
                            {plot.legal_status?.trim() ? ` · ${plot.legal_status}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        {plot.area_m2 > 0 && (
                          <div className="font-tech font-bold text-slate-900">
                            {plot.area_m2} m²
                          </div>
                        )}
                        {plot.dimensions?.trim() && (
                          <div className="font-tech text-xs text-slate-500">
                            {plot.dimensions}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        {plot.direction?.trim() && (
                          <div className="font-semibold text-slate-900">{plot.direction}</div>
                        )}
                        {plot.road_width?.trim() && (
                          <div className="text-xs text-slate-500">{plot.road_width}</div>
                        )}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-tech text-base font-extrabold text-blue-700">
                          {plot.price_display?.trim() || 'Liên hệ để trao đổi'}
                        </div>
                        {plot.price_per_m2?.trim() && (
                          <div className="font-tech text-xs text-slate-500">
                            {plot.price_per_m2}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        {renderStatusBadge(plot.status)}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={handleDirectZaloContact}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0068FF] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#0055D4] cursor-pointer"
                        >
                          <MessageCircle className="h-4 w-4 fill-current" />
                          Liên Hệ Ngay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Optional 4-Step Process Section (Controlled by settings.show_process_section) */}
      {settings.show_process_section && processSteps.length > 0 && (
        <section
          id="quy-trinh"
          className="bg-[#0F172A] text-white py-16 lg:py-20 border-y border-slate-800"
        >
          <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
            <div className="text-center max-w-3xl mx-auto mb-12">
              {settings.process_badge?.trim() && (
                <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-400">
                  {settings.process_badge}
                </span>
              )}
              {settings.process_title?.trim() && (
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold mt-2">
                  {settings.process_title}
                </h2>
              )}
              {settings.process_subtitle?.trim() && (
                <p className="mt-3 text-base text-slate-300">{settings.process_subtitle}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {processSteps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-7 space-y-3 hover:border-amber-400/50 transition"
                >
                  <div className="font-tech text-3xl font-extrabold text-amber-400">
                    {item.step}
                  </div>
                  {item.title && (
                    <h3 className="font-display text-xl font-bold text-white">{item.title}</h3>
                  )}
                  {item.desc && (
                    <p className="text-sm leading-relaxed text-slate-300">{item.desc}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Optional Bottom Contact Section (100% Editable in Admin) */}
      {settings.show_cta_section && (
        <section
          id="lien-he"
          className="py-14 sm:py-18 mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 w-full"
        >
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              {settings.cta_badge?.trim() && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-4 py-1 text-xs sm:text-sm font-bold text-blue-700">
                  <span>{settings.cta_badge}</span>
                </span>
              )}
              {settings.cta_title?.trim() && (
                <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-900">
                  {settings.cta_title}
                </h2>
              )}
              {settings.cta_description?.trim() && (
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed whitespace-pre-line">
                  {settings.cta_description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-[#0068FF] px-7 py-4 text-base font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:bg-[#0055D4]"
                >
                  <MessageCircle className="h-5 w-5 fill-current" />
                  <span>Nhắn Tin Zalo ({settings.zalo_phone})</span>
                </a>
                {settings.hotline?.trim() && (
                  <a
                    href={`tel:${settings.zalo_phone}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-slate-50 px-6 py-4 text-base font-bold text-slate-900 transition hover:bg-slate-900 hover:text-white"
                  >
                    <PhoneCall className="h-5 w-5 text-blue-600" />
                    <span>Gọi Điện: {settings.hotline}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-200">
              {settings.broker_avatar && (
                <img
                  src={settings.broker_avatar}
                  alt={settings.broker_name}
                  loading="lazy"
                  width={112}
                  height={112}
                  className="h-28 w-28 rounded-full object-cover border-4 border-blue-600 shadow-md"
                />
              )}
              <h3 className="font-display text-2xl font-extrabold text-slate-900 mt-3">
                {settings.broker_name}
              </h3>
              {settings.broker_title?.trim() && (
                <p className="text-sm text-slate-600 mt-1">{settings.broker_title}</p>
              )}
              <div className="mt-4 w-full pt-4 border-t border-slate-200 text-sm text-slate-600 space-y-1.5">
                <div>
                  Zalo / SĐT:{' '}
                  <strong className="font-tech text-slate-900">
                    {settings.hotline || settings.zalo_phone}
                  </strong>
                </div>
                {settings.office_address?.trim() && (
                  <div>Địa chỉ: {settings.office_address}</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer (No public admin link to keep /login hidden as requested) */}
      <footer className="mt-auto bg-[#0B1120] text-slate-400 py-10 border-t border-slate-800 text-sm">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-display text-lg font-extrabold text-white block">
              {settings.brand_name}
            </span>
            {settings.brand_tagline?.trim() && (
              <p className="mt-1 text-slate-400">{settings.brand_tagline}</p>
            )}
          </div>
          <div className="text-center sm:text-right space-y-1">
            <p>
              Hotline / Zalo:{' '}
              <strong className="text-amber-400 font-tech">
                {settings.hotline || settings.zalo_phone}
              </strong>
              {settings.email?.trim() ? ` · Email: ${settings.email}` : ''}
            </p>
            <p>
              {settings.footer_copyright?.trim() ||
                `© ${new Date().getFullYear()} ${settings.brand_name}.`}
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Zalo Quick Button */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Liên hệ ngay qua Zalo"
          className="group flex items-center gap-2.5 rounded-full bg-[#0068FF] pl-4 pr-6 py-4 text-sm sm:text-base font-extrabold text-white shadow-2xl shadow-blue-600/40 ring-4 ring-white transition hover:scale-105"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <MessageCircle className="h-5 w-5 fill-current" />
          <span>Chat Zalo: {settings.zalo_phone}</span>
        </a>
      </div>

      {/* Native Light-Dismiss Property Detail Modal */}
      <PlotDetailModal
        plot={activePlot}
        settings={settings}
        onClose={() => setActivePlot(null)}
      />
    </div>
  );
};
