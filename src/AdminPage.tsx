import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  ShieldAlert,
  ShieldCheck,
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
  changeAdminCredentials,
  createLandPlot,
  deleteLandPlot,
  fetchAdminUsername,
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
  code: 'LO-01',
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
  category: 'Đất nền thổ cư',
  status: 'available',
  is_featured: false,
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

  // Plot Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPlotId, setEditingPlotId] = useState<string | null>(null);
  const [editingOriginalPlot, setEditingOriginalPlot] = useState<LandPlot | undefined>(
    undefined
  );
  const [plotForm, setPlotForm] = useState<Omit<LandPlot, 'id' | 'created_at'>>(EMPTY_PLOT_FORM);
  const [highlightsText, setHighlightsText] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [savingPlot, setSavingPlot] = useState(false);

  // Site Settings Form State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingSiteImage, setUploadingSiteImage] = useState(false);

  // Security / Password Change State
  const [currentAdminUser, setCurrentAdminUser] = useState('admin');
  const [oldPassword, setOldPassword] = useState('');
  const [newUsername, setNewUsername] = useState('admin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  useEffect(() => {
    fetchAdminUsername().then((u) => {
      setCurrentAdminUser(u);
      setNewUsername(u);
    });
  }, []);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setBannerNotice({ type, message });
    setTimeout(() => setBannerNotice(null), 4500);
  };

  const openCreateModal = () => {
    const nextNum = String(plots.length + 1).padStart(2, '0');
    const freshForm: Omit<LandPlot, 'id' | 'created_at'> = {
      ...EMPTY_PLOT_FORM,
      code: `LO-${nextNum}`,
    };
    setEditingPlotId(null);
    setEditingOriginalPlot(undefined);
    setPlotForm(freshForm);
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
        showNotice(
          'success',
          `Đã ghi đè cập nhật lô đất ${payload.code} và dọn dẹp file cũ thành công!`
        );
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
      `Bạn có chắc chắn muốn xóa vĩnh viễn lô đất "${plot.code} - ${plot.title}" cùng toàn bộ hình ảnh/video của lô này khỏi cơ sở dữ liệu không?`
    );
    if (!confirmed) return;

    const { error } = await deleteLandPlot(plot);
    if (error) {
      showNotice('error', `Lỗi xóa lô đất: ${error}`);
    } else {
      await onRefreshData();
      showNotice(
        'success',
        `Đã xóa sạch lô đất ${plot.code} cùng toàn bộ hình ảnh/video khỏi Database & Storage.`
      );
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
      showNotice('success', 'Đã tải ảnh lên thành công! Nhấn "Lưu Toàn Bộ Cấu Hình" để áp dụng.');
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
      showNotice('success', 'Đã ghi đè cập nhật toàn bộ thông tin trang web thành công!');
    }
    setSavingSettings(false);
  };

  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      showNotice('error', 'Vui lòng nhập mật khẩu cũ (mật khẩu hiện tại) để xác thực.');
      return;
    }
    if (newPassword.length < 6) {
      showNotice('error', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showNotice('error', 'Mật khẩu mới và xác nhận mật khẩu mới không khớp.');
      return;
    }

    setSavingCredentials(true);
    const result = await changeAdminCredentials(oldPassword, newUsername.trim(), newPassword);
    if (!result.success) {
      showNotice('error', result.error || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại.');
    } else {
      setCurrentAdminUser(result.username || newUsername.trim());
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showNotice('success', 'Đã cập nhật tài khoản và mật khẩu Admin thành công!');
    }
    setSavingCredentials(false);
  };

  const filteredPlots = plots.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.code || '').toLowerCase().includes(q) ||
      (p.title || '').toLowerCase().includes(q) ||
      (p.location_name || '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total: plots.length,
    available: plots.filter((p) => p.status === 'available').length,
    reserved: plots.filter((p) => p.status === 'reserved').length,
    sold: plots.filter((p) => p.status === 'sold').length,
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-30 bg-[#0F172A] text-white border-b border-slate-800 shadow-md">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-lg sm:text-xl font-extrabold text-white leading-tight">
                HỆ THỐNG QUẢN TRỊ · {settings.brand_name}
              </div>
              <div className="text-xs text-amber-400 font-semibold mt-0.5">
                Zalo nhận khách: {settings.zalo_phone} · Tổng cộng {plots.length} lô đất
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

      {/* Main Wide Content Area */}
      <main className="mx-auto max-w-[1600px] w-full px-4 sm:px-8 py-8 space-y-8 flex-1">
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
              <span>1. Quản Lý Lô Đất & Hình Ảnh/Video ({plots.length})</span>
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
              <span>2. Tùy Chỉnh Toàn Bộ Trang Web & Zalo</span>
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
              <span>3. Đổi Tài Khoản & Mật Khẩu Admin</span>
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
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                  Tổng Số Lô Đất
                </span>
                <div className="font-tech text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
                  {stats.total}
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
                <span className="text-xs sm:text-sm font-bold text-emerald-800 uppercase tracking-wider">
                  Đang Mở Bán
                </span>
                <div className="font-tech text-3xl sm:text-4xl font-extrabold text-emerald-700 mt-2">
                  {stats.available}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6">
                <span className="text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Đã Nhận Cọc
                </span>
                <div className="font-tech text-3xl sm:text-4xl font-extrabold text-amber-700 mt-2">
                  {stats.reserved}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-300 bg-slate-200/60 p-6">
                <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Đã Giao Dịch
                </span>
                <div className="font-tech text-3xl sm:text-4xl font-extrabold text-slate-800 mt-2">
                  {stats.sold}
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nhanh theo mã lô, tiêu đề hoặc khu vực..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 py-3 text-sm font-medium focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="text-xs sm:text-sm text-slate-600">
                Khi xóa lô đất, toàn bộ <strong className="text-slate-900">hình ảnh & video</strong> của lô đó cũng được xóa sạch khỏi đám mây.
              </div>
            </div>

            {/* Plots List Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-900 text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                      <th className="py-4 px-5">Ảnh / Mã Lô</th>
                      <th className="py-4 px-5">Thông Tin Lô Đất</th>
                      <th className="py-4 px-5">Giá Bán & Diện Tích</th>
                      <th className="py-4 px-5">Hình Ảnh / Video</th>
                      <th className="py-4 px-5">Trạng Thái</th>
                      <th className="py-4 px-5 text-right">Thao Tác</th>
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
                          <td className="py-4 px-5 whitespace-nowrap min-w-[200px]">
                            <div className="flex items-center gap-3.5">
                              <img
                                src={
                                  plot.images?.[0] ||
                                  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80'
                                }
                                alt={plot.code}
                                className="h-16 w-24 flex-shrink-0 rounded-xl object-cover border border-slate-200"
                              />
                              <div className="flex-shrink-0">
                                <span className="font-tech rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-amber-400">
                                  {plot.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleFeatured(plot)}
                                  title="Bấm để ghim/bỏ ghim Lô Nổi Bật"
                                  className={`mt-2 flex items-center gap-1 text-xs font-bold cursor-pointer ${
                                    plot.is_featured
                                      ? 'text-amber-600'
                                      : 'text-slate-400 hover:text-slate-700'
                                  }`}
                                >
                                  <Star
                                    className={`h-4 w-4 ${
                                      plot.is_featured ? 'fill-amber-500 text-amber-500' : ''
                                    }`}
                                  />
                                  {plot.is_featured ? 'Lô Nổi Bật' : 'Ghim nổi bật'}
                                </button>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-5 max-w-xl">
                            <div className="font-bold text-slate-900 text-base line-clamp-1">
                              {plot.title}
                            </div>
                            {(plot.location_name || plot.province) && (
                              <div className="text-xs sm:text-sm text-blue-700 font-semibold flex items-center gap-1 mt-1">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">
                                  {plot.location_name}
                                  {plot.province ? `, ${plot.province}` : ''}
                                </span>
                              </div>
                            )}
                            {subSpecs.length > 0 && (
                              <div className="text-xs text-slate-500 mt-1">
                                {subSpecs.join(' · ')}
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-5 whitespace-nowrap">
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

                          <td className="py-4 px-5 whitespace-nowrap text-xs sm:text-sm">
                            <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 font-bold text-slate-700 mr-2">
                              <ImageIcon className="h-4 w-4 text-blue-600" />
                              {plot.images?.length || 0} ảnh
                            </div>
                            <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 font-bold text-slate-700">
                              <Film className="h-4 w-4 text-red-600" />
                              {plot.videos?.length || 0} video
                            </div>
                          </td>

                          <td className="py-4 px-5 whitespace-nowrap">
                            <select
                              value={plot.status}
                              onChange={(e) =>
                                handleQuickStatusChange(plot, e.target.value as PlotStatus)
                              }
                              aria-label={`Trạng thái lô ${plot.code}`}
                              className={`rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold focus:outline-none cursor-pointer ${
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

                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(plot)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 cursor-pointer"
                              >
                                <Edit3 className="h-4 w-4" />
                                Sửa / Ảnh & Video
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePlot(plot)}
                                className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-2.5 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                                title="Xóa sạch lô đất và file ảnh/video"
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
          </div>
        )}

        {/* TAB 2: CUSTOMIZE ALL WEBSITE CONTENT & ZALO */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSiteSettings} className="space-y-8">
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900 flex items-center justify-between gap-4">
              <div>
                <strong>Mẹo tùy chỉnh:</strong> Mọi ô thông tin bên dưới nếu bạn <strong>xóa trống</strong> thì phần đó sẽ tự động ẩn đi trên trang khách hàng (tuyệt đối không tự điền hay tự viết cam kết).
              </div>
              <button
                type="submit"
                disabled={savingSettings}
                className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{savingSettings ? 'Đang lưu...' : 'Lưu Toàn Bộ Cấu Hình'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
              {/* Left Column: Personal Profile, Broker Card & Zalo */}
              <div className="xl:col-span-6 space-y-8">
                {/* Card 1: Broker Profile & Zalo */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                      Phần 1 · Thông Tin Cá Nhân & Liên Hệ
                    </span>
                    <h2 className="font-display text-2xl font-extrabold text-slate-900 mt-1">
                      Hồ Sơ Của Bạn & Số Điện Thoại Zalo
                    </h2>
                  </div>

                  {/* Broker Avatar Upload */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <img
                      src={settingsForm.broker_avatar}
                      alt={settingsForm.broker_name}
                      className="h-20 w-20 rounded-2xl object-cover border-2 border-blue-600 flex-shrink-0"
                    />
                    <div className="space-y-2 flex-1 w-full">
                      <label className="block text-xs font-bold text-slate-800">
                        Ảnh Đại Diện Của Bạn (Khi đổi ảnh mới, ảnh cũ trên đám mây sẽ tự động xóa)
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white cursor-pointer hover:bg-slate-800">
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
                          className="flex-1 min-w-[180px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        Danh Xưng / Chức Danh (Để trống sẽ ẩn)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.broker_title}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, broker_title: e.target.value })
                        }
                        placeholder="VD: Chuyên viên tư vấn BĐS"
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nhãn Nhỏ Phía Trên Tên Trong Thẻ Cá Nhân (Để trống sẽ ẩn)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.broker_role_badge || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, broker_role_badge: e.target.value })
                      }
                      placeholder="Để trống nếu không muốn hiển thị nhãn"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                    <div>
                      <label className="block text-xs font-extrabold text-blue-700 mb-1.5">
                        Số Điện Thoại Zalo (Chuyển hướng khách)
                      </label>
                      <input
                        type="tel"
                        value={settingsForm.zalo_phone}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, zalo_phone: e.target.value })
                        }
                        placeholder="VD: 0823195002"
                        className="w-full rounded-xl border border-blue-300 bg-white px-3.5 py-2.5 text-sm font-tech font-bold text-slate-900"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Link đích: https://zalo.me/{settingsForm.zalo_phone.replace(/[^0-9]/g, '')}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Số Điện Thoại / Hotline Hiển Thị
                      </label>
                      <input
                        type="text"
                        value={settingsForm.hotline}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, hotline: e.target.value })
                        }
                        placeholder="VD: 0823 195 002"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-tech font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Lời Giới Thiệu Bản Thân (Để trống sẽ ẩn)
                    </label>
                    <textarea
                      rows={3}
                      value={settingsForm.broker_bio}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, broker_bio: e.target.value })
                      }
                      placeholder="Nhập lời giới thiệu bản thân của bạn (hoặc xóa trống để ẩn)..."
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3.5 text-sm"
                    />
                  </div>

                  {/* Custom Info Lines inside Broker Card */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-800">
                      Các Dòng Thông Tin Thêm Trong Thẻ Cá Nhân (Để trống sẽ ẩn hoàn toàn)
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
                        placeholder="Nhãn dòng 1 (VD: Thời gian làm việc:)"
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
                        placeholder="Nội dung dòng 1 (VD: Hỗ trợ 24/7)"
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
                        placeholder="Nhãn dòng 2 (Để trống nếu không dùng)"
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
                        Địa Chỉ / Khu Vực Hoạt Động (Để trống sẽ ẩn)
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
                        Email Liên Hệ (Để trống sẽ ẩn)
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

                {/* Card 2: Bottom CTA & Footer */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                        Phần 2 · Cuối Trang Web (Footer & Liên Hệ Cuối Trang)
                      </span>
                      <h2 className="font-display text-2xl font-extrabold text-slate-900 mt-1">
                        Khối Mời Liên Hệ Cuối Trang & Bản Quyền
                      </h2>
                    </div>
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
                      <span>Hiển thị khối này</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nhãn Nhỏ Phía Trên Khối Liên Hệ Cuối Trang (Để trống sẽ ẩn)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.cta_badge || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, cta_badge: e.target.value })
                      }
                      placeholder="Để trống nếu không dùng"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tiêu Đề Khối Liên Hệ Cuối Trang
                    </label>
                    <input
                      type="text"
                      value={settingsForm.cta_title || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, cta_title: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nội Dung Mô Tả Khối Liên Hệ Cuối Trang
                    </label>
                    <textarea
                      rows={3}
                      value={settingsForm.cta_description || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, cta_description: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Dòng Bản Quyền Dưới Cùng (Footer Copyright)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.footer_copyright || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, footer_copyright: e.target.value })
                      }
                      placeholder={`© ${new Date().getFullYear()} ${settingsForm.brand_name}.`}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Header, Hero Banner, Plots Heading & Optional 4-Step Process */}
              <div className="xl:col-span-6 space-y-8">
                {/* Card 3: Header & Hero Banner */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                      Phần 3 · Thương Hiệu & Banner Đầu Trang
                    </span>
                    <h2 className="font-display text-2xl font-extrabold text-slate-900 mt-1">
                      Tùy Chỉnh Header, Tiêu Đề Lớn & Danh Sách Lô Đất
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tên Thương Hiệu / Tên Website (Logo)
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
                        Dòng Phụ Dưới Tên Thương Hiệu Ở Header (Để trống sẽ ẩn)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.brand_subtitle || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, brand_subtitle: e.target.value })
                        }
                        placeholder="Trước đây là: QUỸ ĐẤT SỔ HỒNG CHÍNH CHỦ (Để trống sẽ ẩn)"
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Khẩu Hiệu Thanh Thông Báo Trên Cùng (Để trống sẽ ẩn)
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
                        Nhãn Đầu Trang (Hero Badge - Để trống sẽ ẩn)
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
                      Tiêu Đề Lớn Đầu Trang (Hero Title)
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
                      Mô Tả Ngắn Đầu Trang (Hero Subtitle - Để trống sẽ ẩn)
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
                      Mô Tả Dưới Tiêu Đề Danh Sách Lô Đất (Để trống sẽ ẩn)
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
                      placeholder="Để trống nếu không muốn hiển thị dòng mô tả phụ"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  {/* Hero Cover Image Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Ảnh Nền Banner Đầu Trang (Hero Image)
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
                      3 Con Số Thống Kê Trên Banner (Để trống cả 3 sẽ tự động ẩn)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <input
                          type="text"
                          placeholder="Con số 1"
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
                          placeholder="Con số 2"
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
                          placeholder="Con số 3"
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
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                        Phần 4 · Khu Vực Quy Trình 4 Bước (Tùy Chọn)
                      </span>
                      <h2 className="font-display text-2xl font-extrabold text-slate-900 mt-1">
                        Quy Trình Làm Việc & Giao Dịch
                      </h2>
                    </div>
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
                      <span>Bật hiển thị mục này</span>
                    </label>
                  </div>

                  {settingsForm.show_process_section ? (
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
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-500">
                      Mục Quy trình 4 bước hiện đang được <strong>ẩn</strong> trên trang khách hàng. Bật công tắc phía trên nếu bạn muốn hiển thị và chỉnh sửa nội dung.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-blue-600 px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-5 w-5" />
                <span>
                  {savingSettings
                    ? 'Đang ghi đè cấu hình...'
                    : 'Lưu Toàn Bộ Cấu Hình Trang Web'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: ADMIN CREDENTIALS (REQUIRES OLD PASSWORD) */}
        {activeTab === 'security' && (
          <form
            onSubmit={handleChangeCredentials}
            className="max-w-2xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-6"
          >
            <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 flex-shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                  Bảo Mật Cấp Máy Chủ (Bcrypt)
                </span>
                <h2 className="font-display text-2xl font-extrabold text-slate-900 mt-1">
                  Đổi Tài Khoản & Mật Khẩu Admin
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Tài khoản hiện tại: <strong className="text-slate-900">{currentAdminUser}</strong>. Để đảm bảo an toàn, bạn bắt buộc phải nhập đúng <strong>Mật khẩu cũ</strong> trước khi thiết lập mật khẩu mới.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    1. Mật Khẩu Hiện Tại (Mật Khẩu Cũ) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => !p)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {showPasswords ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Ẩn mật khẩu
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Hiện mật khẩu
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang sử dụng"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-3 text-sm font-medium focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                  2. Tên Tài Khoản Admin (Giữ nguyên hoặc nhập tên mới) *
                </label>
                <div className="relative">
                  <UserCheck className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-3 text-sm font-bold focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                    3. Mật Khẩu Mới (Tối thiểu 6 ký tự) *
                  </label>
                  <div className="relative">
                    <KeyRound className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-3 text-sm font-medium focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                    4. Nhập Lại Mật Khẩu Mới *
                  </label>
                  <div className="relative">
                    <KeyRound className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Xác nhận mật khẩu mới"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-3 text-sm font-medium focus:border-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                Mật khẩu của bạn được mã hóa một chiều bằng thuật toán <strong>Bcrypt</strong> trong cơ sở dữ liệu riêng biệt và không bao giờ hiển thị ra trình duyệt.
              </span>
            </div>

            <button
              type="submit"
              disabled={savingCredentials}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-5 w-5" />
              <span>
                {savingCredentials
                  ? 'Đang xác thực & cập nhật...'
                  : 'Xác Nhận Đổi Thông Tin Bảo Mật'}
              </span>
            </button>
          </form>
        )}
      </main>

      {/* MODAL ADD / EDIT LAND PLOT */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
          <div className="my-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-[#F8FAFC] shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#0F172A] px-6 py-4 text-white">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {editingPlotId ? 'Chỉnh Sửa Lô Đất' : 'Thêm Lô Đất Mới'}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold">
                  {editingPlotId
                    ? `Lô ${plotForm.code}: ${plotForm.title}`
                    : 'Nhập Thông Tin Lô Đất'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSavePlot} className="overflow-y-auto p-6 space-y-6">
              {/* Row 1: Basic Identification */}
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
                    placeholder="VD: LK-01"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-tech font-bold"
                  />
                </div>

                <div className="sm:col-span-9">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiêu Đề Giới Thiệu Lô Đất *
                  </label>
                  <input
                    type="text"
                    required
                    value={plotForm.title}
                    onChange={(e) => setPlotForm({ ...plotForm, title: e.target.value })}
                    placeholder="VD: Lô Góc 2 Mặt Tiền Khu Đô Thị Ven Sông"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-bold"
                  />
                </div>

                <div className="sm:col-span-12">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mô Tả Ngắn (Để trống sẽ ẩn)
                  </label>
                  <input
                    type="text"
                    value={plotForm.subtitle}
                    onChange={(e) => setPlotForm({ ...plotForm, subtitle: e.target.value })}
                    placeholder="Tùy chọn: Mô tả ngắn dưới tiêu đề..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Pricing & Technical Specs (All optional — blank fields are automatically hidden on customer site) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="text-xs font-bold text-blue-700 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-200">
                  Lưu ý: Ô nào bạn <strong>để trống</strong> thì trên trang khách hàng sẽ tự động ẩn ô đó (nếu để trống <strong>Giá Hiển Thị</strong> thì sẽ hiện chữ <em>"Liên hệ để trao đổi"</em>).
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-blue-700 mb-1">
                      Giá Hiển Thị (Để trống = Liên hệ để trao đổi)
                    </label>
                    <input
                      type="text"
                      value={plotForm.price_display}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, price_display: e.target.value })
                      }
                      placeholder="VD: 2.45 Tỷ (Hoặc để trống)"
                      className="w-full rounded-xl border border-blue-400 bg-blue-50/40 px-3.5 py-2.5 text-sm font-tech font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Giá Quy Đổi Tỷ (Số để sắp xếp, VD: 2.45)
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
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-tech"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đơn Giá / m² (Để trống sẽ ẩn)
                    </label>
                    <input
                      type="text"
                      value={plotForm.price_per_m2}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, price_per_m2: e.target.value })
                      }
                      placeholder="VD: 16.3 Triệu/m²"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-tech"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Diện Tích m² (Nhập 0 hoặc để trống sẽ ẩn)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={plotForm.area_m2 || ''}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, area_m2: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="VD: 150"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-tech font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kích Thước Ngang × Dài (Để trống sẽ ẩn)
                    </label>
                    <input
                      type="text"
                      value={plotForm.dimensions}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, dimensions: e.target.value })
                      }
                      placeholder="VD: 6m × 25m (Để trống sẽ không hiện)"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-tech"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hướng Đất (Chọn trống sẽ ẩn)
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
                          {d === '' ? '-- Để trống (Không hiển thị) --' : d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đường Trước Đất (Để trống sẽ ẩn)
                    </label>
                    <input
                      type="text"
                      value={plotForm.road_width}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, road_width: e.target.value })
                      }
                      placeholder="VD: Đường nhựa 12m"
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
                      Thông Tin Pháp Lý (Để trống sẽ ẩn)
                    </label>
                    <input
                      type="text"
                      value={plotForm.legal_status}
                      onChange={(e) =>
                        setPlotForm({ ...plotForm, legal_status: e.target.value })
                      }
                      placeholder="Để trống nếu không muốn hiển thị"
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
                    placeholder="VD: KĐT Nam Hòa Xuân"
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
                    placeholder="VD: Đà Nẵng / Đồng Nai"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link Google Maps (Để trống sẽ ẩn nút mở Map)
                  </label>
                  <input
                    type="url"
                    value={plotForm.map_url}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, map_url: e.target.value })
                    }
                    placeholder="Để trống sẽ không hiện nút mở Map"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trạng Thái Mở Bán
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
                    <span>Ghim lô đất này làm "Lô Nổi Bật" lên đầu trang web</span>
                  </label>
                </div>
              </div>

              {/* Row 4: UNIFIED UPLOAD IMAGES & VIDEOS */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      Hình Ảnh / Video Của Lô Đất
                    </h4>
                    <p className="text-xs text-slate-500">
                      Tất cả hình ảnh và video sẽ được gộp chung trong mục "Hình ảnh / Video" và hỗ trợ xem toàn màn hình.
                    </p>
                  </div>
                  {uploadingMedia && (
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-blue-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải tệp lên đám mây...
                    </span>
                  )}
                </div>

                {/* Upload Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer hover:bg-blue-700">
                    <Upload className="h-4 w-4" />
                    <span>Tải Hình Ảnh Từ Máy ({plotForm.images.length})</span>
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
                    <span>Tải Video (.mp4, .mov) Từ Máy ({plotForm.videos.length})</span>
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
                      placeholder="Hoặc dán link hình ảnh..."
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
                      + Link Ảnh
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="Hoặc dán link video (.mp4)..."
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
                      + Link Video
                    </button>
                  </div>
                </div>

                {/* Combined Preview Grid */}
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
                          {idx === 0 ? 'Ảnh Bìa Chính' : `Ảnh #${idx + 1}`}
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
                          title="Xóa ảnh này"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {plotForm.videos.map((vUrl, idx) => (
                      <div
                        key={`vid-${idx}`}
                        className="group relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-300 bg-slate-900 flex flex-col items-center justify-center p-2 text-center"
                      >
                        <Film className="h-6 w-6 text-amber-400 mb-1" />
                        <span className="text-[11px] font-bold text-white truncate w-full px-1">
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
                          title="Xóa video này"
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
                    Mô Tả Chi Tiết Lô Đất (Để trống sẽ ẩn)
                  </label>
                  <textarea
                    rows={5}
                    value={plotForm.description}
                    onChange={(e) =>
                      setPlotForm({ ...plotForm, description: e.target.value })
                    }
                    placeholder="Mô tả chi tiết vị trí, tiện ích xung quanh (hoặc để trống)..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Các Điểm Nổi Bật (Mỗi dòng 1 ý - Để trống sẽ ẩn)
                  </label>
                  <textarea
                    rows={5}
                    value={highlightsText}
                    onChange={(e) => setHighlightsText(e.target.value)}
                    placeholder="Mỗi dòng 1 điểm nổi bật (để trống nếu không cần hiển thị)..."
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
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingPlot || uploadingMedia}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {savingPlot
                      ? 'Đang lưu dữ liệu...'
                      : editingPlotId
                      ? 'Lưu Cập Nhật Lô Đất'
                      : 'Tạo Lô Đất Mới'}
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
