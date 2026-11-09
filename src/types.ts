export interface SiteSettings {
  id: number;
  brand_name: string;
  brand_subtitle: string;
  brand_tagline: string;
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  hero_video: string;
  broker_name: string;
  broker_title: string;
  broker_role_badge: string;
  broker_avatar: string;
  broker_bio: string;
  broker_info_1_label: string;
  broker_info_1_value: string;
  broker_info_2_label: string;
  broker_info_2_value: string;
  zalo_phone: string;
  hotline: string;
  email: string;
  office_address: string;
  stat_1_value: string;
  stat_1_label: string;
  stat_2_value: string;
  stat_2_label: string;
  stat_3_value: string;
  stat_3_label: string;
  plots_section_badge: string;
  plots_section_title: string;
  plots_section_subtitle: string;
  show_process_section: boolean;
  process_badge: string;
  process_title: string;
  process_subtitle: string;
  step_1_title: string;
  step_1_desc: string;
  step_2_title: string;
  step_2_desc: string;
  step_3_title: string;
  step_3_desc: string;
  step_4_title: string;
  step_4_desc: string;
  show_cta_section: boolean;
  cta_badge: string;
  cta_title: string;
  cta_description: string;
  footer_copyright: string;
  updated_at?: string;
}

export type PlotStatus = 'available' | 'reserved' | 'sold';

export interface LandPlot {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  price_display: string;
  price_billion: number;
  price_per_m2: string;
  area_m2: number;
  dimensions: string;
  direction: string;
  road_width: string;
  legal_status: string;
  category: string;
  status: PlotStatus;
  is_featured: boolean;
  location_name: string;
  province: string;
  map_url: string;
  map_embed_coords: string;
  description: string;
  highlights: string[];
  images: string[];
  videos: string[];
  created_at?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 1,
  brand_name: 'Khoa Mobile',
  brand_subtitle: '',
  brand_tagline: '',
  hero_badge: '',
  hero_title: 'Giới Thiệu Các Lô Đất Đang Mở Bán',
  hero_subtitle: '',
  hero_image:
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=85',
  hero_video: '',
  broker_name: 'Khoa',
  broker_title: '',
  broker_role_badge: '',
  broker_avatar:
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
  broker_bio: '',
  broker_info_1_label: '',
  broker_info_1_value: '',
  broker_info_2_label: '',
  broker_info_2_value: '',
  zalo_phone: '0823195002',
  hotline: '0823195002',
  email: '',
  office_address: '',
  stat_1_value: '',
  stat_1_label: '',
  stat_2_value: '',
  stat_2_label: '',
  stat_3_value: '',
  stat_3_label: '',
  plots_section_badge: 'DANH MỤC LÔ ĐẤT',
  plots_section_title: 'Danh Sách Các Lô Đất Đang Giới Thiệu',
  plots_section_subtitle: '',
  show_process_section: false,
  process_badge: '',
  process_title: 'Quy Trình Làm Việc & Giao Dịch',
  process_subtitle: '',
  step_1_title: 'Bước 1: Tham khảo thông tin lô đất',
  step_1_desc: 'Xem hình ảnh, video và các thông số của từng lô đất trên website.',
  step_2_title: 'Bước 2: Liên hệ trao đổi qua Zalo',
  step_2_desc: 'Nhấn nút Liên Hệ Ngay để kết nối trực tiếp qua Zalo và trao đổi chi tiết.',
  step_3_title: 'Bước 3: Xem thực tế lô đất',
  step_3_desc: 'Hẹn lịch đi xem vị trí thực tế và kiểm tra thông tin trực tiếp.',
  step_4_title: 'Bước 4: Thỏa thuận & Giao dịch',
  step_4_desc: 'Thống nhất mức giá và tiến hành các thủ tục giao dịch theo quy định.',
  show_cta_section: true,
  cta_badge: '',
  cta_title: 'Bạn Cần Tư Vấn Hoặc Tìm Hiểu Thêm Thông Tin?',
  cta_description:
    'Hãy nhấn nút bên dưới để nhắn tin trực tiếp qua Zalo hoặc gọi điện thoại trao đổi chi tiết.',
  footer_copyright: '',
};

export const LAND_CATEGORIES = [
  'Đất nền thổ cư',
  'Đất mặt tiền kinh doanh',
  'Đất biệt thự / nghỉ dưỡng',
  'Đất vườn sinh thái',
];

export const LAND_DIRECTIONS = [
  '',
  'Đông',
  'Tây',
  'Nam',
  'Bắc',
  'Đông Nam',
  'Đông Bắc',
  'Tây Nam',
  'Tây Bắc',
  'Chính Nam',
  'Hai mặt tiền',
];
