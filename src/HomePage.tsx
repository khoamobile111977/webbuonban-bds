import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Compass,
  Eye,
  FileCheck2,
  Film,
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
  ShieldCheck,
  Sparkles,
  Table as TableIcon,
} from 'lucide-react';
import { LAND_CATEGORIES, LandPlot, SiteSettings } from './types';
import { buildZaloUrl, formatZaloMessage } from './supabase';
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
  const [toastText, setToastText] = useState<string | null>(null);

  const zaloUrl = buildZaloUrl(settings.zalo_phone);

  const availableDirections = useMemo(() => {
    const dirs = new Set<string>();
    plots.forEach((p) => {
      if (p.direction) dirs.add(p.direction);
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
          const matchCode = plot.code.toLowerCase().includes(q);
          const matchTitle = plot.title.toLowerCase().includes(q);
          const matchLoc = plot.location_name.toLowerCase().includes(q);
          const matchProv = (plot.province || '').toLowerCase().includes(q);
          if (!matchCode && !matchTitle && !matchLoc && !matchProv) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price_billion - b.price_billion;
        if (sortBy === 'price-desc') return b.price_billion - a.price_billion;
        if (sortBy === 'area-desc') return b.area_m2 - a.area_m2;
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return 0;
      });
  }, [plots, selectedCategory, selectedStatus, selectedDirection, sortBy, searchQuery]);

  const handleDirectZaloContact = async (
    plot: LandPlot,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (e) e.stopPropagation();
    const msg = formatZaloMessage(settings.zalo_greeting_template, plot);
    try {
      await navigator.clipboard.writeText(msg);
      setToastText(
        `Đã sao chép thông tin lô ${plot.code}! Đang chuyển sang Zalo ${settings.zalo_phone}...`
      );
      setTimeout(() => setToastText(null), 4000);
    } catch {
      // Ignore clipboard error
    }
    window.open(zaloUrl, '_blank', 'noopener,noreferrer');
  };

  const renderStatusBadge = (status: LandPlot['status']) => {
    if (status === 'reserved') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/95 px-3 py-1 text-xs font-bold text-white shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          Đã Nhận Cọc
        </span>
      );
    }
    if (status === 'sold') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-700/95 px-3 py-1 text-xs font-bold text-white shadow-sm">
          Đã Bán
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/95 px-3 py-1 text-xs font-bold text-white shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        Đang Mở Bán
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#111916]">
      {/* Toast Notification when copying Zalo message */}
      {toastText && (
        <div className="fixed top-20 right-5 z-50 max-w-md rounded-2xl bg-[#0F1E19] px-5 py-3.5 text-xs font-semibold text-[#E6C770] shadow-2xl border border-[#C59B27]/40 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{toastText}</span>
        </div>
      )}

      {/* Top Prestige Announcement Bar */}
      <div className="bg-[#0B1612] text-[#E5DEC9] text-xs py-2.5 px-4 border-b border-white/10">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4 text-[#C59B27]" />
            <span>{settings.brand_tagline}</span>
          </div>
          <div className="flex items-center gap-5 font-tech text-xs">
            <span className="hidden sm:inline text-stone-400">
              Văn phòng: {settings.office_address}
            </span>
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E6C770] hover:underline font-semibold flex items-center gap-1"
            >
              Zalo Tư Vấn 24/7: {settings.zalo_phone}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-[#E5DEC9] bg-[#FAF8F5]/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-3.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F1E19] text-[#E6C770] shadow-md border border-[#C59B27]/40">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0F1E19] block leading-none">
                {settings.brand_name}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8C7335] mt-1 block">
                Quỹ Đất Sổ Hồng Chính Chủ
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-700">
            <a href="#danh-sach-lo-dat" className="hover:text-[#0F1E19] transition">
              Danh Sách Lô Đất ({plots.length})
            </a>
            <a href="#cam-ket-phap-ly" className="hover:text-[#0F1E19] transition">
              Quy Trình & Pháp Lý
            </a>
            <a href="#chuyen-vien" className="hover:text-[#0F1E19] transition">
              Về {settings.broker_name}
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href={`tel:${settings.zalo_phone}`}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-[#0F1E19]/20 bg-white px-4 py-2.5 text-xs font-bold text-[#0F1E19] transition hover:bg-stone-100"
            >
              <PhoneCall className="h-4 w-4 text-[#C59B27]" />
              <span className="font-tech">{settings.hotline}</span>
            </a>
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0068FF] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#0068FF]/25 transition hover:bg-[#0054D1]"
            >
              <MessageCircle className="h-4 w-4 fill-current" />
              <span>Chat Zalo Ngay</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#0F1E19] text-white py-14 sm:py-20 lg:py-24 border-b border-[#C59B27]/30">
        {/* Background LCP Hero Image optimized per modern-web-guidance optimize-image-priority */}
        <div className="absolute inset-0 opacity-30">
          <img
            src={settings.hero_image}
            alt={settings.brand_name}
            fetchPriority="high"
            width={1920}
            height={1080}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1612] via-[#0F1E19]/90 to-[#0F1E19]/65" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C59B27]/50 bg-[#C59B27]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#E6C770]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{settings.hero_badge}</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.12] tracking-tight text-white">
                {settings.hero_title}
              </h1>

              <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-stone-300">
                {settings.hero_subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#danh-sach-lo-dat"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-[#C59B27] px-7 py-4 text-sm font-bold text-[#0B1612] shadow-lg shadow-[#C59B27]/25 transition hover:bg-[#D5AD36]"
                >
                  <span>Khám Phá Các Lô Đất Đang Bán</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-2xl border border-white/25 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <MessageCircle className="h-4 w-4 text-[#4DA3FF] fill-current" />
                  <span>Nhận Bảng Giá & Sổ Đỏ Qua Zalo</span>
                </a>
              </div>

              {/* Trust Stats Bar */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/15">
                <div>
                  <div className="font-tech text-2xl sm:text-3xl font-bold text-[#E6C770]">
                    {settings.stat_1_value}
                  </div>
                  <div className="text-xs text-stone-300 mt-1">{settings.stat_1_label}</div>
                </div>
                <div>
                  <div className="font-tech text-2xl sm:text-3xl font-bold text-[#E6C770]">
                    {settings.stat_2_value}
                  </div>
                  <div className="text-xs text-stone-300 mt-1">{settings.stat_2_label}</div>
                </div>
                <div>
                  <div className="font-tech text-2xl sm:text-3xl font-bold text-[#E6C770]">
                    {settings.stat_3_value}
                  </div>
                  <div className="text-xs text-stone-300 mt-1">{settings.stat_3_label}</div>
                </div>
              </div>
            </div>

            {/* Hero Right: Broker Personal Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-[#C59B27]/35 bg-white/10 p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={settings.broker_avatar}
                      alt={settings.broker_name}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-2xl object-cover border-2 border-[#E6C770]"
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                      <BadgeCheck className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#E6C770]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#E6C770]">
                      CHUYÊN VIÊN THẨM ĐỊNH QUỸ ĐẤT
                    </span>
                    <h2 className="font-display text-2xl font-bold text-white mt-1">
                      {settings.broker_name}
                    </h2>
                    <p className="text-xs text-stone-300">{settings.broker_title}</p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-stone-200 border-l-2 border-[#E6C770] pl-4 italic">
                  "{settings.broker_bio}"
                </p>

                <div className="rounded-2xl bg-[#0B1612]/80 p-4 border border-white/10 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-stone-300">
                    <span>Cam kết pháp lý:</span>
                    <span className="font-semibold text-emerald-400">
                      Sổ hồng riêng · Bao quy hoạch
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-300">
                    <span>Hỗ trợ khách hàng:</span>
                    <span className="font-semibold text-white">
                      Đưa đón xem đất thực tế miễn phí
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-300">
                    <span>Hotline / Zalo chính chủ:</span>
                    <span className="font-tech font-bold text-[#E6C770]">
                      {settings.hotline}
                    </span>
                  </div>
                </div>

                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#0068FF] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#0068FF]/30 transition hover:bg-[#0055D4]"
                >
                  <MessageCircle className="h-5 w-5 fill-current" />
                  <span>Kết Nối Zalo Với {settings.broker_name}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Land Plots Catalog Section */}
      <section id="danh-sach-lo-dat" className="py-16 lg:py-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8C7335]">
              <Award className="h-4 w-4" />
              <span>Bảng Hàng Chính Chủ Tuyển Chọn</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F1E19] mt-2">
              Danh Sách Các Lô Đất Đang Giới Thiệu
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl">
              Mỗi lô đất đều đã được kiểm tra kỹ quy hoạch, mốc giới thực địa và có sẵn hình ảnh/video thực tế. Nhấn vào từng lô để xem chi tiết hoặc ấn{' '}
              <strong className="text-[#0068FF]">Liên Hệ Ngay</strong> để trao đổi trực tiếp qua Zalo.
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-white p-1.5 rounded-2xl border border-[#E5DEC9] shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#0F1E19] text-[#E6C770]'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Dạng Thẻ Chi Tiết
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#0F1E19] text-[#E6C770]'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <TableIcon className="h-4 w-4" />
              Bảng So Sánh Giá
            </button>
          </div>
        </div>

        {/* Smart Filter & Search Toolbar */}
        <div className="rounded-3xl border border-[#E5DEC9] bg-white p-5 sm:p-6 shadow-sm mb-10 space-y-5">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['Tất cả', ...LAND_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0F1E19] text-[#E6C770] shadow-xs'
                    : 'bg-[#FAF8F5] text-stone-700 border border-[#E5DEC9] hover:bg-[#F2ECE1]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Dropdown Filters */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-5 relative">
              <Search className="h-4 w-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã lô (VD: LK-01), tên khu vực, tỉnh thành..."
                className="w-full rounded-xl border border-[#E5DEC9] bg-[#FAF8F5] pl-11 pr-4 py-2.5 text-sm text-[#111916] placeholder:text-stone-400 focus:border-[#0F1E19] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="lg:col-span-2">
              <div className="relative">
                <Filter className="h-3.5 w-3.5 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  aria-label="Lọc theo trạng thái"
                  className="w-full rounded-xl border border-[#E5DEC9] bg-[#FAF8F5] pl-9 pr-3 py-2.5 text-xs font-semibold text-[#111916] focus:border-[#0F1E19] focus:outline-none"
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
                <Compass className="h-3.5 w-3.5 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedDirection}
                  onChange={(e) => setSelectedDirection(e.target.value)}
                  aria-label="Lọc theo hướng đất"
                  className="w-full rounded-xl border border-[#E5DEC9] bg-[#FAF8F5] pl-9 pr-3 py-2.5 text-xs font-semibold text-[#111916] focus:border-[#0F1E19] focus:outline-none"
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
                <ListFilter className="h-3.5 w-3.5 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sắp xếp lô đất"
                  className="w-full rounded-xl border border-[#E5DEC9] bg-[#FAF8F5] pl-9 pr-3 py-2.5 text-xs font-semibold text-[#111916] focus:border-[#0F1E19] focus:outline-none"
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
                className="h-[480px] rounded-3xl border border-[#E5DEC9] bg-white p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="h-56 rounded-2xl bg-stone-200" />
                <div className="space-y-3">
                  <div className="h-4 w-1/3 rounded bg-stone-200" />
                  <div className="h-6 w-5/6 rounded bg-stone-200" />
                  <div className="h-16 w-full rounded bg-stone-100" />
                </div>
                <div className="h-12 w-full rounded-xl bg-stone-200" />
              </div>
            ))}
          </div>
        ) : filteredPlots.length === 0 ? (
          <div className="rounded-3xl border border-[#E5DEC9] bg-white p-12 text-center space-y-4">
            <p className="font-display text-2xl font-bold text-[#0F1E19]">
              Không tìm thấy lô đất nào khớp với bộ lọc hiện tại
            </p>
            <p className="text-sm text-stone-600">
              Hãy thử xóa từ khóa tìm kiếm hoặc liên hệ trực tiếp Zalo để nhận quỹ đất kín chưa đăng tải.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Tất cả');
                setSelectedStatus('all');
                setSelectedDirection('Tất cả');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F1E19] px-5 py-2.5 text-xs font-bold text-[#E6C770] cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid Cards View */
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlots.map((plot) => {
              const coverImg =
                plot.images && plot.images.length > 0
                  ? plot.images[0]
                  : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';
              const photoCount = plot.images?.length || 1;
              const videoCount = plot.videos?.length || 0;

              return (
                <article
                  key={plot.id}
                  onClick={() => setActivePlot(plot)}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-[#E5DEC9] bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#C59B27]/60 cursor-pointer"
                >
                  {/* Card Image Header */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0F1E19]">
                    {/* Standard below-the-fold lazy loading per optimize-image-priority */}
                    <img
                      src={coverImg}
                      alt={plot.title}
                      loading="lazy"
                      width={600}
                      height={375}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                    {/* Top Left Badges */}
                    <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-2">
                      <span className="font-tech rounded-lg bg-[#0F1E19]/90 px-2.5 py-1 text-xs font-bold text-[#E6C770] backdrop-blur-xs border border-[#E6C770]/30">
                        {plot.code}
                      </span>
                      {renderStatusBadge(plot.status)}
                    </div>

                    {/* Top Right Featured Badge */}
                    {plot.is_featured && (
                      <div className="absolute top-3.5 right-3.5 rounded-full bg-[#C59B27] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#0B1612] shadow-md">
                        Lô Hoa Hậu
                      </div>
                    )}

                    {/* Bottom Image Overlay: Price & Media Count */}
                    <div className="absolute bottom-3.5 inset-x-4 flex items-end justify-between gap-2 text-white">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-stone-300 block">
                          Giá trọn sổ
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="font-tech text-2xl font-extrabold text-[#E6C770]">
                            {plot.price_display}
                          </span>
                          {plot.price_per_m2 && (
                            <span className="font-tech text-xs text-stone-200">
                              ({plot.price_per_m2})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-xs">
                          <ImageIcon className="h-3.5 w-3.5 text-[#E6C770]" />
                          {photoCount}
                        </span>
                        {videoCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-red-600/90 px-2.5 py-1 text-xs font-semibold text-white">
                            <Film className="h-3.5 w-3.5" />
                            Video
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 truncate">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                          <span className="truncate">
                            {plot.location_name}
                            {plot.province ? `, ${plot.province}` : ''}
                          </span>
                        </span>
                      </div>

                      <h3 className="font-display text-xl font-bold leading-snug text-[#0F1E19] group-hover:text-[#8C7335] transition line-clamp-2">
                        {plot.title}
                      </h3>

                      {/* 4 Key Technical Metrics */}
                      <div className="grid grid-cols-2 gap-2.5 rounded-2xl bg-[#FAF8F5] p-3.5 border border-[#EDE6D6] text-xs">
                        <div className="flex items-center gap-2">
                          <Maximize2 className="h-4 w-4 text-[#C59B27] flex-shrink-0" />
                          <div>
                            <span className="text-stone-500 block text-[11px]">Diện tích</span>
                            <span className="font-tech font-bold text-[#0F1E19]">
                              {plot.area_m2} m²
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-[#C59B27] flex-shrink-0" />
                          <div className="truncate">
                            <span className="text-stone-500 block text-[11px]">Kích thước</span>
                            <span className="font-tech font-bold text-[#0F1E19] truncate block">
                              {plot.dimensions || 'Chuẩn đẹp'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Compass className="h-4 w-4 text-[#C59B27] flex-shrink-0" />
                          <div>
                            <span className="text-stone-500 block text-[11px]">Hướng</span>
                            <span className="font-bold text-[#0F1E19]">{plot.direction}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Route className="h-4 w-4 text-[#C59B27] flex-shrink-0" />
                          <div className="truncate">
                            <span className="text-stone-500 block text-[11px]">Đường trước đất</span>
                            <span className="font-bold text-[#0F1E19] truncate block">
                              {plot.road_width}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Legal Pill */}
                      <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
                        <FileCheck2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{plot.legal_status}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-12 gap-2.5 pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePlot(plot);
                        }}
                        className="col-span-5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#0F1E19]/20 bg-[#FAF8F5] px-3 py-3 text-xs font-bold text-[#0F1E19] transition hover:bg-[#0F1E19] hover:text-white cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Chi Tiết</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDirectZaloContact(plot, e)}
                        className="col-span-7 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0068FF] px-3 py-3 text-xs font-bold text-white shadow-sm shadow-[#0068FF]/20 transition hover:bg-[#0055D4] cursor-pointer"
                      >
                        <MessageCircle className="h-4 w-4 fill-current" />
                        <span>Liên Hệ Ngay (Zalo)</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Investor Comparison Table View */
          <div className="overflow-hidden rounded-3xl border border-[#E5DEC9] bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5DEC9] bg-[#0F1E19] text-xs font-bold uppercase tracking-wider text-[#E6C770]">
                    <th className="py-4 px-5">Mã Lô</th>
                    <th className="py-4 px-5">Tên Lô Đất & Khu Vực</th>
                    <th className="py-4 px-5">Diện Tích / Kích Thước</th>
                    <th className="py-4 px-5">Hướng & Đường</th>
                    <th className="py-4 px-5">Giá Bán</th>
                    <th className="py-4 px-5">Trạng Thái</th>
                    <th className="py-4 px-5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DEC9] text-sm">
                  {filteredPlots.map((plot) => (
                    <tr
                      key={plot.id}
                      onClick={() => setActivePlot(plot)}
                      className="hover:bg-[#FAF8F5] transition cursor-pointer"
                    >
                      <td className="py-4 px-5 font-tech font-bold text-[#0F1E19] whitespace-nowrap">
                        {plot.code}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-[#0F1E19]">{plot.title}</div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          {plot.location_name}, {plot.province} · {plot.legal_status}
                        </div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-tech font-bold text-[#0F1E19]">
                          {plot.area_m2} m²
                        </div>
                        <div className="font-tech text-xs text-stone-500">
                          {plot.dimensions}
                        </div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-semibold text-[#0F1E19]">{plot.direction}</div>
                        <div className="text-xs text-stone-500">{plot.road_width}</div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-tech text-base font-extrabold text-emerald-800">
                          {plot.price_display}
                        </div>
                        <div className="font-tech text-xs text-stone-500">
                          {plot.price_per_m2}
                        </div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        {renderStatusBadge(plot.status)}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleDirectZaloContact(plot, e)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0068FF] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0055D4] cursor-pointer"
                        >
                          <MessageCircle className="h-3.5 w-3.5 fill-current" />
                          Liên Hệ Zalo
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

      {/* 4-Step Safe Transaction & Legal Guarantee Section */}
      <section
        id="cam-ket-phap-ly"
        className="bg-[#0F1E19] text-white py-16 lg:py-20 border-y border-[#C59B27]/30"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E6C770]">
              An Toàn Pháp Lý Tuyệt Đối
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">
              Quy Trình 4 Bước Xem Đất & Giao Dịch Minh Bạch
            </h2>
            <p className="mt-3 text-sm sm:text-base text-stone-300">
              Giúp khách hàng ở xa hay gần đều nắm rõ thông tin thực tế trước khi quyết định đi xem đất và đặt cọc công chứng.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                title: 'Chọn Lô & Nhận Hồ Sơ Qua Zalo',
                desc: 'Khách hàng chọn lô đất ưng ý trên web và nhấn Liên Hệ Ngay. Tôi gửi ngay ảnh sổ hồng gốc, video thực tế và định vị Google Maps qua Zalo.',
              },
              {
                step: '02',
                title: 'Khảo Sát Thực Địa & Check Quy Hoạch',
                desc: 'Đưa đón khách hàng đi xem đất thực tế miễn phí, kiểm tra ranh mốc cọc bê tông và kiểm tra quy hoạch trực tiếp tại cơ quan chức năng.',
              },
              {
                step: '03',
                title: 'Đặt Cọc Chính Chủ & Ký Công Chứng',
                desc: 'Làm việc và đàm phán giá trực tiếp với chủ đất. Ký hợp đồng chuyển nhượng tại Văn phòng Công chứng nhà nước.',
              },
              {
                step: '04',
                title: 'Sang Tên Sổ Hồng & Đồng Hành Ra Hàng',
                desc: 'Hỗ trợ trọn gói thủ tục thuế, đăng bộ sang tên sổ hồng trao tận tay và nhận ký gửi bán lại sinh lời cho nhà đầu tư.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-white/15 bg-white/5 p-6 space-y-3 hover:border-[#E6C770]/50 transition"
              >
                <div className="font-tech text-3xl font-extrabold text-[#E6C770]">
                  {item.step}
                </div>
                <h3 className="font-display text-xl font-bold text-white">{item.title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-stone-300">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Broker Dedicated CTA Banner */}
      <section id="chuyen-vien" className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-3xl border border-[#E5DEC9] bg-white p-8 sm:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              Làm Việc Uy Tín · Tận Tâm · Không Kê Giá
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0F1E19]">
              Bạn Cần Tìm Lô Đất Theo Nhu Cầu & Tài Chính Riêng?
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              Ngoài các lô đất công khai trên website, <strong>{settings.broker_name}</strong> còn nắm giữ nhiều lô đất ngộp chính chủ gửi bán kín với mức giá thấp hơn thị trường từ 15–25%. Hãy nhắn ngay qua Zalo để nhận danh sách phù hợp nhất với tầm tài chính của bạn.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-2xl bg-[#0068FF] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#0068FF]/25 transition hover:bg-[#0055D4]"
              >
                <MessageCircle className="h-5 w-5 fill-current" />
                <span>Nhắn Tin Zalo ({settings.zalo_phone})</span>
              </a>
              <a
                href={`tel:${settings.zalo_phone}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#0F1E19]/25 bg-[#FAF8F5] px-6 py-4 text-sm font-bold text-[#0F1E19] transition hover:bg-[#0F1E19] hover:text-white"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Gọi Điện: {settings.hotline}</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center text-center p-6 rounded-2xl bg-[#FAF8F5] border border-[#EDE6D6]">
            <img
              src={settings.broker_avatar}
              alt={settings.broker_name}
              loading="lazy"
              width={112}
              height={112}
              className="h-28 w-28 rounded-full object-cover border-4 border-[#C59B27] shadow-md"
            />
            <h3 className="font-display text-2xl font-bold text-[#0F1E19] mt-3">
              {settings.broker_name}
            </h3>
            <p className="text-xs text-stone-600 mt-1">{settings.broker_title}</p>
            <div className="mt-4 w-full pt-4 border-t border-[#E5DEC9] text-xs text-stone-600 space-y-1">
              <div>
                Zalo / SĐT: <strong className="font-tech text-[#0F1E19]">{settings.zalo_phone}</strong>
              </div>
              <div>Địa chỉ: {settings.office_address}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (No public admin link to keep /login hidden as requested) */}
      <footer className="mt-auto bg-[#0B1612] text-stone-400 py-12 border-t border-white/10 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-display text-lg font-bold text-white block">
              {settings.brand_name}
            </span>
            <p className="mt-1">{settings.brand_tagline}</p>
          </div>
          <div className="text-center sm:text-right space-y-1">
            <p>
              Hotline / Zalo: <strong className="text-[#E6C770] font-tech">{settings.hotline}</strong> · Email:{' '}
              {settings.email}
            </p>
            <p>© {new Date().getFullYear()} {settings.brand_name}. Bảo lưu mọi quyền.</p>
          </div>
        </div>
      </footer>

      {/* Floating Zalo & Call Quick Button */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Liên hệ ngay qua Zalo"
          className="group flex items-center gap-2.5 rounded-full bg-[#0068FF] pl-4 pr-5 py-3.5 text-sm font-bold text-white shadow-2xl shadow-[#0068FF]/40 ring-4 ring-white transition hover:scale-105"
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
