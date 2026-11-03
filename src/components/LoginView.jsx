import React, { useState } from 'react';
import { Mail, Lock, ShieldCheck, User, ArrowRight, Sparkles, X, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('admin'); // 'admin' | 'customer'
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      alert('Masukkan email Anda.');
      return;
    }
    onLogin({
      role,
      email: cleanEmail,
    });
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
      setShowForgotModal(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 rounded-full bg-nvdila-cream/70 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 rounded-full bg-[#EFE7DE]/70 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-nvdila-warm p-8 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 text-white flex items-center justify-center font-serif text-2xl font-bold shadow-md">
            N
          </div>
          <h1 className="font-serif text-2xl font-bold text-nvdila-charcoal tracking-wide">
            by.Nvdila
          </h1>
          <p className="text-xs text-stone-500 uppercase tracking-widest mt-0.5 font-medium">
            Customer Relationship Management
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="flex bg-stone-100 p-1 rounded-2xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setRole('admin');
            }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              role === 'admin'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-nvdila-mocha" />
            <span>Admin CRM</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('customer');
            }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              role === 'customer'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-3.5 h-3.5 text-nvdila-mocha" />
            <span>Customer / User</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-stone-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] text-nvdila-mocha hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-700 focus:outline-none p-1 rounded-lg transition"
                title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                aria-label={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition shadow-md flex items-center justify-center gap-2 mt-2"
          >
            <span>Masuk ke {role === 'admin' ? 'Admin Dashboard' : 'Customer Dashboard'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-nvdila-warm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base font-semibold text-stone-900">
                Lupa Kata Sandi
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSent ? (
              <div className="py-4 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-semibold text-stone-900">
                  Instruksi Terkirim!
                </p>
                <p className="text-xs text-stone-500">
                  Tautan pemulihan kata sandi telah dikirimkan ke email Anda.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-stone-500 leading-relaxed">
                  Masukkan email akun by.Nvdila Anda untuk menerima tautan pemulihan kata sandi.
                </p>
                <div>
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100 text-xs font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs"
                  >
                    Kirim Instruksi
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
