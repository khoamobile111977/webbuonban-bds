import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Film,
  Globe,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  Save,
  Search,
  Star,
  Trash2,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import {
  LAND_CATEGORIES,
  LAND_DIRECTIONS,
  LandPlot,
  PlotStatus,
  SiteSettings,
} from './types';
import {
  createLandPlot,
  deleteLandPlot,
  updateLandPlot,
  updateSiteSettings,
  uploadMediaFile,
} from './supabase';

interface AdminPageProps {
  settings: SiteSettings;
  plots: LandPlot[];
  onRefreshData: () => Promise<void>;
  onLogout: () => void;
}

const EMPTY_PLOT_FORM: Omit<LandPlot, 'id' | 'created_at'> = {
  code: 'LK-10',
  title: '',
  subtitle: '',
  price_display: '1.65 Tỷ',
  price_billion: 1.65,
  price_per_m2: '15 Triệu/m²',
  area_m2: 110,
  dimensions: '5m × 22m',
  direction: 'Đông Nam',
  road_width: 'Đường nhựa 12m, vỉa hè 3m',
  legal_status: 'Sổ hồng riêng từng nền - Thổ cư 100%',
  category: 'Đất nền thổ cư',
  status: 'available',
  is_featured: false,
  location_name: '',
  province: '',
  map_url: '',
  map_embed_coords: '',
  description: '',
  highlights: [
    'Sổ hồng riêng từng nền, công chứng ngay',
    'Khu dân cư hiện hữu, điện nước đầy đủ',
  ],
  images: [],
  videos: [],
};

