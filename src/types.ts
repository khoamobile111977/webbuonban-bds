export interface SiteSettings {
  id: number;
  brand_name: string;
  brand_tagline: string;
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  hero_video: string;
  broker_name: string;
  broker_title: string;
  broker_avatar: string;
  broker_bio: string;
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
  zalo_greeting_template: string;
  admin_username?: string;
  admin_password?: string;
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
  brand_name: 'ĐỊA ỐC MINH KHÔI',
  brand_tagline: 'Quỹ Đất Vàng Pháp Lý Sạch · Đầu Tư Sinh Lời Bền Vững',
  hero_badge: 'QUỸ ĐẤT SỔ HỒNG RIÊNG · CÔNG CHỨNG NGAY 2026',
  hero_title: 'Tuyển Tập Các Lô Đất Đẹp, Vị Trí Đắc Địa & Pháp Lý Minh Bạch',
  hero_subtitle:
    'Chuyên giới thiệu quỹ đất nền thổ cư, đất mặt tiền kinh doanh và đất nghỉ dưỡng tiềm năng tăng giá cao. Làm việc trực tiếp chính chủ, hỗ trợ kiểm tra quy hoạch và sang tên sổ hồng trọn gói.',
  hero_image:
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=85',
  hero_video: '',
  broker_name: 'Minh Khôi BĐS',
  broker_title: 'Chuyên Viên Tư Vấn & Săn Quỹ Đất Đầu Tư Thực Chiến',
  broker_avatar:
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
  broker_bio:
    'Với hơn 8 năm kinh nghiệm thực chiến khảo sát và thẩm định quỹ đất tại các khu vực phát triển hạ tầng trọng điểm, tôi cam kết chỉ giới thiệu những lô đất có sổ hồng riêng từng nền, quy hoạch chuẩn 100%, giá trị thực và thanh khoản tốt nhất cho khách hàng.',
  zalo_phone: '0909123456',
  hotline: '0909 123 456',
  email: 'lienhe@diaocminhkhoi.vn',
  office_address: 'Khu Đô Thị Sala, TP. Thủ Đức, TP. Hồ Chí Minh',
  stat_1_value: '100%',
  stat_1_label: 'Sổ Hồng Riêng Từng Lô',
  stat_2_value: '150+',
  stat_2_label: 'Lô Đất Đã Giao Dịch Thành Công',
  stat_3_value: '24/7',
  stat_3_label: 'Hỗ Trợ Xem Đất Thực Tế & Pháp Lý',
  zalo_greeting_template:
    'Chào anh/chị, tôi đang quan tâm đến lô đất {code} ({title}) giá {price} trên website. Nhờ anh/chị gửi thêm sổ hồng và vị trí qua Zalo giúp tôi nhé!',
  admin_username: 'admin',
  admin_password: 'admin123',
};

export const LAND_CATEGORIES = [
  'Đất nền thổ cư',
  'Đất mặt tiền kinh doanh',
  'Đất biệt thự / nghỉ dưỡng',
  'Đất vườn sinh thái',
];

export const LAND_DIRECTIONS = [
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
