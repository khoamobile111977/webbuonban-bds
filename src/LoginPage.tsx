import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { SiteSettings } from './types';

interface LoginPageProps {
  settings: SiteSettings;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ settings, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const expectedUser = (settings.admin_username || 'admin').trim();
    const expectedPass = settings.admin_password || 'admin123';

    setTimeout(() => {
      if (username.trim() === expectedUser && password === expectedPass) {
        localStorage.setItem('bds_admin_authenticated', 'true');
        localStorage.setItem('bds_admin_login_time', String(Date.now()));
        onLoginSuccess();
        navigate('/admin', { replace: true });
      } else {
        setErrorMsg('Tài khoản hoặc mật khẩu quản trị không chính xác. Vui lòng kiểm tra lại.');
      }
      setSubmitting(false);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#0B1612] text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
      {/* Subtle Luxury Background Glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#C59B27]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-600/15 blur-3xl" />

      <div className="relative z-10 max-w-6xl w-full mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-stone-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay về trang chủ giới thiệu đất
        </Link>
      </div>

      {/* Main Sign-in Card positioned near top/center so mobile keyboard never obstructs Submit button */}
      <main className="relative z-10 mx-auto w-full max-w-md my-auto py-6">
        <div className="rounded-3xl border border-[#C59B27]/35 bg-[#0F1E19]/95 p-7 sm:p-9 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C59B27]/20 border border-[#C59B27]/40 text-[#E6C770]">
              <Building2 className="h-7 w-7" />
            </div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#E6C770]">
              Cổng Quản Trị Ẩn · {settings.brand_name}
            </span>
            <h1 className="font-display text-3xl font-bold text-white">
              Đăng Nhập Quản Trị Viên
            </h1>
            <p className="text-xs text-stone-400">
              Nhập tài khoản và mật khẩu Admin để thêm lô đất, tải ảnh/video và tùy chỉnh trang web.
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-2xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-200"
            >
              <ShieldAlert className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Semantic form following modern-web-guidance autofill-sign-in-form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="admin-username"
                className="block text-xs font-bold uppercase tracking-wider text-stone-300"
              >
                Tài khoản Admin
              </label>
              <div className="relative">
                <UserCheck className="h-4 w-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="none"
                  enterKeyHint="next"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tài khoản (mặc định: admin)"
                  className="w-full rounded-xl border border-white/15 bg-black/30 pl-11 pr-4 py-3 text-sm text-white placeholder:text-stone-500 focus:border-[#E6C770] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="current-password"
                  className="block text-xs font-bold uppercase tracking-wider text-stone-300"
                >
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#E6C770] hover:underline cursor-pointer"
                >
                  {showPassword ? (
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
                <KeyRound className="h-4 w-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="current-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  enterKeyHint="done"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full rounded-xl border border-white/15 bg-black/30 pl-11 pr-11 py-3 text-sm text-white placeholder:text-stone-500 focus:border-[#E6C770] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#C59B27] px-6 py-3.5 text-sm font-bold text-[#0B1612] shadow-lg shadow-[#C59B27]/25 transition hover:bg-[#D7AE38] disabled:opacity-60 cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              <span>{submitting ? 'Đang xác thực...' : 'Đăng Nhập Bảng Điều Khiển'}</span>
            </button>
          </form>
        </div>
      </main>

      <div className="relative z-10 text-center text-xs text-stone-500">
        Trang đăng nhập nội bộ dành riêng cho chủ website {settings.brand_name}.
      </div>
    </div>
  );
};
