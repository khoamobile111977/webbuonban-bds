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
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { SiteSettings } from './types';
import { verifyAdminLogin } from './supabase';

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const result = await verifyAdminLogin(username.trim(), password);

    if (result.success) {
      sessionStorage.setItem('bds_admin_auth_v2', 'true');
      localStorage.setItem('bds_admin_authenticated', 'true');
      localStorage.setItem('bds_admin_login_time', String(Date.now()));
      onLoginSuccess();
      navigate('/admin', { replace: true });
    } else {
      setErrorMsg(
        result.error || 'Tài khoản hoặc mật khẩu quản trị không chính xác. Vui lòng kiểm tra lại.'
      );
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
      {/* Subtle Modern Background Glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" />

      <div className="relative z-10 max-w-6xl w-full mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay về trang chủ
        </Link>
      </div>

      {/* Main Sign-in Card positioned near top/center so mobile keyboard never obstructs Submit button */}
      <main className="relative z-10 mx-auto w-full max-w-md my-auto py-6">
        <div className="rounded-3xl border border-white/15 bg-slate-900/95 p-7 sm:p-9 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Building2 className="h-7 w-7" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <ShieldCheck className="h-4 w-4" />
              Cổng Quản Trị Bảo Mật · {settings.brand_name}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Đăng Nhập Quản Trị Viên
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Xác thực bảo mật máy chủ để quản lý lô đất, hình ảnh/video và tùy chỉnh toàn bộ trang web.
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-2xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs sm:text-sm font-medium text-red-200"
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
                className="block text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                Tài khoản Admin
              </label>
              <div className="relative">
                <UserCheck className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  placeholder="Nhập tài khoản quản trị"
                  className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-11 pr-4 py-3.5 text-sm font-medium text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="current-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300"
                >
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:underline cursor-pointer"
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
                <KeyRound className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-11 pr-4 py-3.5 text-sm font-medium text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 disabled:opacity-60 cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              <span>{submitting ? 'Đang xác thực bảo mật...' : 'Đăng Nhập Quản Trị'}</span>
            </button>
          </form>
        </div>
      </main>

      <div className="relative z-10 text-center text-xs text-slate-500">
        Hệ thống bảo mật mã hóa Bcrypt & chống dò mật khẩu tự động · {settings.brand_name}
      </div>
    </div>
  );
};