export const AdminPage: React.FC<AdminPageProps> = ({
  settings,
  plots,
  onRefreshData,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'plots' | 'settings' | 'security'>('plots');
  const [searchQuery, setSearchQuery] = useState('');
  const [bannerNotice, setBannerNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Plot Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPlotId, setEditingPlotId] = useState<string | null>(null);
  const [plotForm, setPlotForm] = useState<Omit<LandPlot, 'id' | 'created_at'>>(EMPTY_PLOT_FORM);
  const [highlightsText, setHighlightsText] = useState(EMPTY_PLOT_FORM.highlights.join('\n'));
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [savingPlot, setSavingPlot] = useState(false);

  // Site Settings Form State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingSiteImage, setUploadingSiteImage] = useState(false);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setBannerNotice({ type, message });
    setTimeout(() => setBannerNotice(null), 4500);
  };

  const openCreateModal = () => {
    const nextNum = String(plots.length + 1).padStart(2, '0');
    const freshForm = {
      ...EMPTY_PLOT_FORM,
      code: `LO-${nextNum}`,
    };
    setEditingPlotId(null);
    setPlotForm(freshForm);
    setHighlightsText(freshForm.highlights.join('\n'));
    setNewImageUrl('');
    setNewVideoUrl('');
    setIsEditorOpen(true);
  };

  const openEditModal = (plot: LandPlot) => {
    setEditingPlotId(plot.id);
    setPlotForm({
      code: plot.code,
      title: plot.title,
      subtitle: plot.subtitle || '',
      price_display: plot.price_display,
      price_billion: plot.price_billion,
      price_per_m2: plot.price_per_m2 || '',
      area_m2: plot.area_m2,
      dimensions: plot.dimensions || '',
      direction: plot.direction || 'Đông Nam',
      road_width: plot.road_width || '',
      legal_status: plot.legal_status || '',
      category: plot.category || LAND_CATEGORIES[0],
      status: plot.status || 'available',
      is_featured: Boolean(plot.is_featured),
      location_name: plot.location_name || '',
      province: plot.province || '',
      map_url: plot.map_url || '',
      map_embed_coords: plot.map_embed_coords || '',
      description: plot.description || '',
      highlights: plot.highlights || [],
      images: plot.images || [],
      videos: plot.videos || [],
    });
    setHighlightsText((plot.highlights || []).join('\n'));
    setNewImageUrl('');
    setNewVideoUrl('');
    setIsEditorOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const { url, error } = await uploadMediaFile(file, 'images');
      if (url) {
        uploadedUrls.push(url);
      } else if (error) {
        showNotice('error', `Lỗi tải ảnh ${file.name}: ${error}`);
      }
    }

    if (uploadedUrls.length > 0) {
      setPlotForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
      showNotice('success', `Đã tải lên thành công ${uploadedUrls.length} hình ảnh!`);
    }
    setUploadingMedia(false);
    e.target.value = '';
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const { url, error } = await uploadMediaFile(file, 'videos');
      if (url) {
        uploadedUrls.push(url);
      } else if (error) {
        showNotice('error', `Lỗi tải video ${file.name}: ${error}`);
      }
    }

    if (uploadedUrls.length > 0) {
      setPlotForm((prev) => ({
        ...prev,
        videos: [...prev.videos, ...uploadedUrls],
      }));
      showNotice('success', `Đã tải lên thành công ${uploadedUrls.length} video!`);
    }
    setUploadingMedia(false);
    e.target.value = '';
  };

  const handleSavePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plotForm.title.trim() || !plotForm.code.trim()) {
      showNotice('error', 'Vui lòng nhập Mã lô đất và Tên tiêu đề lô đất.');
      return;
    }

    setSavingPlot(true);
    const parsedHighlights = highlightsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const payload: Omit<LandPlot, 'id' | 'created_at'> = {
      ...plotForm,
      price_billion: Number(plotForm.price_billion) || 0,
      area_m2: Number(plotForm.area_m2) || 0,
      highlights: parsedHighlights,
      images:
        plotForm.images.length > 0
          ? plotForm.images
          : [
              'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
            ],
    };

    if (editingPlotId) {
      const { error } = await updateLandPlot(editingPlotId, payload);
      if (error) {
        showNotice('error', `Không thể cập nhật lô đất: ${error}`);
      } else {
        await onRefreshData();
        setIsEditorOpen(false);
        showNotice('success', `Đã cập nhật thông tin lô đất ${payload.code} thành công!`);
      }
    } else {
      const { error } = await createLandPlot(payload);
      if (error) {
        showNotice('error', `Không thể thêm lô đất mới: ${error}`);
      } else {
        await onRefreshData();
        setIsEditorOpen(false);
        showNotice('success', `Đã thêm lô đất mới ${payload.code} thành công!`);
      }
    }
    setSavingPlot(false);
  };

  const handleQuickStatusChange = async (plot: LandPlot, status: PlotStatus) => {
    const { error } = await updateLandPlot(plot.id, { status });
    if (error) {
      showNotice('error', `Lỗi đổi trạng thái: ${error}`);
    } else {
      await onRefreshData();
      showNotice('success', `Đã cập nhật trạng thái lô ${plot.code}!`);
    }
  };

  const handleToggleFeatured = async (plot: LandPlot) => {
    const { error } = await updateLandPlot(plot.id, { is_featured: !plot.is_featured });
    if (!error) {
      await onRefreshData();
      showNotice(
        'success',
        plot.is_featured
          ? `Đã bỏ đánh dấu nổi bật lô ${plot.code}`
          : `Đã ghim lô ${plot.code} lên đầu trang!`
      );
    }
  };

  const handleDeletePlot = async (plot: LandPlot) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa lô đất "${plot.code} - ${plot.title}" không?`
    );
    if (!confirmed) return;

    const { error } = await deleteLandPlot(plot.id);
    if (error) {
      showNotice('error', `Lỗi xóa lô đất: ${error}`);
    } else {
      await onRefreshData();
      showNotice('success', `Đã xóa lô đất ${plot.code}.`);
    }
  };

  const handleSiteAssetUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'broker_avatar' | 'hero_image'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSiteImage(true);
    const { url, error } = await uploadMediaFile(file, 'site');
    if (url) {
      setSettingsForm((prev) => ({ ...prev, [field]: url }));
      showNotice('success', 'Đã tải ảnh lên thành công! Nhấn "Lưu Cấu Hình" để áp dụng.');
    } else if (error) {
      showNotice('error', `Lỗi tải ảnh: ${error}`);
    }
    setUploadingSiteImage(false);
    e.target.value = '';
  };

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const { error } = await updateSiteSettings(settingsForm);
    if (error) {
      showNotice('error', `Lỗi lưu cài đặt: ${error}`);
    } else {
      await onRefreshData();
      showNotice('success', 'Đã lưu toàn bộ thông tin trang web & Zalo thành công!');
    }
    setSavingSettings(false);
  };

  const filteredPlots = plots.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.code.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.location_name.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: plots.length,
    available: plots.filter((p) => p.status === 'available').length,
    reserved: plots.filter((p) => p.status === 'reserved').length,
    sold: plots.filter((p) => p.status === 'sold').length,
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#111916] flex flex-col">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-30 bg-[#0F1E19] text-white border-b border-[#C59B27]/30 shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C59B27] text-[#0B1612] font-bold">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg font-bold text-white leading-none">
                QUẢN TRỊ WEBSITE · {settings.brand_name}
              </div>
              <div className="text-[11px] text-[#E6C770] mt-1">
                Zalo hiện tại: {settings.zalo_phone} · Tổng cộng {plots.length} lô đất
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#E6C770]" />
              <span>Xem Trang Chủ Khách Hàng</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('bds_admin_authenticated');
                onLogout();
                navigate('/login');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/20 border border-red-400/30 px-3.5 py-2 text-xs font-bold text-red-200 transition hover:bg-red-600 hover:text-white cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Đăng Xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {bannerNotice && (
        <div
          className={`fixed top-22 right-5 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-xs font-bold shadow-2xl border ${
            bannerNotice.type === 'success'
              ? 'bg-[#0F1E19] text-[#E6C770] border-[#C59B27]'
              : 'bg-red-950 text-red-200 border-red-500'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{bannerNotice.message}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DED6C3] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('plots')}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'plots'
                  ? 'bg-[#0F1E19] text-[#E6C770] shadow-md'
                  : 'bg-white text-stone-700 border border-[#DED6C3] hover:bg-stone-100'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>1. Quản Lý Lô Đất & Upload Ảnh/Video ({plots.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSettingsForm(settings);
                setActiveTab('settings');
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#0F1E19] text-[#E6C770] shadow-md'
                  : 'bg-white text-stone-700 border border-[#DED6C3] hover:bg-stone-100'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>2. Tùy Chỉnh Trang Web & Số Zalo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSettingsForm(settings);
                setActiveTab('security');
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#0F1E19] text-[#E6C770] shadow-md'
                  : 'bg-white text-stone-700 border border-[#DED6C3] hover:bg-stone-100'
              }`}
            >
              <KeyRound className="h-4 w-4" />
              <span>3. Tài Khoản & Mật Khẩu Admin</span>
            </button>
          </div>

          {activeTab === 'plots' && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#C59B27] px-5 py-3 text-xs sm:text-sm font-extrabold text-[#0B1612] shadow-md transition hover:bg-[#D5AD36] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Lô Đất Mới</span>
            </button>
          )}
        </div>

        {/* TAB 1: LAND PLOTS MANAGEMENT */}
        {activeTab === 'plots' && (
          <div className="space-y-6">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-[#DED6C3] bg-white p-5">
                <span className="text-xs font-semibold text-stone-500">Tổng Số Lô Đất</span>
                <div className="font-tech text-3xl font-extrabold text-[#0F1E19] mt-1">
                  {stats.total}
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/60 p-5">
                <span className="text-xs font-semibold text-emerald-800">Đang Mở Bán</span>
                <div className="font-tech text-3xl font-extrabold text-emerald-700 mt-1">
                  {stats.available}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-500/30 bg-amber-50/60 p-5">
                <span className="text-xs font-semibold text-amber-800">Đã Nhận Cọc</span>
                <div className="font-tech text-3xl font-extrabold text-amber-700 mt-1">
                  {stats.reserved}
                </div>
              </div>
              <div className="rounded-2xl border border-stone-300 bg-stone-100/80 p-5">
                <span className="text-xs font-semibold text-stone-600">Đã Giao Dịch</span>
                <div className="font-tech text-3xl font-extrabold text-stone-700 mt-1">
                  {stats.sold}
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#DED6C3]">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nhanh theo mã lô, tiêu đề hoặc khu vực..."
                  className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] pl-10 pr-4 py-2.5 text-sm focus:border-[#0F1E19] focus:outline-none"
                />
              </div>
              <div className="text-xs text-stone-500">
                Mẹo: Bạn có thể đổi trạng thái <strong className="text-[#0F1E19]">Đang bán / Đã cọc / Đã bán</strong> trực tiếp trên từng dòng.
              </div>
            </div>

            {/* Plots List Table */}
            <div className="overflow-hidden rounded-3xl border border-[#DED6C3] bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#DED6C3] bg-[#0F1E19] text-xs font-bold uppercase tracking-wider text-[#E6C770]">
                      <th className="py-4 px-4">Ảnh / Mã Lô</th>
                      <th className="py-4 px-4">Thông Tin Lô Đất</th>
                      <th className="py-4 px-4">Giá & Diện Tích</th>
                      <th className="py-4 px-4">Media</th>
                      <th className="py-4 px-4">Trạng Thái</th>
                      <th className="py-4 px-4 text-right">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DED6C3] text-sm">
                    {filteredPlots.map((plot) => (
                      <tr key={plot.id} className="hover:bg-[#FAF8F5] transition">
                        <td className="py-4 px-4 whitespace-nowrap min-w-[185px]">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                plot.images?.[0] ||
                                'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80'
                              }
                              alt={plot.code}
                              className="h-14 w-20 flex-shrink-0 rounded-xl object-cover border border-[#DED6C3]"
                            />
                            <div className="flex-shrink-0">
                              <span className="font-tech rounded-md bg-[#0F1E19] px-2 py-0.5 text-xs font-bold text-[#E6C770]">
                                {plot.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleFeatured(plot)}
                                title="Bấm để ghim/bỏ ghim Lô Hoa Hậu"
                                className={`mt-1.5 flex items-center gap-1 text-[11px] font-bold cursor-pointer ${
                                  plot.is_featured ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
                                }`}
                              >
                                <Star
                                  className={`h-3.5 w-3.5 ${
                                    plot.is_featured ? 'fill-amber-500 text-amber-500' : ''
                                  }`}
                                />
                                {plot.is_featured ? 'Lô Hoa Hậu' : 'Ghim nổi bật'}
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 max-w-md">
                          <div className="font-bold text-[#0F1E19] line-clamp-1">{plot.title}</div>
                          <div className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">
                              {plot.location_name}
                              {plot.province ? `, ${plot.province}` : ''}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {plot.category} · Hướng {plot.direction} · {plot.road_width}
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-tech text-base font-extrabold text-emerald-800">
                            {plot.price_display}
                          </div>
                          <div className="font-tech text-xs text-stone-600">
                            {plot.area_m2} m² ({plot.dimensions})
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-xs">
                          <div className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 font-semibold text-stone-700 mr-1.5">
                            <ImageIcon className="h-3.5 w-3.5 text-emerald-700" />
                            {plot.images?.length || 0} ảnh
                          </div>
                          <div className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 font-semibold text-stone-700">
                            <Film className="h-3.5 w-3.5 text-red-600" />
                            {plot.videos?.length || 0} video
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <select
                            value={plot.status}
                            onChange={(e) =>
                              handleQuickStatusChange(plot, e.target.value as PlotStatus)
                            }
                            aria-label={`Trạng thái lô ${plot.code}`}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer ${
                              plot.status === 'available'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : plot.status === 'reserved'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-stone-200 text-stone-700 border-stone-300'
                            }`}
                          >
                            <option value="available">Đang mở bán</option>
                            <option value="reserved">Đã nhận cọc</option>
                            <option value="sold">Đã bán</option>
                          </select>
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(plot)}
                              className="inline-flex items-center gap-1 rounded-xl bg-[#0F1E19] px-3.5 py-2 text-xs font-bold text-[#E6C770] hover:bg-[#19322A] cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Sửa / Ảnh
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlot(plot)}
                              className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                              title="Xóa lô đất"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMIZE WEBSITE & BROKER INFO */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSiteSettings} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Left Column: Broker Profile & Zalo Settings */}
              <div className="lg:col-span-6 rounded-3xl border border-[#DED6C3] bg-white p-6 sm:p-8 space-y-6">
                <div className="border-b border-stone-100 pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8C7335]">
                    Thông Tin Chuyển Đổi Khách Hàng
                  </span>
                  <h2 className="font-display text-2xl font-bold text-[#0F1E19] mt-1">
                    Hồ Sơ Chuyên Viên (Cò Đất) & Liên Kết Zalo
                  </h2>
                </div>

                {/* Broker Avatar Upload */}
                <div className="flex items-center gap-5 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EDE6D6]">
                  <img
                    src={settingsForm.broker_avatar}
                    alt={settingsForm.broker_name}
                    className="h-20 w-20 rounded-full object-cover border-2 border-[#C59B27]"
                  />
                  <div className="space-y-2 flex-1">
                    <label className="block text-xs font-bold text-[#0F1E19]">
                      Ảnh Đại Diện Của Bạn
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F1E19] px-3.5 py-2 text-xs font-bold text-[#E6C770] cursor-pointer hover:bg-[#19322A]">
                        <Upload className="h-3.5 w-3.5" />
                        <span>{uploadingSiteImage ? 'Đang tải...' : 'Tải ảnh từ máy'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSiteAssetUpload(e, 'broker_avatar')}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="url"
                        value={settingsForm.broker_avatar}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, broker_avatar: e.target.value })
                        }
                        placeholder="Hoặc dán link ảnh..."
                        className="flex-1 min-w-[160px] rounded-xl border border-[#DED6C3] bg-white px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Tên Của Bạn (Hiển thị trên web)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.broker_name}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, broker_name: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2.5 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Danh Xưng / Chức Danh
                    </label>
                    <input
                      type="text"
                      value={settingsForm.broker_title}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, broker_title: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                  <div>
                    <label className="block text-xs font-extrabold text-[#0068FF] mb-1.5">
                      Số Điện Thoại Zalo (Chuyển hướng khách)
                    </label>
                    <input
                      type="tel"
                      value={settingsForm.zalo_phone}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, zalo_phone: e.target.value })
                      }
                      placeholder="VD: 0909123456"
                      className="w-full rounded-xl border border-blue-300 bg-white px-3.5 py-2.5 text-sm font-tech font-bold text-[#0F1E19]"
                    />
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      Link đích: https://zalo.me/{settingsForm.zalo_phone.replace(/[^0-9]/g, '')}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Số Hotline Hiển Thị
                    </label>
                    <input
                      type="text"
                      value={settingsForm.hotline}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, hotline: e.target.value })
                      }
                      placeholder="VD: 0909 123 456"
                      className="w-full rounded-xl border border-[#DED6C3] bg-white px-3.5 py-2.5 text-sm font-tech font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Lời Giới Thiệu Bản Thân & Cam Kết Uy Tín
                  </label>
                  <textarea
                    rows={3}
                    value={settingsForm.broker_bio}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, broker_bio: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] p-3.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Mẫu Tin Nhắn Tự Động Sao Chép Khi Khách Ấn "Liên Hệ Ngay"
                  </label>
                  <textarea
                    rows={2}
                    value={settingsForm.zalo_greeting_template}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        zalo_greeting_template: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] p-3.5 text-xs font-medium"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Biến tự động thay thế: <code>{'{code}'}</code> (Mã lô), <code>{'{title}'}</code> (Tên lô), <code>{'{price}'}</code> (Giá bán).
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Địa Chỉ Văn Phòng / Khu Vực Hoạt Động
                    </label>
                    <input
                      type="text"
                      value={settingsForm.office_address}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, office_address: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Email Liên Hệ
                    </label>
                    <input
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, email: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Website Branding & Hero Content */}
              <div className="lg:col-span-6 rounded-3xl border border-[#DED6C3] bg-white p-6 sm:p-8 space-y-6">
                <div className="border-b border-stone-100 pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8C7335]">
                    Giao Diện & Thương Hiệu
                  </span>
                  <h2 className="font-display text-2xl font-bold text-[#0F1E19] mt-1">
                    Tùy Chỉnh Tiêu Đề Website & Banner Đầu Trang
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Tên Thương Hiệu / Tên Trang Web
                    </label>
                    <input
                      type="text"
                      value={settingsForm.brand_name}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, brand_name: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2.5 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Khẩu Hiệu (Tagline thanh trên cùng)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.brand_tagline}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, brand_tagline: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Dòng Nhãn Nổi Bật (Hero Badge)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.hero_badge}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, hero_badge: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Tiêu Đề Lớn Đầu Trang (Hero Title)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.hero_title}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, hero_title: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2.5 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Mô Tả Ngắn Đầu Trang (Hero Subtitle)
                  </label>
                  <textarea
                    rows={3}
                    value={settingsForm.hero_subtitle}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] p-3.5 text-sm"
                  />
                </div>

                {/* Hero Cover Image Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-700">
                    Ảnh Nền Banner Đầu Trang (Hero Image)
                  </label>
                  <div className="flex items-center gap-4">
                    <img
                      src={settingsForm.hero_image}
                      alt="Hero preview"
                      className="h-16 w-28 rounded-xl object-cover border border-[#DED6C3]"
                    />
                    <div className="flex-1 space-y-2">
                      <label className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F1E19] px-3.5 py-2 text-xs font-bold text-[#E6C770] cursor-pointer">
                        <Upload className="h-3.5 w-3.5" />
                        <span>{uploadingSiteImage ? 'Đang tải...' : 'Tải ảnh nền mới'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSiteAssetUpload(e, 'hero_image')}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="url"
                        value={settingsForm.hero_image}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, hero_image: e.target.value })
                        }
                        className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 3 Trust Counters */}
                <div className="pt-2 border-t border-stone-100">
                  <label className="block text-xs font-bold text-stone-700 mb-3">
                    3 Chỉ Số Uy Tín Trên Banner
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EDE6D6] space-y-1.5">
                      <input
                        type="text"
                        value={settingsForm.stat_1_value}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, stat_1_value: e.target.value })
                        }
                        className="w-full rounded-lg border border-[#DED6C3] bg-white px-2.5 py-1 text-sm font-tech font-bold"
                      />
                      <input
                        type="text"
                        value={settingsForm.stat_1_label}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, stat_1_label: e.target.value })
                        }
                        className="w-full rounded-lg border border-[#DED6C3] bg-white px-2.5 py-1 text-xs"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EDE6D6] space-y-1.5">
                      <input
                        type="text"
                        value={settingsForm.stat_2_value}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, stat_2_value: e.target.value })
                        }
                        className="w-full rounded-lg border border-[#DED6C3] bg-white px-2.5 py-1 text-sm font-tech font-bold"
                      />
                      <input
                        type="text"
                        value={settingsForm.stat_2_label}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, stat_2_label: e.target.value })
                        }
                        className="w-full rounded-lg border border-[#DED6C3] bg-white px-2.5 py-1 text-xs"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EDE6D6] space-y-1.5">
                      <input
                        type="text"
                        value={settingsForm.stat_3_value}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, stat_3_value: e.target.value })
                        }
                        className="w-full rounded-lg border border-[#DED6C3] bg-white px-2.5 py-1 text-sm font-tech font-bold"
                      />
                      <input
                        type="text"
                        value={settingsForm.stat_3_label}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, stat_3_label: e.target.value })
                        }
                        className="w-full rounded-lg border border-[#DED6C3] bg-white px-2.5 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0F1E19] px-8 py-4 text-sm font-bold text-[#E6C770] shadow-lg transition hover:bg-[#19322A] disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>
                  {savingSettings
                    ? 'Đang lưu cấu hình...'
                    : 'Lưu Toàn Bộ Cấu Hình Trang Web'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: ADMIN CREDENTIALS */}
        {activeTab === 'security' && (
          <form
            onSubmit={handleSaveSiteSettings}
            className="max-w-xl mx-auto rounded-3xl border border-[#DED6C3] bg-white p-6 sm:p-8 space-y-6"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C7335]">
                Bảo Mật Trang Quản Trị Ẩn (/login)
              </span>
              <h2 className="font-display text-2xl font-bold text-[#0F1E19] mt-1">
                Thay Đổi Tài Khoản & Mật Khẩu Admin
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Thông tin này được dùng khi bạn truy cập đường dẫn ẩn <code>/login</code>.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Tài Khoản Đăng Nhập Admin Mới
                </label>
                <div className="relative">
                  <UserCheck className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={settingsForm.admin_username || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, admin_username: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] pl-10 pr-4 py-3 text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Mật Khẩu Đăng Nhập Admin Mới
                </label>
                <div className="relative">
                  <KeyRound className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={settingsForm.admin_password || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, admin_password: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] pl-10 pr-4 py-3 text-sm font-tech font-bold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F1E19] px-6 py-3.5 text-sm font-bold text-[#E6C770] shadow-md hover:bg-[#19322A] cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{savingSettings ? 'Đang cập nhật...' : 'Cập Nhật Tài Khoản Admin'}</span>
            </button>
          </form>
        )}
      </main>

      {/* MODAL ADD / EDIT LAND PLOT */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
          <div className="my-auto w-full max-w-4xl rounded-3xl border border-[#DED6C3] bg-[#FAF8F5] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#DED6C3] bg-[#0F1E19] px-6 py-4 text-white">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#E6C770]">
                  {editingPlotId ? 'Chỉnh Sửa Thông Tin Lô Đất' : 'Thêm Lô Đất Mới Vào Giỏ Hàng'}
                </span>
                <h3 className="font-display text-2xl font-bold">
                  {editingPlotId ? `Lô ${plotForm.code}: ${plotForm.title}` : 'Nhập Hồ Sơ Lô Đất Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSavePlot} className="overflow-y-auto p-6 space-y-6">
              {/* Row 1: Basic Identification */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 bg-white p-5 rounded-2xl border border-[#DED6C3]">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Mã Lô Đất *
                  </label>
                  <input
                    type="text"
                    required
                    value={plotForm.code}
                    onChange={(e) => setPlotForm({ ...plotForm, code: e.target.value })}
                    placeholder="VD: LK-01"
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3 py-2 text-sm font-tech font-bold"
                  />
                </div>

                <div className="sm:col-span-9">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tiêu Đề Giới Thiệu Lô Đất *
                  </label>
                  <input
                    type="text"
                    required
                    value={plotForm.title}
                    onChange={(e) => setPlotForm({ ...plotForm, title: e.target.value })}
                    placeholder="VD: Lô Góc 2 Mặt Tiền Khu Đô Thị Sinh Thái Ven Sông"
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2 text-sm font-bold"
                  />
                </div>

                <div className="sm:col-span-12">
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Mô Tả Ngắn (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={plotForm.subtitle}
                    onChange={(e) => setPlotForm({ ...plotForm, subtitle: e.target.value })}
                    placeholder="VD: Đối diện công viên trung tâm, sổ hồng sẵn công chứng ngay"
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Pricing, Dimensions & Legal */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 bg-white p-5 rounded-2xl border border-[#DED6C3]">
                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    Giá Hiển Thị * (VD: 2.45 Tỷ / 980 Triệu)
                  </label>
                  <input
                    type="text"
                    required
                    value={plotForm.price_display}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, price_display: e.target.value })
                    }
                    className="w-full rounded-xl border border-emerald-400 bg-emerald-50/40 px-3.5 py-2 text-sm font-tech font-bold text-emerald-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Giá Quy Đổi Tỷ (Số để lọc, VD: 2.45)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={plotForm.price_billion}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, price_billion: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2 text-sm font-tech"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Đơn Giá / m² (VD: 16.3 Triệu/m²)
                  </label>
                  <input
                    type="text"
                    value={plotForm.price_per_m2}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, price_per_m2: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2 text-sm font-tech"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Diện Tích (m²) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={plotForm.area_m2}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, area_m2: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2 text-sm font-tech font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Kích Thước (Ngang × Dài)
                  </label>
                  <input
                    type="text"
                    value={plotForm.dimensions}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, dimensions: e.target.value })
                    }
                    placeholder="VD: 6m × 25m"
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2 text-sm font-tech"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Hướng Đất
                  </label>
                  <select
                    value={plotForm.direction}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, direction: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3 py-2 text-sm font-semibold"
                  >
                    {LAND_DIRECTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Đường Trước Đất / Lộ Giới
                  </label>
                  <input
                    type="text"
                    value={plotForm.road_width}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, road_width: e.target.value })
                    }
                    placeholder="VD: Đường nhựa 12m, vỉa hè 3m"
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Phân Loại Đất
                  </label>
                  <select
                    value={plotForm.category}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, category: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3 py-2 text-sm font-semibold"
                  >
                    {LAND_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tình Trạng Pháp Lý
                  </label>
                  <input
                    type="text"
                    value={plotForm.legal_status}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, legal_status: e.target.value })
                    }
                    placeholder="VD: Sổ hồng riêng - Thổ cư 100%"
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Row 3: Location & Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 bg-white p-5 rounded-2xl border border-[#DED6C3]">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Địa Chỉ / Khu Vực *
                  </label>
                  <input
                    type="text"
                    required
                    value={plotForm.location_name}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, location_name: e.target.value })
                    }
                    placeholder="VD: KĐT Nam Hòa Xuân, Cẩm Lệ"
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tỉnh / Thành Phố
                  </label>
                  <input
                    type="text"
                    value={plotForm.province}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, province: e.target.value })
                    }
                    placeholder="VD: Đà Nẵng / Đồng Nai / Lâm Đồng"
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Link Định Vị Google Maps
                  </label>
                  <input
                    type="url"
                    value={plotForm.map_url}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, map_url: e.target.value })
                    }
                    placeholder="https://maps.google.com/..."
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Trạng Thái Mở Bán
                  </label>
                  <select
                    value={plotForm.status}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, status: e.target.value as PlotStatus })
                    }
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3 py-2 text-sm font-bold"
                  >
                    <option value="available">Đang mở bán</option>
                    <option value="reserved">Đã nhận cọc</option>
                    <option value="sold">Đã bán</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center pt-5">
                  <label className="inline-flex items-center gap-2.5 text-sm font-bold text-[#0F1E19] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plotForm.is_featured}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, is_featured: e.target.checked })
                      }
                      className="h-4 w-4 rounded accent-[#C59B27]"
                    />
                    <span>Ghim lô đất này làm "Lô Hoa Hậu / Nổi Bật" lên đầu trang web</span>
                  </label>
                </div>
              </div>

              {/* Row 4: UPLOAD IMAGES & VIDEOS */}
              <div className="bg-white p-5 rounded-2xl border border-[#DED6C3] space-y-5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0F1E19] uppercase tracking-wider">
                      Hình Ảnh & Video Thực Tế Lô Đất (Supabase Storage)
                    </h4>
                    <p className="text-xs text-stone-500">
                      Tải trực tiếp nhiều ảnh/video từ điện thoại hoặc máy tính của bạn, hoặc dán link ảnh/video.
                    </p>
                  </div>
                  {uploadingMedia && (
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải tệp lên Supabase...
                    </span>
                  )}
                </div>

                {/* Images Upload Section */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-emerald-700" />
                      Danh Sách Hình Ảnh ({plotForm.images.length} ảnh)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F1E19] px-4 py-2 text-xs font-bold text-[#E6C770] cursor-pointer hover:bg-[#19322A]">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Tải Ảnh Từ Máy Tính / Điện Thoại</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Add Image by URL */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Hoặc dán đường dẫn URL hình ảnh vào đây rồi bấm Thêm..."
                      className="flex-1 rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newImageUrl.trim()) return;
                        setPlotForm((prev) => ({
                          ...prev,
                          images: [...prev.images, newImageUrl.trim()],
                        }));
                        setNewImageUrl('');
                      }}
                      className="rounded-xl border border-[#0F1E19] px-4 py-2 text-xs font-bold text-[#0F1E19] hover:bg-[#0F1E19] hover:text-white cursor-pointer"
                    >
                      Thêm Link Ảnh
                    </button>
                  </div>

                  {/* Image Preview Grid */}
                  {plotForm.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                      {plotForm.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="group relative aspect-[16/10] rounded-xl overflow-hidden border border-[#DED6C3] bg-stone-100"
                        >
                          <img
                            src={img}
                            alt={`Ảnh ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          {idx === 0 && (
                            <span className="absolute bottom-1.5 left-1.5 rounded bg-[#0F1E19]/85 px-2 py-0.5 text-[10px] font-bold text-[#E6C770]">
                              Ảnh Bìa Chính
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setPlotForm((prev) => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== idx),
                              }))
                            }
                            className="absolute top-1.5 right-1.5 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700 cursor-pointer"
                            title="Xóa ảnh này"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Videos Upload Section */}
                <div className="space-y-3 pt-4 border-t border-stone-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Film className="h-4 w-4 text-red-600" />
                      Danh Sách Video Quay Thực Tế ({plotForm.videos.length} video)
                    </label>
                    <label className="inline-flex items-center gap-1.5 rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white cursor-pointer hover:bg-red-800">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Tải Video (.mp4, .mov) Từ Máy</span>
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Add Video by URL */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="Hoặc dán đường dẫn URL file video (.mp4) vào đây..."
                      className="flex-1 rounded-xl border border-[#DED6C3] bg-[#FAF8F5] px-3.5 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newVideoUrl.trim()) return;
                        setPlotForm((prev) => ({
                          ...prev,
                          videos: [...prev.videos, newVideoUrl.trim()],
                        }));
                        setNewVideoUrl('');
                      }}
                      className="rounded-xl border border-[#0F1E19] px-4 py-2 text-xs font-bold text-[#0F1E19] hover:bg-[#0F1E19] hover:text-white cursor-pointer"
                    >
                      Thêm Link Video
                    </button>
                  </div>

                  {plotForm.videos.length > 0 && (
                    <div className="space-y-2">
                      {plotForm.videos.map((vUrl, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 rounded-xl bg-[#FAF8F5] px-3.5 py-2 border border-[#DED6C3] text-xs"
                        >
                          <span className="truncate font-mono text-stone-700">
                            Video #{idx + 1}: {vUrl}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPlotForm((prev) => ({
                                ...prev,
                                videos: prev.videos.filter((_, i) => i !== idx),
                              }))
                            }
                            className="text-red-600 font-bold hover:underline flex-shrink-0 cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 5: Description & Highlights */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-white p-5 rounded-2xl border border-[#DED6C3]">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Mô Tả Chi Tiết Lô Đất
                  </label>
                  <textarea
                    rows={5}
                    value={plotForm.description}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, description: e.target.value })
                    }
                    placeholder="Mô tả chi tiết vị trí, tiện ích xung quanh, tiềm năng tăng giá, dân cư..."
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Các Điểm Mạnh Nổi Bật (Mỗi dòng 1 ý)
                  </label>
                  <textarea
                    rows={5}
                    value={highlightsText}
                    onChange={(e) => setHighlightsText(e.target.value)}
                    placeholder={`Lô góc 2 mặt tiền thoáng mát\nSổ hồng riêng công chứng ngay\nCách chợ và trường học 300m`}
                    className="w-full rounded-xl border border-[#DED6C3] bg-[#FAF8F5] p-3 text-sm"
                  />
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-xl border border-stone-300 bg-white px-5 py-3 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingPlot || uploadingMedia}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0F1E19] px-7 py-3 text-xs sm:text-sm font-bold text-[#E6C770] shadow-lg hover:bg-[#19322A] disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {savingPlot
                      ? 'Đang lưu lên Supabase...'
                      : editingPlotId
                      ? 'Lưu Thay Đổi Lô Đất'
                      : 'Đăng Lô Đất Lên Web'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
