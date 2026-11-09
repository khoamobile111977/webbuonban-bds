import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  FileCheck,
  Film,
  Image as ImageIcon,
  MapPin,
  Maximize2,
  MessageCircle,
  Minimize2,
  Phone,
  Route,
  Ruler,
  Sparkles,
  X,
} from 'lucide-react';
import { formatZaloLink, sanitizeUrl } from './supabase';
import { LandPlot, SiteSettings } from './types';

interface PlotDetailModalProps {
  plot: LandPlot | null;
  settings: SiteSettings;
  onClose: () => void;
}

type MediaItem = {
  type: 'image' | 'video';
  url: string;
};

export const PlotDetailModal: React.FC<PlotDetailModalProps> = ({
  plot,
  settings,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mediaList: MediaItem[] = React.useMemo(() => {
    if (!plot) return [];
    const imgs: MediaItem[] = (plot.images || [])
      .map((url) => sanitizeUrl(url))
      .filter(Boolean)
      .map((url) => ({ type: 'image', url }));
    const vids: MediaItem[] = (plot.videos || [])
      .map((url) => sanitizeUrl(url))
      .filter(Boolean)
      .map((url) => ({ type: 'video', url }));
    return [...imgs, ...vids];
  }, [plot]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (plot) {
      setActiveMediaIndex(0);
      setIsFullscreen(false);
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [plot]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!plot) return;
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        e.stopPropagation();
        setIsFullscreen(false);
      } else if (e.key === 'ArrowRight' && mediaList.length > 1) {
        setActiveMediaIndex((prev) => (prev + 1) % mediaList.length);
      } else if (e.key === 'ArrowLeft' && mediaList.length > 1) {
        setActiveMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [plot, isFullscreen, mediaList.length]);

  if (!plot) return null;

  const activeMedia: MediaItem = mediaList[activeMediaIndex] || {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
  };

  const statusBadge = {
    available: {
      label: 'Đang Mở Bán',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    reserved: {
      label: 'Đã Nhận Cọc',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    sold: {
      label: 'Đã Bán',
      bg: 'bg-slate-200 text-slate-700 border-slate-300',
      dot: 'bg-slate-500',
    },
  }[plot.status];

  const hasPrice = Boolean(plot.price_display && plot.price_display.trim().length > 0);
  const hasPricePerM2 = Boolean(plot.price_per_m2 && plot.price_per_m2.trim().length > 0);
  const safeMapUrl = sanitizeUrl(plot.map_url);
  const hasMapUrl = Boolean(safeMapUrl);
  const zaloDirectUrl = formatZaloLink(settings.zalo_phone);

  const specItems = [
    plot.area_m2 && plot.area_m2 > 0
      ? {
          icon: <Maximize2 className="h-4 w-4 text-blue-600" />,
          label: 'Diện tích',
          value: `${plot.area_m2} m²`,
        }
      : null,
    plot.dimensions && plot.dimensions.trim()
      ? {
          icon: <Ruler className="h-4 w-4 text-blue-600" />,
          label: 'Kích thước',
          value: plot.dimensions.trim(),
        }
      : null,
    plot.direction && plot.direction.trim()
      ? {
          icon: <Compass className="h-4 w-4 text-blue-600" />,
          label: 'Hướng',
          value: plot.direction.trim(),
        }
      : null,
    plot.road_width && plot.road_width.trim()
      ? {
          icon: <Route className="h-4 w-4 text-blue-600" />,
          label: 'Đường trước đất',
          value: plot.road_width.trim(),
        }
      : null,
    plot.legal_status && plot.legal_status.trim()
      ? {
          icon: <FileCheck className="h-4 w-4 text-emerald-600" />,
          label: 'Pháp lý',
          value: plot.legal_status.trim(),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <>
      <dialog
        ref={dialogRef}
        {...({ closedby: 'any' } as Record<string, string>)}
        onClose={onClose}
        onClick={(e) => {
          if (e.target === dialogRef.current && !isFullscreen) {
            onClose();
          }
        }}
        className="m-auto w-[96vw] max-w-[1440px] rounded-3xl bg-white text-slate-900 p-0 shadow-2xl border border-slate-200 overflow-hidden max-h-[94vh]"
      >
        <div className="flex flex-col max-h-[94vh] overflow-y-auto">
          {/* Sticky Top Bar */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 sm:px-8 py-4 backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-tech rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs sm:text-sm font-bold tracking-wider text-amber-400">
                MÃ LÔ: {plot.code}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs sm:text-sm font-semibold ${statusBadge.bg}`}
              >
                <span className={`h-2 w-2 rounded-full ${statusBadge.dot}`} />
                {statusBadge.label}
              </span>
              {plot.category && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-3.5 py-1 text-xs sm:text-sm font-medium text-slate-700">
                  {plot.category}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ chi tiết"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-900 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Modal Content Grid */}
          <div className="grid grid-cols-1 gap-8 p-5 sm:p-8 lg:grid-cols-12">
            {/* Left Column: Unified Media Gallery + Description */}
            <div className="lg:col-span-7 space-y-6">
              {/* Unified Header: Hình ảnh / Video */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
                  <ImageIcon className="h-4 w-4 text-amber-400" />
                  <span>Hình ảnh / Video ({mediaList.length})</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 transition hover:bg-slate-900 hover:text-white cursor-pointer"
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span>Xem toàn màn hình</span>
                  </button>

                  {hasMapUrl && (
                    <a
                      href={safeMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>Mở Google Maps</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Active Media Stage */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 aspect-[16/10] shadow-md group">
                {activeMedia.type === 'image' ? (
                  <div
                    onClick={() => setIsFullscreen(true)}
                    className="h-full w-full cursor-zoom-in relative"
                    title="Bấm để phóng to toàn màn hình"
                  >
                    <img
                      src={activeMedia.url}
                      alt={`${plot.title} - ${activeMediaIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 rounded-xl bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xs">
                      {activeMediaIndex + 1} / {mediaList.length || 1}
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-black relative">
                    <video
                      key={activeMedia.url}
                      src={`${activeMedia.url}#t=0.1`}
                      controls
                      playsInline
                      preload="metadata"
                      width={1280}
                      height={720}
                      className="h-full w-full max-h-[520px] object-contain"
                    >
                      Trình duyệt của bạn không hỗ trợ phát video trực tiếp.
                    </video>
                  </div>
                )}

                {mediaList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMediaIndex(
                          (prev) => (prev - 1 + mediaList.length) % mediaList.length
                        )
                      }
                      aria-label="Trước"
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/75 text-white backdrop-blur-xs transition hover:bg-slate-900 cursor-pointer"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMediaIndex((prev) => (prev + 1) % mediaList.length)
                      }
                      aria-label="Tiếp"
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/75 text-white backdrop-blur-xs transition hover:bg-slate-900 cursor-pointer"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Unified Thumbnail Strip (Video thumbnails show the actual video frame, never plot cover photo!) */}
              {mediaList.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                  {mediaList.map((item, idx) => (
                    <button
                      key={`${item.type}-${idx}`}
                      type="button"
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`relative aspect-[16/10] overflow-hidden rounded-xl border-2 transition cursor-pointer ${
                        activeMediaIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-600/30 scale-[1.02]'
                          : 'border-slate-200 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={`Hình ${idx + 1}`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-900 relative flex items-center justify-center">
                          <video
                            src={`${item.url}#t=0.1`}
                            preload="metadata"
                            muted
                            playsInline
                            width={240}
                            height={150}
                            className="h-full w-full object-cover opacity-85 pointer-events-none"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/35">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
                              <Film className="h-4 w-4" />
                            </span>
                            <span className="mt-1 text-[10px] font-bold text-white uppercase tracking-wider bg-slate-950/80 px-1.5 py-0.5 rounded">
                              Video
                            </span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Detailed Description & Highlights */}
              {(Boolean(plot.description && plot.description.trim()) ||
                (plot.highlights && plot.highlights.length > 0)) && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-5">
                  {plot.description && plot.description.trim() && (
                    <div>
                      <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 mb-2.5">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        Thông Tin Mô Tả Lô Đất
                      </h3>
                      <p className="text-sm sm:text-base leading-relaxed text-slate-700 whitespace-pre-line">
                        {plot.description}
                      </p>
                    </div>
                  )}

                  {plot.highlights && plot.highlights.length > 0 && (
                    <div className="pt-3 border-t border-slate-200">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Đặc Điểm Nổi Bật
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {plot.highlights.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm font-medium text-slate-800">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Price, Non-empty Specs & Direct Zalo CTA */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <div>
                  {(plot.location_name || plot.province) && (
                    <div className="flex items-center gap-1.5 text-sm font-bold text-blue-700 mb-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {[plot.location_name, plot.province].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                    {plot.title}
                  </h2>
                  {plot.subtitle && plot.subtitle.trim() && (
                    <p className="mt-2 text-sm sm:text-base text-slate-600">
                      {plot.subtitle}
                    </p>
                  )}
                </div>

                {/* Prominent Price Card */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-6 text-white shadow-lg">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <span className="text-xs uppercase tracking-widest text-slate-300 font-semibold block">
                        Giá Bán
                      </span>
                      <div className="font-tech text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
                        {hasPrice ? plot.price_display : 'Liên hệ để trao đổi'}
                      </div>
                    </div>
                    {hasPrice && hasPricePerM2 && (
                      <div className="text-right">
                        <span className="text-xs text-slate-300 block">Đơn giá tham khảo</span>
                        <span className="font-tech text-sm sm:text-base font-bold text-white">
                          {plot.price_per_m2}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dynamic Specifications Grid */}
                {specItems.length > 0 && (
                  <div className="grid grid-cols-2 gap-3.5">
                    {specItems.map((spec, idx) => (
                      <div
                        key={idx}
                        className={`rounded-2xl border border-slate-200 bg-slate-50/70 p-4 ${
                          idx === specItems.length - 1 && specItems.length % 2 === 1
                            ? 'col-span-2'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          {spec.icon}
                          <span>{spec.label}</span>
                        </div>
                        <div className="mt-1.5 font-tech text-base font-bold text-slate-900">
                          {spec.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Direct Zalo & Hotline Box */}
                <div className="rounded-2xl border-2 border-blue-600/20 bg-blue-50/40 p-6 space-y-5">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={settings.broker_avatar}
                      alt={settings.broker_name}
                      className="h-14 w-14 rounded-full object-cover border-2 border-blue-600"
                    />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
                        Liên Hệ Trực Tiếp
                      </div>
                      <div className="font-display text-lg font-extrabold text-slate-900">
                        {settings.broker_name}
                      </div>
                      <div className="font-tech text-xs sm:text-sm text-slate-600">
                        Zalo / SĐT: <strong>{settings.zalo_phone}</strong>
                      </div>
                    </div>
                  </div>

                  <a
                    href={zaloDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#0068FF] hover:bg-[#0055D4] px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-blue-600/25 transition active:scale-[0.99]"
                  >
                    <MessageCircle className="h-5 w-5 fill-current" />
                    <span>Liên Hệ Ngay Qua Zalo ({settings.zalo_phone})</span>
                  </a>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={`tel:${settings.hotline.replace(/\D/g, '')}`}
                      className={`flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-900 hover:text-white ${
                        !hasMapUrl ? 'sm:col-span-2' : ''
                      }`}
                    >
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span>Gọi Điện: {settings.hotline}</span>
                    </a>

                    {hasMapUrl && (
                      <a
                        href={safeMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-900 hover:text-white"
                      >
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span>Xem Bản Đồ</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen Lightbox Overlay */}
        {isFullscreen && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsFullscreen(false);
              }
            }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-950/98 backdrop-blur-md"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 text-white">
              <div className="flex items-center gap-3">
                <span className="font-tech rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-bold text-slate-950">
                  {plot.code}
                </span>
                <span className="font-bold text-sm sm:text-base truncate max-w-xl">
                  {plot.title}
                </span>
                <span className="text-xs text-slate-400">
                  ({activeMediaIndex + 1} / {mediaList.length})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20 cursor-pointer"
              >
                <Minimize2 className="h-4 w-4" />
                <span>Thu nhỏ (ESC)</span>
              </button>
            </div>

            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsFullscreen(false);
                }
              }}
              className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden"
            >
              {activeMedia.type === 'image' ? (
                <img
                  src={activeMedia.url}
                  alt={plot.title}
                  className="max-h-[82vh] max-w-[94vw] object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <video
                  key={`fs-${activeMedia.url}`}
                  src={`${activeMedia.url}#t=0.1`}
                  controls
                  autoPlay
                  playsInline
                  width={1920}
                  height={1080}
                  className="max-h-[82vh] max-w-[94vw] object-contain rounded-lg shadow-2xl"
                />
              )}

              {mediaList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveMediaIndex(
                        (prev) => (prev - 1 + mediaList.length) % mediaList.length
                      )
                    }
                    className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 cursor-pointer"
                  >
                    <ChevronLeft className="h-7 w-7" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveMediaIndex((prev) => (prev + 1) % mediaList.length)
                    }
                    className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 cursor-pointer"
                  >
                    <ChevronRight className="h-7 w-7" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
};
