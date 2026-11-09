import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  FileCheck2,
  Film,
  Image as ImageIcon,
  MapPin,
  Maximize,
  Maximize2,
  MessageCircle,
  Minimize2,
  PhoneCall,
  Play,
  Route,
  Ruler,
  Sparkles,
  X,
} from 'lucide-react';
import { LandPlot, SiteSettings } from './types';
import { buildZaloUrl } from './supabase';

interface PlotDetailModalProps {
  plot: LandPlot | null;
  settings: SiteSettings;
  onClose: () => void;
}

interface UnifiedMediaItem {
  type: 'image' | 'video';
  url: string;
}

export const PlotDetailModal: React.FC<PlotDetailModalProps> = ({
  plot,
  settings,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleId = useId();

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mediaItems = useMemo<UnifiedMediaItem[]>(() => {
    if (!plot) return [];
    const items: UnifiedMediaItem[] = [];
    for (const img of plot.images || []) {
      if (img && img.trim()) {
        items.push({ type: 'image', url: img.trim() });
      }
    }
    for (const vid of plot.videos || []) {
      if (vid && vid.trim()) {
        items.push({ type: 'video', url: vid.trim() });
      }
    }
    if (items.length === 0) {
      items.push({
        type: 'image',
        url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
      });
    }
    return items;
  }, [plot]);

  const currentMedia = mediaItems[activeMediaIndex] || mediaItems[0];

  // Open modal using native showModal()
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

  // Mandatory fallback for browsers without <dialog closedby="any"> support
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCloseEvent = () => {
      setIsFullscreen(false);
      onClose();
    };
    dialog.addEventListener('close', handleCloseEvent);

    let handleBackdropClick: ((event: MouseEvent) => void) | undefined;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      };
      dialog.addEventListener('click', handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener('close', handleCloseEvent);
      if (handleBackdropClick) {
        dialog.removeEventListener('click', handleBackdropClick);
      }
    };
  }, [onClose]);

  // Feature-detect native media lazy loading on HTMLMediaElement.prototype
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !currentMedia || currentMedia.type !== 'video') return;

    const supportsLazyMedia = Object.hasOwn(HTMLMediaElement.prototype, 'loading');
    if (!supportsLazyMedia) {
      const mediaObserver = new IntersectionObserver(
        (entries, observer) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const media = entry.target as HTMLVideoElement;
            if (media.dataset.poster) {
              media.poster = media.dataset.poster;
              delete media.dataset.poster;
            }
            if (media.dataset.preload) {
              media.preload = media.dataset.preload as '' | 'none' | 'metadata' | 'auto';
              delete media.dataset.preload;
            }
            if (media.dataset.src) {
              media.src = media.dataset.src;
              delete media.dataset.src;
            }
            media.load();
            observer.unobserve(media);
          }
        },
        { rootMargin: '200px 0px' }
      );
      mediaObserver.observe(videoEl);
      return () => mediaObserver.disconnect();
    }
  }, [currentMedia, activeMediaIndex, plot]);

  if (!plot) {
    return (
      <dialog
        ref={dialogRef}
        {...({ closedby: 'any' } as any)}
        aria-labelledby={titleId}
        className="hidden"
      />
    );
  }

  const zaloUrl = buildZaloUrl(settings.zalo_phone);
  const hasMapUrl = Boolean(plot.map_url && plot.map_url.trim());
  const displayPrice = plot.price_display?.trim() || 'Liên hệ để trao đổi';
  const displayPricePerM2 = plot.price_per_m2?.trim() || '';
  const firstPosterImage =
    plot.images && plot.images.length > 0 ? plot.images[0] : undefined;

  // Build only non-empty technical specifications (never auto-fill blank fields)
  const validSpecs: Array<{
    key: string;
    label: string;
    value: string;
    icon: React.ReactNode;
    isMono?: boolean;
  }> = [];

  if (plot.area_m2 && plot.area_m2 > 0) {
    validSpecs.push({
      key: 'area',
      label: 'Diện tích',
      value: `${plot.area_m2} m²`,
      icon: <Maximize2 className="h-4 w-4 text-blue-600" />,
      isMono: true,
    });
  }
  if (plot.dimensions && plot.dimensions.trim()) {
    validSpecs.push({
      key: 'dimensions',
      label: 'Kích thước (Ngang × Dài)',
      value: plot.dimensions.trim(),
      icon: <Ruler className="h-4 w-4 text-blue-600" />,
      isMono: true,
    });
  }
  if (plot.direction && plot.direction.trim()) {
    validSpecs.push({
      key: 'direction',
      label: 'Hướng',
      value: plot.direction.trim(),
      icon: <Compass className="h-4 w-4 text-blue-600" />,
    });
  }
  if (plot.road_width && plot.road_width.trim()) {
    validSpecs.push({
      key: 'road',
      label: 'Đường trước đất',
      value: plot.road_width.trim(),
      icon: <Route className="h-4 w-4 text-blue-600" />,
    });
  }
  if (plot.legal_status && plot.legal_status.trim()) {
    validSpecs.push({
      key: 'legal',
      label: 'Pháp lý',
      value: plot.legal_status.trim(),
      icon: <FileCheck2 className="h-4 w-4 text-blue-600" />,
    });
  }

  const hasDescription = Boolean(plot.description && plot.description.trim());
  const hasHighlights = Boolean(plot.highlights && plot.highlights.length > 0);

  const statusConfig = {
    available: {
      label: 'Đang Mở Bán',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
    },
    reserved: {
      label: 'Đã Nhận Cọc',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
    },
    sold: {
      label: 'Đã Bán',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      dotClass: 'bg-slate-500',
    },
  }[plot.status || 'available'];

  const goPrevMedia = () => {
    setActiveMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const goNextMedia = () => {
    setActiveMediaIndex((prev) => (prev + 1) % mediaItems.length);
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby={titleId}
      className="m-auto w-[96vw] max-w-[1360px] rounded-3xl bg-white p-0 text-slate-900 shadow-2xl border border-slate-200 overflow-hidden max-h-[94vh]"
    >
      {/* FULL SCREEN LIGHTBOX OVERLAY FOR IMAGES & VIDEOS */}
      {isFullscreen && currentMedia && (
        <div className="fixed inset-0 z-50 bg-slate-950/98 text-white flex flex-col justify-between p-4 sm:p-6">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <span className="font-tech rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                {plot.code}
              </span>
              <span className="text-sm font-bold text-slate-200 truncate max-w-md sm:max-w-xl">
                {plot.title}
              </span>
              <span className="font-tech text-xs text-slate-400">
                ({activeMediaIndex + 1} / {mediaItems.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-white/25 transition cursor-pointer"
            >
              <Minimize2 className="h-4 w-4" />
              <span>Thu Nhỏ Toàn Màn Hình</span>
            </button>
          </div>

          {/* Fullscreen Main Stage */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden my-2">
            {mediaItems.length > 1 && (
              <button
                type="button"
                onClick={goPrevMedia}
                aria-label="Trước"
                className="absolute left-2 sm:left-6 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-blue-600 transition cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {currentMedia.type === 'image' ? (
              <img
                src={currentMedia.url}
                alt={`${plot.title} - ${activeMediaIndex + 1}`}
                className="max-h-[76vh] max-w-full object-contain rounded-lg select-none"
              />
            ) : (
              <video
                key={`fs-${currentMedia.url}`}
                controls
                autoPlay
                width={1280}
                height={720}
                poster={firstPosterImage}
                className="max-h-[76vh] max-w-full object-contain rounded-lg bg-black"
              >
                <source src={currentMedia.url} type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ phát video.
              </video>
            )}

            {mediaItems.length > 1 && (
              <button
                type="button"
                onClick={goNextMedia}
                aria-label="Tiếp theo"
                className="absolute right-2 sm:right-6 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-blue-600 transition cursor-pointer"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Fullscreen Bottom Thumbnails */}
          {mediaItems.length > 1 && (
            <div className="flex items-center justify-center gap-2.5 overflow-x-auto pt-2 border-t border-white/10">
              {mediaItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition cursor-pointer ${
                    activeMediaIndex === idx
                      ? 'border-blue-500 ring-2 ring-blue-500/40'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`Thumb ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center text-white">
                      <Play className="h-5 w-5 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] font-bold mt-0.5">Video</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REGULAR MODAL CONTENT */}
      <div className="flex flex-col max-h-[94vh]">
        {/* Top Sticky Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-20">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-tech rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold tracking-wider text-amber-400">
              MÃ LÔ: {plot.code}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold ${statusConfig.badgeClass}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusConfig.dotClass}`} />
              {statusConfig.label}
            </span>
            {plot.category && (
              <span className="rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-700">
                {plot.category}
              </span>
            )}
          </div>

          <form method="dialog">
            <button
              type="submit"
              aria-label="Đóng cửa sổ chi tiết"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-900 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 lg:p-8 bg-slate-50/60">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Column: Unified Media Gallery (Images & Videos Together) + Description */}
            <div className="lg:col-span-7 space-y-6">
              {/* Unified Media Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs">
                  <ImageIcon className="h-4 w-4 text-amber-400" />
                  <span>Hình ảnh / Video ({mediaItems.length})</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-slate-900 hover:text-white cursor-pointer"
                  >
                    <Maximize className="h-3.5 w-3.5 text-blue-600" />
                    <span>Xem toàn màn hình</span>
                  </button>

                  {hasMapUrl && (
                    <a
                      href={plot.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Mở Google Maps</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Main Media Stage */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-md group">
                {currentMedia.type === 'image' ? (
                  <div
                    onClick={() => setIsFullscreen(true)}
                    title="Bấm để phóng to toàn màn hình"
                    className="relative aspect-[16/10] w-full cursor-zoom-in"
                  >
                    <img
                      src={currentMedia.url}
                      alt={`${plot.title} - ${activeMediaIndex + 1}`}
                      width={800}
                      height={500}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-3.5 right-3.5 flex items-center gap-2">
                      <span className="rounded-lg bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-xs font-tech">
                        {activeMediaIndex + 1} / {mediaItems.length}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-[16/10] w-full bg-black flex items-center justify-center">
                    <video
                      ref={videoRef}
                      key={currentMedia.url}
                      controls
                      {...({ loading: 'lazy' } as any)}
                      width={800}
                      height={450}
                      poster={firstPosterImage}
                      preload="metadata"
                      className="h-full w-full object-contain"
                    >
                      <source src={currentMedia.url} type="video/mp4" />
                      Trình duyệt của bạn không hỗ trợ phát video.
                    </video>
                  </div>
                )}

                {/* Prev / Next Overlay Arrows */}
                {mediaItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goPrevMedia();
                      }}
                      aria-label="Trước"
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-blue-600 transition cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goNextMedia();
                      }}
                      aria-label="Tiếp"
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-blue-600 transition cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Unified Thumbnails Strip (Both Images & Videos in One Place) */}
              {mediaItems.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {mediaItems.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl border-2 transition cursor-pointer ${
                        activeMediaIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-600/25'
                          : 'border-slate-200 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={`Hình ${idx + 1}`}
                          loading="lazy"
                          fetchPriority="low"
                          width={112}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="relative h-full w-full bg-slate-900 flex flex-col items-center justify-center text-white">
                          {firstPosterImage && (
                            <img
                              src={firstPosterImage}
                              alt="Video poster"
                              loading="lazy"
                              fetchPriority="low"
                              width={112}
                              height={80}
                              className="absolute inset-0 h-full w-full object-cover opacity-40"
                            />
                          )}
                          <div className="relative z-10 flex flex-col items-center">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow">
                              <Play className="h-4 w-4 fill-current ml-0.5" />
                            </span>
                            <span className="mt-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold">
                              Video
                            </span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Detailed Description & Highlights (Only shown if non-empty) */}
              {(hasDescription || hasHighlights) && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-2xs">
                  {hasDescription && (
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        Thông Tin Mô Tả Lô Đất
                      </h3>
                      <p className="mt-3 whitespace-pre-line text-sm sm:text-base leading-relaxed text-slate-700">
                        {plot.description}
                      </p>
                    </div>
                  )}

                  {hasHighlights && (
                    <div className={hasDescription ? 'pt-4 border-t border-slate-100' : ''}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Đặc Điểm Nổi Bật
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {plot.highlights.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 border border-slate-200/80"
                          >
                            <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Title, Pricing, Dynamic Specs & Direct Zalo Contact */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xs space-y-6">
                <div>
                  {(plot.location_name || plot.province) && (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-700 mb-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {plot.location_name}
                        {plot.province ? `, ${plot.province}` : ''}
                      </span>
                    </div>
                  )}
                  <h2
                    id={titleId}
                    className="font-display text-2xl sm:text-3xl font-extrabold leading-snug text-slate-900"
                  >
                    {plot.title}
                  </h2>
                  {plot.subtitle && plot.subtitle.trim() && (
                    <p className="mt-2 text-sm sm:text-base text-slate-600">{plot.subtitle}</p>
                  )}
                </div>

                {/* Price Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-md">
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                        Giá Bán
                      </span>
                      <span className="font-tech text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1 block">
                        {displayPrice}
                      </span>
                    </div>
                    {displayPricePerM2 && (
                      <div className="text-right">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                          Đơn Giá / m²
                        </span>
                        <span className="font-tech text-sm sm:text-base font-bold text-blue-300 mt-1 block">
                          {displayPricePerM2}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specification Grid (Only renders fields that are not blank) */}
                {validSpecs.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {validSpecs.map((spec) => (
                      <div
                        key={spec.key}
                        className="rounded-xl bg-slate-50 p-4 border border-slate-200/80"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          {spec.icon}
                          <span>{spec.label}</span>
                        </div>
                        <div
                          className={`mt-1.5 text-base font-bold text-slate-900 ${
                            spec.isMono ? 'font-tech' : ''
                          }`}
                        >
                          {spec.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Direct Zalo Contact Box (Clean, Direct, No Message Template) */}
                <div className="rounded-2xl border-2 border-blue-600/20 bg-blue-50/60 p-5 space-y-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={settings.broker_avatar}
                      alt={settings.broker_name}
                      loading="lazy"
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-full object-cover border-2 border-blue-600 flex-shrink-0"
                    />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
                        Liên Hệ Trực Tiếp
                      </div>
                      <div className="text-lg font-extrabold text-slate-900">
                        {settings.broker_name}
                      </div>
                      <div className="font-tech text-xs sm:text-sm font-semibold text-slate-600">
                        Zalo / SĐT: {settings.hotline || settings.zalo_phone}
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA Button -> Opens Zalo Immediately */}
                  <a
                    href={zaloUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#0068FF] px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:bg-[#0055D4] active:scale-[0.99]"
                  >
                    <MessageCircle className="h-5 w-5 fill-current" />
                    <span>Liên Hệ Ngay Qua Zalo ({settings.zalo_phone})</span>
                  </a>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <a
                      href={`tel:${settings.zalo_phone}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 transition hover:bg-slate-900 hover:text-white"
                    >
                      <PhoneCall className="h-4 w-4 text-blue-600" />
                      <span>Gọi Điện: {settings.hotline || settings.zalo_phone}</span>
                    </a>
                    {hasMapUrl && (
                      <a
                        href={plot.map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>Xem Bản Đồ</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};
