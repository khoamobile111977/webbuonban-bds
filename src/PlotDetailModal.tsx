import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Compass,
  Copy,
  ExternalLink,
  FileCheck2,
  Film,
  Image as ImageIcon,
  MapPin,
  Maximize2,
  MessageCircle,
  PhoneCall,
  Route,
  Ruler,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { LandPlot, SiteSettings } from './types';
import { buildZaloUrl, formatZaloMessage } from './supabase';

interface PlotDetailModalProps {
  plot: LandPlot | null;
  settings: SiteSettings;
  onClose: () => void;
}

export const PlotDetailModal: React.FC<PlotDetailModalProps> = ({
  plot,
  settings,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleId = useId();

  const [activeMediaType, setActiveMediaType] = useState<'image' | 'video'>('image');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Open modal using native showModal() and register mandatory light-dismiss fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (plot) {
      setActiveMediaType('image');
      setActiveImageIndex(0);
      setActiveVideoIndex(0);
      setCopiedMessage(false);
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
    if (!videoEl || activeMediaType !== 'video') return;

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
  }, [activeMediaType, activeVideoIndex, plot]);

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

  const images =
    plot.images && plot.images.length > 0
      ? plot.images
      : [
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
        ];
  const videos = plot.videos || [];
  const zaloUrl = buildZaloUrl(settings.zalo_phone);
  const greetingText = formatZaloMessage(settings.zalo_greeting_template, plot);

  const handleCopyAndOpenZalo = async () => {
    try {
      await navigator.clipboard.writeText(greetingText);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 3500);
    } catch {
      // Ignore clipboard permission errors
    }
    window.open(zaloUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessageOnly = async () => {
    try {
      await navigator.clipboard.writeText(greetingText);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 3000);
    } catch {
      // Ignore
    }
  };

  const statusConfig = {
    available: {
      label: 'Đang Mở Bán · Sẵn Sổ Công Chứng',
      badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
      dotClass: 'bg-emerald-500',
    },
    reserved: {
      label: 'Đã Nhận Cọc Giữ Chỗ',
      badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
      dotClass: 'bg-amber-500',
    },
    sold: {
      label: 'Đã Giao Dịch Thành Công',
      badgeClass: 'bg-stone-500/15 text-stone-700 border-stone-400/30',
      dotClass: 'bg-stone-500',
    },
  }[plot.status || 'available'];

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby={titleId}
      className="m-auto w-[95vw] max-w-6xl rounded-3xl bg-[#FAF8F5] p-0 text-[#111916] shadow-2xl border border-[#E5DEC9] overflow-hidden max-h-[92vh]"
    >
      <div className="flex flex-col max-h-[92vh]">
        {/* Top Sticky Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#E5DEC9] bg-white/95 px-6 py-4 backdrop-blur-md sticky top-0 z-20">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-tech rounded-lg bg-[#0F1E19] px-3 py-1 text-xs font-semibold tracking-wider text-[#E6C770]">
              MÃ LÔ: {plot.code}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusConfig.badgeClass}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusConfig.dotClass}`} />
              {statusConfig.label}
            </span>
            <span className="rounded-full bg-[#F2ECE1] px-3 py-1 text-xs font-medium text-[#5A5243]">
              {plot.category}
            </span>
          </div>

          <form method="dialog">
            <button
              type="submit"
              aria-label="Đóng cửa sổ chi tiết"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5DEC9] bg-[#FAF8F5] text-[#111916] transition hover:bg-[#0F1E19] hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Column: Media Gallery (Images & Videos) + Description */}
            <div className="lg:col-span-7 space-y-6">
              {/* Media Switcher Tabs if Videos exist */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveMediaType('image')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                      activeMediaType === 'image'
                        ? 'bg-[#0F1E19] text-[#E6C770] shadow-sm'
                        : 'bg-white text-stone-600 border border-[#E5DEC9] hover:bg-stone-100'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Hình Ảnh Thực Tế ({images.length})
                  </button>
                  {videos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveMediaType('video')}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                        activeMediaType === 'video'
                          ? 'bg-[#0F1E19] text-[#E6C770] shadow-sm'
                          : 'bg-white text-stone-600 border border-[#E5DEC9] hover:bg-stone-100'
                      }`}
                    >
                      <Film className="h-4 w-4" />
                      Video Flycam / Thực Tế ({videos.length})
                    </button>
                  )}
                </div>

                {plot.map_url && (
                  <a
                    href={plot.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-600 underline underline-offset-4"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Mở vị trí trên Google Maps
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Main Media Stage */}
              <div className="relative overflow-hidden rounded-2xl border border-[#E5DEC9] bg-[#0F1E19] shadow-inner">
                {activeMediaType === 'image' ? (
                  <div className="relative aspect-[16/10] w-full">
                    <img
                      src={images[activeImageIndex] || images[0]}
                      alt={`${plot.title} - Ảnh ${activeImageIndex + 1}`}
                      width={800}
                      height={500}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 rounded-lg bg-black/65 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm font-tech">
                      Ảnh {activeImageIndex + 1} / {images.length}
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-[16/9] w-full bg-black flex items-center justify-center">
                    <video
                      ref={videoRef}
                      key={videos[activeVideoIndex]}
                      controls
                      {...({ loading: 'lazy' } as any)}
                      width={800}
                      height={450}
                      poster={images[0]}
                      preload="metadata"
                      className="h-full w-full object-contain"
                    >
                      <source src={videos[activeVideoIndex]} type="video/mp4" />
                      Trình duyệt của bạn không hỗ trợ phát video.
                    </video>
                  </div>
                )}
              </div>

              {/* Thumbnails Strip */}
              {activeMediaType === 'image' && images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl border-2 transition cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-[#C59B27] ring-2 ring-[#C59B27]/30'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        loading="lazy"
                        fetchPriority="low"
                        width={112}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {activeMediaType === 'video' && videos.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {videos.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveVideoIndex(idx)}
                      className={`rounded-xl px-4 py-2 text-xs font-semibold border transition cursor-pointer ${
                        activeVideoIndex === idx
                          ? 'bg-[#0F1E19] text-[#E6C770] border-[#0F1E19]'
                          : 'bg-white text-stone-700 border-[#E5DEC9]'
                      }`}
                    >
                      Video #{idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Detailed Description & Highlights */}
              <div className="rounded-2xl border border-[#E5DEC9] bg-white p-6 space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-[#0F1E19] flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#C59B27]" />
                    Đặc Điểm & Tiềm Năng Sinh Lời Của Lô Đất
                  </h3>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-700">
                    {plot.description ||
                      'Lô đất sở hữu vị trí đắc địa, pháp lý sổ hồng riêng từng nền minh bạch, sẵn sàng công chứng sang tên ngay.'}
                  </p>
                </div>

                {plot.highlights && plot.highlights.length > 0 && (
                  <div className="pt-4 border-t border-stone-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                      Điểm Mạnh Nổi Bật
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {plot.highlights.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 rounded-xl bg-[#FAF8F5] px-3.5 py-2.5 text-xs font-medium text-[#111916] border border-[#EDE6D6]"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Title, Pricing, Technical Specs & Direct Zalo Conversion */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-[#E5DEC9] bg-white p-6 shadow-sm space-y-5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1.5">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {plot.location_name}
                      {plot.province ? `, ${plot.province}` : ''}
                    </span>
                  </div>
                  <h2
                    id={titleId}
                    className="font-display text-2xl sm:text-3xl font-bold leading-tight text-[#0F1E19]"
                  >
                    {plot.title}
                  </h2>
                  {plot.subtitle && (
                    <p className="mt-2 text-sm text-stone-600">{plot.subtitle}</p>
                  )}
                </div>

                {/* Price Banner */}
                <div className="rounded-2xl bg-gradient-to-br from-[#0F1E19] to-[#1A332B] p-5 text-white">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-stone-300 block">
                        Giá Bán Trọn Sổ
                      </span>
                      <span className="font-tech text-3xl font-bold text-[#E6C770] mt-1 block">
                        {plot.price_display}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs uppercase tracking-wider text-stone-300 block">
                        Đơn Giá Tham Chiếu
                      </span>
                      <span className="font-tech text-sm font-semibold text-emerald-300 mt-1 block">
                        {plot.price_per_m2 || 'Giá tốt chính chủ'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-stone-200">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      {plot.legal_status}
                    </span>
                    <span className="font-tech text-[#E6C770]">{plot.area_m2} m²</span>
                  </div>
                </div>

                {/* Specification Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#FAF8F5] p-3.5 border border-[#EDE6D6]">
                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <Maximize2 className="h-3.5 w-3.5 text-[#C59B27]" />
                      Diện tích công nhận
                    </div>
                    <div className="font-tech mt-1 text-base font-bold text-[#0F1E19]">
                      {plot.area_m2} m²
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#FAF8F5] p-3.5 border border-[#EDE6D6]">
                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <Ruler className="h-3.5 w-3.5 text-[#C59B27]" />
                      Kích thước (Ngang × Dài)
                    </div>
                    <div className="font-tech mt-1 text-sm font-bold text-[#0F1E19]">
                      {plot.dimensions || 'Chuẩn vuông vức'}
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#FAF8F5] p-3.5 border border-[#EDE6D6]">
                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <Compass className="h-3.5 w-3.5 text-[#C59B27]" />
                      Hướng phong thủy
                    </div>
                    <div className="mt-1 text-sm font-bold text-[#0F1E19]">
                      {plot.direction || 'Đông Nam'}
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#FAF8F5] p-3.5 border border-[#EDE6D6]">
                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <Route className="h-3.5 w-3.5 text-[#C59B27]" />
                      Lộ giới đường trước đất
                    </div>
                    <div className="mt-1 text-sm font-bold text-[#0F1E19]">
                      {plot.road_width || 'Đường ô tô tránh nhau'}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-950/5 border border-emerald-800/15 p-3.5 flex items-start gap-3">
                  <FileCheck2 className="h-5 w-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-stone-700 leading-relaxed">
                    <strong className="text-[#0F1E19] block">
                      Pháp lý cam kết: {plot.legal_status}
                    </strong>
                    Bao kiểm tra quy hoạch tại Văn phòng Đăng ký Đất đai, hỗ trợ công chứng sang tên trọn gói.
                  </div>
                </div>

                {/* Direct Zalo Conversion Box */}
                <div className="rounded-2xl border-2 border-[#0068FF]/25 bg-[#F0F7FF] p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={settings.broker_avatar}
                      alt={settings.broker_name}
                      loading="lazy"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover border-2 border-[#0068FF]"
                    />
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#0068FF]">
                        Chuyên Viên Phụ Trách Lô {plot.code}
                      </div>
                      <div className="text-base font-bold text-[#0F1E19]">
                        {settings.broker_name}
                      </div>
                      <div className="font-tech text-xs text-stone-600">
                        Zalo / Hotline: {settings.hotline || settings.zalo_phone}
                      </div>
                    </div>
                  </div>

                  {/* Pre-filled Message Box */}
                  <div className="rounded-xl bg-white p-3 border border-blue-200 text-xs text-stone-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-stone-500">
                        Tin nhắn mẫu gửi nhanh qua Zalo:
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyMessageOnly}
                        className="inline-flex items-center gap-1 text-[#0068FF] font-semibold hover:underline cursor-pointer"
                      >
                        {copiedMessage ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Đã chép
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Sao chép
                          </>
                        )}
                      </button>
                    </div>
                    <p className="italic text-stone-600">"{greetingText}"</p>
                  </div>

                  {/* Primary CTA Button -> Opens Zalo Immediately */}
                  <button
                    type="button"
                    onClick={handleCopyAndOpenZalo}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#0068FF] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#0068FF]/25 transition hover:bg-[#0055D4] active:scale-[0.99] cursor-pointer"
                  >
                    <MessageCircle className="h-5 w-5 fill-current" />
                    <span>Liên Hệ Ngay Qua Zalo ({settings.zalo_phone})</span>
                  </button>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <a
                      href={`tel:${settings.zalo_phone}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#0F1E19]/20 bg-white px-4 py-2.5 text-xs font-bold text-[#0F1E19] transition hover:bg-[#0F1E19] hover:text-white"
                    >
                      <PhoneCall className="h-4 w-4" />
                      Gọi Trực Tiếp: {settings.hotline}
                    </a>
                    {plot.map_url && (
                      <a
                        href={plot.map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-700/25 bg-white px-4 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50"
                      >
                        <MapPin className="h-4 w-4" />
                        Xem Bản Đồ
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
