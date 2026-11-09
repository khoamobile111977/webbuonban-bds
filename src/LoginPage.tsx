import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { verifyAdminLogin } from './supabase';
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
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const res = await verifyAdminLogin(username, password);
    if (res.success) {
      onLoginSuccess();
      navigate('/admin', { replace: true });
    } else {
      setErrorMsg(res.error || 'Tài khoản hoặc mật khẩu không chính xác.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-between p-4 sm:p-8 text-white relative overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-amber-400 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay về trang chủ</span>
        </Link>
      </div>

      <main className="relative z-10 mx-auto w-full max-w-lg my-auto py-8">
        <div className="rounded-3xl border border-white/15 bg-slate-900/90 p-8 sm:p-10 shadow-2xl backdrop-blur-md space-y-7">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-400/40 text-amber-400 shadow-lg">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
              {settings.brand_name}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Đăng Nhập Quản Trị
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200 mb-2"
              >
                Tài khoản
              </label>
              <div className="relative">
                <User className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                  enterKeyHint="next"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tài khoản"
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/90 pl-12 pr-4 py-4 text-base text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="current-password"
                  className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200"
                >
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Ẩn mật khẩu</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Hiện mật khẩu</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <Lock className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className="w-full rounded-2xl border border-white/15 bg-slate-950/90 pl-12 pr-4 py-4 text-base text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-2xl border border-red-500/40 bg-red-500/15 p-4 text-xs sm:text-sm font-semibold text-red-200"
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-500 py-4 px-6 text-base font-extrabold text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Đang xác thực...' : 'Đăng Nhập'}
            </button>
          </form>
        </div>
      </main>

      <div />
    </div>
  );
};
