import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  Globe,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Plus,
  Save,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  changeAdminPassword,
  createLandPlot,
  deleteLandPlot,
  updateLandPlot,
  updateSiteSettings,
  uploadMediaFile,
} from './supabase';
import {
  LAND_CATEGORIES,
  LAND_DIRECTIONS,
  LandPlot,
  PlotStatus,
  SiteSettings,
} from './types';

interface AdminPageProps {
  settings: SiteSettings;
  plots: LandPlot[];
  onRefreshData: () => Promise<void>;
  onLogout: () => void;
}

const EMPTY_PLOT_FORM: Omit<LandPlot, 'id' | 'created_at'> = {
  code: '',
  title: '',
  subtitle: '',
  price_display: '',
  price_billion: 0,
  price_per_m2: '',
  area_m2: 0,
  dimensions: '',
  direction: '',
  road_width: '',
  legal_status: '',
  category: LAND_CATEGORIES[0],
  status: 'available',
  is_featured: true,
  location_name: '',
  province: '',
  map_url: '',
  map_embed_coords: '',
  description: '',
  highlights: [],
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

  // Plot Modal Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPlotId, setEditingPlotId] = useState<string | null>(null);
  const [editingOriginalPlot, setEditingOriginalPlot] = useState<LandPlot | null>(null);
  const [plotForm, setPlotForm] =
    useState<Omit<LandPlot, 'id' | 'created_at'>>(EMPTY_PLOT_FORM);
  const [highlightsText, setHighlightsText] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [savingPlot, setSavingPlot] = useState(false);

  // Site Settings Form State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingSiteImage, setUploadingSiteImage] = useState(false);

  // Admin Password Change State (Password only, no username field)
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showAdminPasswords, setShowAdminPasswords] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setBannerNotice({ type, message });
    setTimeout(() => {
      setBannerNotice((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const openCreateModal = () => {
    setEditingPlotId(null);
    setEditingOriginalPlot(null);
    setPlotForm({
      ...EMPTY_PLOT_FORM,
      code: `LK-${String(plots.length + 1).padStart(2, '0')}`,
    });
    setHighlightsText('');
    setNewImageUrl('');
    setNewVideoUrl('');
    setIsEditorOpen(true);
  };

  const openEditModal = (plot: LandPlot) => {
    setEditingPlotId(plot.id);
    setEditingOriginalPlot(plot);
    setPlotForm({
      code: plot.code || '',
      title: plot.title || '',
      subtitle: plot.subtitle || '',
      price_display: plot.price_display || '',
      price_billion: plot.price_billion || 0,
      price_per_m2: plot.price_per_m2 || '',
      area_m2: plot.area_m2 || 0,
      dimensions: plot.dimensions || '',
      direction: plot.direction || '',
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
    for (let i = 0; i < files.length; i++) {
      const { url, error } = await uploadMediaFile(files[i], 'images');
      if (url) {
        uploadedUrls.push(url);
      } else if (error) {
        showNotice('error', `Lỗi tải ảnh: ${error}`);
      }
    }

    if (uploadedUrls.length > 0) {
      setPlotForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
      showNotice('success', `Đã tải lên ${uploadedUrls.length} hình ảnh.`);
    }
    setUploadingMedia(false);
    e.target.value = '';
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingMedia(true);

    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const { url, error } = await uploadMediaFile(files[i], 'videos');
      if (url) {
        uploadedUrls.push(url);
      } else if (error) {
        showNotice('error', `Lỗi tải video: ${error}`);
      }
    }

    if (uploadedUrls.length > 0) {
      setPlotForm((prev) => ({
        ...prev,
        videos: [...prev.videos, ...uploadedUrls],
      }));
      showNotice('success', `Đã tải lên ${uploadedUrls.length} video.`);
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
      code: plotForm.code.trim(),
      title: plotForm.title.trim(),
      subtitle: plotForm.subtitle.trim(),
      price_display: plotForm.price_display.trim(),
      price_billion: Number(plotForm.price_billion) || 0,
      price_per_m2: plotForm.price_per_m2.trim(),
      area_m2: Number(plotForm.area_m2) || 0,
      dimensions: plotForm.dimensions.trim(),
      direction: plotForm.direction.trim(),
      road_width: plotForm.road_width.trim(),
      legal_status: plotForm.legal_status.trim(),
      location_name: plotForm.location_name.trim(),
      province: plotForm.province.trim(),
      map_url: plotForm.map_url.trim(),
      description: plotForm.description.trim(),
      highlights: parsedHighlights,
      images: plotForm.images.filter(Boolean),
      videos: plotForm.videos.filter(Boolean),
    };

    if (editingPlotId) {
      const { error } = await updateLandPlot(editingPlotId, payload, editingOriginalPlot);
      if (error) {
        showNotice('error', `Không thể cập nhật lô đất: ${error}`);
      } else {
        await onRefreshData();
        setIsEditorOpen(false);
        showNotice('success', `Đã cập nhật lô đất ${payload.code} thành công.`);
      }
    } else {
      const { error } = await createLandPlot(payload);
      if (error) {
        showNotice('error', `Không thể thêm lô đất mới: ${error}`);
      } else {
        await onRefreshData();
        setIsEditorOpen(false);
        showNotice('success', `Đã thêm lô đất mới ${payload.code} thành công.`);
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
      showNotice('success', `Đã cập nhật trạng thái lô ${plot.code}.`);
    }
  };

  const handleToggleFeatured = async (plot: LandPlot) => {
    const { error } = await updateLandPlot(plot.id, { is_featured: !plot.is_featured });
    if (!error) {
      await onRefreshData();
      showNotice(
        'success',
        plot.is_featured
          ? `Đã bỏ ghim nổi bật lô ${plot.code}.`
          : `Đã ghim nổi bật lô ${plot.code}.`
      );
    }
  };

  const handleDeletePlot = async (plot: LandPlot) => {
    const confirmed = window.confirm(
      `Xác nhận xóa vĩnh viễn lô đất "${plot.code} - ${plot.title}"?`
    );
    if (!confirmed) return;

    const { error } = await deleteLandPlot(plot);
    if (error) {
      showNotice('error', `Lỗi xóa lô đất: ${error}`);
    } else {
      await onRefreshData();
      showNotice('success', `Đã xóa lô đất ${plot.code}.`);
    }
  };

  const handleSiteAssetUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'broker_avatar' | 'hero_image' | 'favicon_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSiteImage(true);
    const { url, error } = await uploadMediaFile(file, 'site');
    if (url) {
      setSettingsForm((prev) => ({ ...prev, [field]: url }));
      showNotice('success', 'Đã tải ảnh lên. Nhấn "Lưu Cấu Hình" để áp dụng.');
    } else if (error) {
      showNotice('error', `Lỗi tải ảnh: ${error}`);
    }
    setUploadingSiteImage(false);
    e.target.value = '';
  };

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    const { error } = await updateSiteSettings(settingsForm, settings);
    if (error) {
      showNotice('error', `Lỗi lưu cài đặt: ${error}`);
    } else {
      await onRefreshData();
      showNotice('success', 'Đã lưu toàn bộ thông tin trang web.');
    }
    setSavingSettings(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      showNotice('error', 'Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (newPassword.length < 8) {
      showNotice('error', 'Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showNotice('error', 'Mật khẩu mới và nhập lại mật khẩu mới không khớp.');
      return;
    }

    setSavingCredentials(true);
    const result = await changeAdminPassword(oldPassword, newPassword);
    if (!result.success) {
      showNotice('error', result.error || 'Không thể đổi mật khẩu.');
    } else {
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showNotice('success', 'Đã đổi mật khẩu thành công.');
    }
    setSavingCredentials(false);
  };

  const filteredPlots = plots.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.code || '').toLowerCase().includes(q) ||
      (p.title || '').toLowerCase().includes(q) ||
      (p.location_name || '').toLowerCase().includes(q) ||
      (p.province || '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total: plots.length,
    available: plots.filter((p) => p.status === 'available').length,
    reserved: plots.filter((p) => p.status === 'reserved').length,
    sold: plots.filter((p) => p.status === 'sold').length,
  };

  return (
    <div className="min-h-screen w-full bg-[#F1F5F9] text-slate-900 flex flex-col">
      {/* Top Admin Navbar - Full Width */}
      <header className="sticky top-0 z-30 w-full bg-[#0F172A] text-white border-b border-slate-800 shadow-md">
        <div className="w-full px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-lg sm:text-xl font-extrabold text-white leading-tight">
                QUẢN TRỊ · {settings.brand_name}
              </div>
              <div className="text-xs text-amber-400 font-semibold mt-0.5">
                Zalo: {settings.zalo_phone}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition hover:bg-white/20"
            >
              <ExternalLink className="h-4 w-4 text-amber-400" />
              <span>Xem Trang Khách Hàng</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                onLogout();
                navigate('/login');
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition hover:bg-red-700 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng Xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {bannerNotice && (
        <div
          className={`fixed top-24 right-6 z-50 flex items-center gap-3 rounded-2xl px-6 py-4 text-sm font-bold shadow-2xl border ${
            bannerNotice.type === 'success'
              ? 'bg-slate-900 text-amber-400 border-amber-400/50'
              : 'bg-red-950 text-red-200 border-red-500'
          }`}
        >
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{bannerNotice.message}</span>
        </div>
      )}

      {/* Main Full-Width Content Area (No wasted left/right margins) */}
      <main className="w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6 flex-1">
        {/* Top Action & Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('plots')}
              className={`inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-extrabold transition cursor-pointer ${
                activeTab === 'plots'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>1. Quản Lý Lô Đất ({plots.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSettingsForm(settings);
                setActiveTab('settings');
              }}
              className={`inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-extrabold transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>2. Tùy Chỉnh Trang Web & Zalo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-extrabold transition cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <KeyRound className="h-4 w-4" />
              <span>3. Đổi Mật Khẩu Admin</span>
            </button>
          </div>

          {activeTab === 'plots' && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-md shadow-amber-500/20 transition hover:bg-amber-400 cursor-pointer"
            >
              <Plus className="h-5 w-5" />
              <span>Thêm Lô Đất Mới</span>
            </button>
          )}
        </div>

        {/* TAB 1: LAND PLOTS MANAGEMENT */}
        {activeTab === 'plots' && (
          <div className="space-y-6">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                  Tổng Số Lô Đất
                </span>
                <div className="font-tech text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1.5">
                  {stats.total}
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                <span className="text-xs sm:text-sm font-bold text-emerald-800 uppercase tracking-wider">
                  Đang Mở Bán
                </span>
                <div className="font-tech text-3xl sm:text-4xl font-extrabold text-emerald-700 mt-1.5">
                  {stats.available}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
                <span className="text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Đã Nhận Cọc
                </span>
                <div className="font-tech text-3xl sm:text-4xl font-extrabold text-amber-700 mt-1.5">
                  {stats.reserved}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-300 bg-slate-200/60 p-5">
                <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Đã Giao Dịch
                </span>
                <div className="font-tech text-3xl sm:text-4xl font-extrabold text-slate-800 mt-1.5">
                  {stats.sold}
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="relative w-full">
                <Search className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã lô, tiêu đề hoặc khu vực..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 py-3 text-sm font-medium focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Plots List Table - Fixed Layout on Desktop so ZERO horizontal scrollbar */}
            <div
              tabIndex={0}
              role="region"
              aria-label="Danh sách quản lý lô đất"
              className="w-full overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs"
            >
              <table className="w-full lg:table-fixed text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-900 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                    <th className="py-4 px-4 lg:w-[190px]">Ảnh / Mã Lô</th>
                    <th className="py-4 px-4 lg:w-[33%]">Thông Tin Lô Đất</th>
                    <th className="py-4 px-4 lg:w-[17%]">Giá Bán & Diện Tích</th>
                    <th className="py-4 px-4 lg:w-[160px]">Hình Ảnh / Video</th>
                    <th className="py-4 px-4 lg:w-[155px]">Trạng Thái</th>
                    <th className="py-4 px-4 lg:w-[180px] text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm sm:text-base">
                  {filteredPlots.map((plot) => {
                    const subSpecs = [
                      plot.category,
                      plot.direction ? `Hướng ${plot.direction}` : '',
                      plot.road_width || '',
                      plot.legal_status || '',
                    ].filter(Boolean);

                    return (
                      <tr key={plot.id} className="hover:bg-slate-50 transition">
                        <td className="py-4 px-4 align-middle">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                plot.images?.[0] ||
                                'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80'
                              }
                              alt={plot.code}
                              className="h-14 w-20 flex-shrink-0 rounded-xl object-cover border border-slate-200"
                            />
                            <div className="min-w-0">
                              <span className="font-tech inline-block rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-amber-400">
                                {plot.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleFeatured(plot)}
                                className={`mt-1.5 flex items-center gap-1 text-xs font-bold cursor-pointer ${
                                  plot.is_featured
                                    ? 'text-amber-600'
                                    : 'text-slate-400 hover:text-slate-700'
                                }`}
                              >
                                <Star
                                  className={`h-3.5 w-3.5 flex-shrink-0 ${
                                    plot.is_featured ? 'fill-amber-500 text-amber-500' : ''
                                  }`}
                                />
                                <span className="truncate">
                                  {plot.is_featured ? 'Lô Nổi Bật' : 'Ghim nổi bật'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 align-middle break-words">
                          <div className="font-bold text-slate-900 text-base line-clamp-1">
                            {plot.title}
                          </div>
                          {(plot.location_name || plot.province) && (
                            <div className="text-xs sm:text-sm text-blue-700 font-semibold flex items-center gap-1 mt-1 min-w-0">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">
                                {[plot.location_name, plot.province].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                          {subSpecs.length > 0 && (
                            <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                              {subSpecs.join(' · ')}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 align-middle break-words">
                          <div className="font-tech text-base font-extrabold text-blue-700">
                            {plot.price_display?.trim() || 'Liên hệ để trao đổi'}
                          </div>
                          {(plot.area_m2 > 0 || plot.dimensions?.trim()) && (
                            <div className="font-tech text-xs sm:text-sm text-slate-600 mt-0.5">
                              {plot.area_m2 > 0 ? `${plot.area_m2} m²` : ''}
                              {plot.area_m2 > 0 && plot.dimensions?.trim()
                                ? ` (${plot.dimensions.trim()})`
                                : plot.dimensions?.trim() || ''}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 align-middle text-xs">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
                              <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                              {plot.images?.length || 0} ảnh
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
                              <Film className="h-3.5 w-3.5 text-red-600" />
                              {plot.videos?.length || 0} video
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 align-middle">
                          <select
                            value={plot.status}
                            onChange={(e) =>
                              handleQuickStatusChange(plot, e.target.value as PlotStatus)
                            }
                            aria-label={`Trạng thái lô ${plot.code}`}
                            className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm font-bold focus:outline-none cursor-pointer ${
                              plot.status === 'available'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : plot.status === 'reserved'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="available">Đang mở bán</option>
                            <option value="reserved">Đã nhận cọc</option>
                            <option value="sold">Đã bán</option>
                          </select>
                        </td>

                        <td className="py-4 px-4 align-middle text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(plot)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 cursor-pointer"
                            >
                              <Edit3 className="h-4 w-4" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlot(plot)}
                              className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-2.5 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                              aria-label={`Xóa lô ${plot.code}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: FULL WEBSITE & LEGAL FOOTER CUSTOMIZATION */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSiteSettings} className="space-y-6">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingSettings || uploadingSiteImage}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-extrabold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{savingSettings ? 'Đang lưu...' : 'Lưu Toàn Bộ Cấu Hình'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              {/* Left Column: Broker Profile, Contact & Legal Business Footer */}
              <div className="xl:col-span-6 space-y-6">
                {/* Card 1: Broker Profile & Zalo */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
                      1. Hồ Sơ Cá Nhân & Số Điện Thoại Zalo
                    </h2>
                  </div>

                  {/* Avatar Upload */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <img
                      src={settingsForm.broker_avatar}
                      alt={settingsForm.broker_name}
                      className="h-20 w-20 rounded-2xl object-cover border-2 border-blue-600 flex-shrink-0"
                    />
                    <div className="space-y-2 flex-1 w-full">
                      <label className="block text-xs font-bold text-slate-800">
                        Ảnh Đại Diện
                      </label>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <label className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white cursor-pointer hover:bg-slate-800">
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
                          placeholder="Link ảnh đại diện..."
                          className="flex-1 min-w-[180px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tên Của Bạn
                      </label>
                      <input
                        type="text"
                        value={settingsForm.broker_name}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, broker_name: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Danh Xưng / Chức Danh
                      </label>
                      <input
                        type="text"
                        value={settingsForm.broker_title}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, broker_title: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nhãn Phía Trên Tên Trong Thẻ Cá Nhân
                    </label>
                    <input
                      type="text"
                      value={settingsForm.broker_role_badge || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, broker_role_badge: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
                    <div>
                      <label className="block text-xs font-bold text-blue-800 mb-1.5">
                        Số Điện Thoại Zalo
                      </label>
                      <input
                        type="tel"
                        value={settingsForm.zalo_phone}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, zalo_phone: e.target.value })
                        }
                        className="w-full rounded-xl border border-blue-400 bg-white px-3.5 py-2.5 text-base font-tech font-extrabold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Số Điện Thoại / Hotline Hiển Thị
                      </label>
                      <input
                        type="tel"
                        value={settingsForm.hotline}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, hotline: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base font-tech font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Lời Giới Thiệu Bản Thân
                    </label>
                    <textarea
                      rows={3}
                      value={settingsForm.broker_bio}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, broker_bio: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3.5 text-sm"
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-800">
                      Thông Tin Bổ Sung Trong Thẻ Cá Nhân
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={settingsForm.broker_info_1_label || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            broker_info_1_label: e.target.value,
                          })
                        }
                        placeholder="Tiêu đề dòng 1"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm"
                      />
                      <input
                        type="text"
                        value={settingsForm.broker_info_1_value || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            broker_info_1_value: e.target.value,
                          })
                        }
                        placeholder="Nội dung dòng 1"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={settingsForm.broker_info_2_label || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            broker_info_2_label: e.target.value,
                          })
                        }
                        placeholder="Tiêu đề dòng 2"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm"
                      />
                      <input
                        type="text"
                        value={settingsForm.broker_info_2_value || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            broker_info_2_value: e.target.value,
                          })
                        }
                        placeholder="Nội dung dòng 2"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Địa Chỉ / Khu Vực
                      </label>
                      <input
                        type="text"
                        value={settingsForm.office_address}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, office_address: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Email Liên Hệ
                      </label>
                      <input
                        type="email"
                        value={settingsForm.email}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, email: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Complete Legal Business Footer & Bottom CTA */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
                      2. Tùy Chỉnh Chân Trang (Footer Chuẩn Website Kinh Doanh)
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tên Đơn Vị / Thương Hiệu Ở Chân Trang
                      </label>
                      <input
                        type="text"
                        value={settingsForm.footer_company_name || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            footer_company_name: e.target.value,
                          })
                        }
                        placeholder={settingsForm.brand_name}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Người Đại Diện / Phụ Trách
                      </label>
                      <input
                        type="text"
                        value={settingsForm.footer_representative || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            footer_representative: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Mã Số Thuế / Số GPKD / Chứng Chỉ
                      </label>
                      <input
                        type="text"
                        value={settingsForm.footer_tax_code || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            footer_tax_code: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-tech"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Giờ Làm Việc
                      </label>
                      <input
                        type="text"
                        value={settingsForm.footer_working_hours || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            footer_working_hours: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Giới Thiệu Ngắn Ở Chân Trang
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.footer_about || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, footer_about: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tiêu Đề Cột Pháp Lý & Quy Định Ở Chân Trang
                    </label>
                    <input
                      type="text"
                      value={settingsForm.footer_legal_title || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          footer_legal_title: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nội Dung Pháp Lý, Chính Sách & Quy Định Ở Chân Trang
                    </label>
                    <textarea
                      rows={3}
                      value={settingsForm.footer_legal_notice || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          footer_legal_notice: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Dòng Bản Quyền Dưới Cùng
                    </label>
                    <input
                      type="text"
                      value={settingsForm.footer_copyright || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, footer_copyright: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  {/* Bottom CTA Section Toggle & Fields */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-slate-900">
                        Khối Mời Liên Hệ Cuối Trang
                      </span>
                      <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(settingsForm.show_cta_section)}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              show_cta_section: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded accent-blue-600"
                        />
                        <span>Hiển thị</span>
                      </label>
                    </div>

                    {settingsForm.show_cta_section && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={settingsForm.cta_badge || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, cta_badge: e.target.value })
                          }
                          placeholder="Nhãn nhỏ phía trên"
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={settingsForm.cta_title || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, cta_title: e.target.value })
                          }
                          placeholder="Tiêu đề khối liên hệ"
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-bold"
                        />
                        <textarea
                          rows={2}
                          value={settingsForm.cta_description || ''}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              cta_description: e.target.value,
                            })
                          }
                          placeholder="Nội dung khối liên hệ"
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Brand, Favicon, Hero Banner & 4-Step Process */}
              <div className="xl:col-span-6 space-y-6">
                {/* Card 3: Brand, Favicon & Hero Banner */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-5">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
                      3. Thương Hiệu, Icon Trang Web & Đầu Trang
                    </h2>
                  </div>

                  {/* Website Icon (Favicon) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Icon Trang Web (Favicon Trên Tab Trình Duyệt)
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white cursor-pointer hover:bg-slate-800">
                        <Upload className="h-3.5 w-3.5" />
                        <span>{uploadingSiteImage ? 'Đang tải...' : 'Tải icon mới'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSiteAssetUpload(e, 'favicon_url')}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="url"
                        value={settingsForm.favicon_url || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, favicon_url: e.target.value })
                        }
                        placeholder="Link icon (hoặc để trống dùng icon BĐS mặc định)"
                        className="flex-1 min-w-[200px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tên Thương Hiệu / Tên Website
                      </label>
                      <input
                        type="text"
                        value={settingsForm.brand_name}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, brand_name: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Dòng Phụ Dưới Tên Thương Hiệu
                      </label>
                      <input
                        type="text"
                        value={settingsForm.brand_subtitle || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, brand_subtitle: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Thanh Thông Báo Trên Cùng
                    </label>
                    <input
                      type="text"
                      value={settingsForm.brand_tagline}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, brand_tagline: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nhãn Đầu Trang
                      </label>
                      <input
                        type="text"
                        value={settingsForm.hero_badge}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, hero_badge: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tiêu Đề Mục Danh Sách Lô Đất
                      </label>
                      <input
                        type="text"
                        value={settingsForm.plots_section_title || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            plots_section_title: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tiêu Đề Lớn Đầu Trang
                    </label>
                    <input
                      type="text"
                      value={settingsForm.hero_title}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, hero_title: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mô Tả Ngắn Đầu Trang
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.hero_subtitle}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mô Tả Dưới Tiêu Đề Danh Sách Lô Đất
                    </label>
                    <input
                      type="text"
                      value={settingsForm.plots_section_subtitle || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          plots_section_subtitle: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  {/* Hero Cover Image Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Ảnh Nền Đầu Trang
                    </label>
                    <div className="flex items-center gap-4">
                      <img
                        src={settingsForm.hero_image}
                        alt="Hero preview"
                        className="h-16 w-28 rounded-xl object-cover border border-slate-200"
                      />
                      <div className="flex-1 space-y-2">
                        <label className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white cursor-pointer">
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
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3 Optional Counters */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Số Liệu Thống Kê Trên Đầu Trang
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <input
                          type="text"
                          placeholder="Số liệu 1"
                          value={settingsForm.stat_1_value}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, stat_1_value: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-tech font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Nhãn 1"
                          value={settingsForm.stat_1_label}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, stat_1_label: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <input
                          type="text"
                          placeholder="Số liệu 2"
                          value={settingsForm.stat_2_value}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, stat_2_value: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-tech font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Nhãn 2"
                          value={settingsForm.stat_2_label}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, stat_2_label: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <input
                          type="text"
                          placeholder="Số liệu 3"
                          value={settingsForm.stat_3_value}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, stat_3_value: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-tech font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Nhãn 3"
                          value={settingsForm.stat_3_label}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, stat_3_label: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 4: Optional 4-Step Process Section */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
                      4. Mục Quy Trình 4 Bước
                    </h2>
                    <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.show_process_section)}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            show_process_section: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded accent-blue-600"
                      />
                      <span>Hiển thị</span>
                    </label>
                  </div>

                  {settingsForm.show_process_section && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={settingsForm.process_title || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, process_title: e.target.value })
                          }
                          placeholder="Tiêu đề quy trình"
                          className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm font-bold"
                        />
                        <input
                          type="text"
                          value={settingsForm.process_subtitle || ''}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              process_subtitle: e.target.value,
                            })
                          }
                          placeholder="Mô tả phụ"
                          className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <input
                            type="text"
                            value={settingsForm.step_1_title || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, step_1_title: e.target.value })
                            }
                            placeholder="Tiêu đề Bước 01"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold"
                          />
                          <textarea
                            rows={2}
                            value={settingsForm.step_1_desc || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, step_1_desc: e.target.value })
                            }
                            placeholder="Nội dung Bước 01"
                            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                          />
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <input
                            type="text"
                            value={settingsForm.step_2_title || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, step_2_title: e.target.value })
                            }
                            placeholder="Tiêu đề Bước 02"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold"
                          />
                          <textarea
                            rows={2}
                            value={settingsForm.step_2_desc || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, step_2_desc: e.target.value })
                            }
                            placeholder="Nội dung Bước 02"
                            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                          />
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <input
                            type="text"
                            value={settingsForm.step_3_title || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, step_3_title: e.target.value })
                            }
                            placeholder="Tiêu đề Bước 03"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold"
                          />
                          <textarea
                            rows={2}
                            value={settingsForm.step_3_desc || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, step_3_desc: e.target.value })
                            }
                            placeholder="Nội dung Bước 03"
                            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                          />
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <input
                            type="text"
                            value={settingsForm.step_4_title || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, step_4_title: e.target.value })
                            }
                            placeholder="Tiêu đề Bước 04"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold"
                          />
                          <textarea
                            rows={2}
                            value={settingsForm.step_4_desc || ''}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, step_4_desc: e.target.value })
                            }
                            placeholder="Nội dung Bước 04"
                            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 3: PASSWORD CHANGE ONLY (No username display or username input) */}
        {activeTab === 'security' && (
          <div className="max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-display text-2xl font-extrabold text-slate-900">
                Đổi Mật Khẩu Admin
              </h2>
              <button
                type="button"
                onClick={() => setShowAdminPasswords(!showAdminPasswords)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                {showAdminPasswords ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span>Ẩn mật khẩu</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Hiện mật khẩu</span>
                  </>
                )}
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label
                  htmlFor="old-admin-password"
                  className="block text-xs sm:text-sm font-bold text-slate-800 mb-2"
                >
                  Mật Khẩu Hiện Tại
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="old-admin-password"
                    type={showAdminPasswords ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 py-3.5 text-sm font-semibold focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-admin-password"
                  className="block text-xs sm:text-sm font-bold text-slate-800 mb-2"
                >
                  Mật Khẩu Mới
                </label>
                <div className="relative">
                  <KeyRound className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="new-admin-password"
                    type={showAdminPasswords ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 py-3.5 text-sm font-semibold focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-new-admin-password"
                  className="block text-xs sm:text-sm font-bold text-slate-800 mb-2"
                >
                  Nhập Lại Mật Khẩu Mới
                </label>
                <div className="relative">
                  <KeyRound className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="confirm-new-admin-password"
                    type={showAdminPasswords ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 py-3.5 text-sm font-semibold focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingCredentials}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-5 w-5" />
                <span>{savingCredentials ? 'Đang cập nhật...' : 'Lưu Mật Khẩu Mới'}</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* MODAL ADD / EDIT LAND PLOT */}
      {isEditorOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditorOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto"
        >
          <div className="my-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white">
                {editingPlotId
                  ? `Chỉnh Sửa Lô Đất: ${plotForm.code}`
                  : 'Thêm Lô Đất Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSavePlot}
              className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/50"
            >
              {/* Row 1: Code & Title */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 bg-white p-5 rounded-2xl border border-slate-200">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã Lô Đất *
                  </label>
                  <input
                    type="text"
                    required
                    value={plotForm.code}
                    onChange={(e) => setPlotForm({ ...plotForm, code: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-tech font-bold"
                  />
                </div>

                <div className="sm:col-span-9">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Tiêu Đề Lô Đất *
                  </label>
                  <input
                    type="text"
                    required
                    value={plotForm.title}
                    onChange={(e) => setPlotForm({ ...plotForm, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-bold"
                  />
                </div>

                <div className="sm:col-span-12">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mô Tả Ngắn Dưới Tiêu Đề
                  </label>
                  <input
                    type="text"
                    value={plotForm.subtitle}
                    onChange={(e) => setPlotForm({ ...plotForm, subtitle: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Price & Specs */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-blue-700 mb-1">
                      Giá Bán
                    </label>
                    <input
                      type="text"
                      value={plotForm.price_display}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, price_display: e.target.value })
                      }
                      className="w-full rounded-xl border border-blue-400 bg-blue-50/40 px-3.5 py-2.5 text-sm font-tech font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Giá Quy Đổi (Tỷ)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={plotForm.price_billion || ''}
                      onChange={(e) =>
                        setPlotForm({
                          ...plotForm,
                          price_billion: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-tech"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đơn Giá / m²
                    </label>
                    <input
                      type="text"
                      value={plotForm.price_per_m2}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, price_per_m2: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-tech"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Diện Tích (m²)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={plotForm.area_m2 || ''}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, area_m2: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-tech font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kích Thước (Ngang × Dài)
                    </label>
                    <input
                      type="text"
                      value={plotForm.dimensions}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, dimensions: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-tech"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hướng Đất
                    </label>
                    <select
                      value={plotForm.direction}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, direction: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold"
                    >
                      {LAND_DIRECTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d === '' ? '-- Không chọn --' : d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đường Trước Đất
                    </label>
                    <input
                      type="text"
                      value={plotForm.road_width}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, road_width: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phân Loại Đất
                    </label>
                    <select
                      value={plotForm.category}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, category: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold"
                    >
                      {LAND_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pháp Lý
                    </label>
                    <input
                      type="text"
                      value={plotForm.legal_status}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, legal_status: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Location, Google Maps & Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 bg-white p-5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Địa Chỉ / Khu Vực
                  </label>
                  <input
                    type="text"
                    value={plotForm.location_name}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, location_name: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tỉnh / Thành Phố
                  </label>
                  <input
                    type="text"
                    value={plotForm.province}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, province: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link Google Maps
                  </label>
                  <input
                    type="url"
                    value={plotForm.map_url}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, map_url: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trạng Thái
                  </label>
                  <select
                    value={plotForm.status}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, status: e.target.value as PlotStatus })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-bold"
                  >
                    <option value="available">Đang mở bán</option>
                    <option value="reserved">Đã nhận cọc</option>
                    <option value="sold">Đã bán</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center pt-5">
                  <label className="inline-flex items-center gap-2.5 text-sm font-bold text-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plotForm.is_featured}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, is_featured: e.target.checked })
                      }
                      className="h-4 w-4 rounded accent-blue-600"
                    />
                    <span>Ghim làm Lô Nổi Bật</span>
                  </label>
                </div>
              </div>

              {/* Row 4: UNIFIED UPLOAD IMAGES & VIDEOS */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Hình Ảnh / Video
                  </h4>
                  {uploadingMedia && (
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-blue-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải tệp lên...
                    </span>
                  )}
                </div>

                {/* Upload Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer hover:bg-blue-700">
                    <Upload className="h-4 w-4" />
                    <span>Tải Hình Ảnh ({plotForm.images.length})</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  <label className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer hover:bg-slate-800">
                    <Upload className="h-4 w-4 text-amber-400" />
                    <span>Tải Video ({plotForm.videos.length})</span>
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Add by URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Dán link hình ảnh..."
                      className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs"
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
                      className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-900 hover:text-white cursor-pointer"
                    >
                      + Thêm Ảnh
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="Dán link video (.mp4)..."
                      className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs"
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
                      className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-900 hover:text-white cursor-pointer"
                    >
                      + Thêm Video
                    </button>
                  </div>
                </div>

                {/* Combined Preview Grid (Video preview uses actual video frame) */}
                {(plotForm.images.length > 0 || plotForm.videos.length > 0) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                    {plotForm.images.map((img, idx) => (
                      <div
                        key={`img-${idx}`}
                        className="group relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={img}
                          alt={`Ảnh ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-slate-900/85 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                          {idx === 0 ? 'Ảnh Bìa' : `Ảnh #${idx + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPlotForm((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== idx),
                            }))
                          }
                          className="absolute top-1.5 right-1.5 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {plotForm.videos.map((vUrl, idx) => (
                      <div
                        key={`vid-${idx}`}
                        className="group relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-300 bg-slate-900"
                      >
                        <video
                          src={`${vUrl}#t=0.1`}
                          preload="metadata"
                          muted
                          playsInline
                          width={240}
                          height={150}
                          className="h-full w-full object-cover opacity-85 pointer-events-none"
                        />
                        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          <Film className="h-3 w-3" />
                          Video #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPlotForm((prev) => ({
                              ...prev,
                              videos: prev.videos.filter((_, i) => i !== idx),
                            }))
                          }
                          className="absolute top-1.5 right-1.5 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 5: Description & Highlights */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-white p-5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mô Tả Chi Tiết
                  </label>
                  <textarea
                    rows={5}
                    value={plotForm.description}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, description: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đặc Điểm Nổi Bật
                  </label>
                  <textarea
                    rows={5}
                    value={highlightsText}
                    onChange={(e) => setHighlightsText(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                  />
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingPlot || uploadingMedia}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {savingPlot
                      ? 'Đang lưu...'
                      : editingPlotId
                      ? 'Lưu Cập Nhật'
                      : 'Tạo Lô Đất'}
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
