import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  ReceiptText,
  LineChart,
  MessageSquareCheck,
  FileSpreadsheet,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { LOGO_DATA_URI } from '../assets/logoBase64';

export default function Sidebar({
  currentView,
  setCurrentView,
  user,
  onLogout,
  counts = {},
  isOpen = false,
  onClose,
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Pelanggan', icon: Users, badge: counts.customers },
    { id: 'products', label: 'Produk', icon: ShoppingBag, badge: counts.products },
    { id: 'orders', label: 'Pesanan', icon: ReceiptText, badge: counts.orders },
    { id: 'insight', label: 'Customer Insight', icon: LineChart },
    { id: 'followup', label: 'Follow-up', icon: MessageSquareCheck, badge: counts.followups },
    { id: 'reports', label: 'Laporan', icon: FileSpreadsheet },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`w-64 bg-stone-900 text-stone-200 flex flex-col border-r border-stone-800 shrink-0 z-50 transition-transform duration-200 ease-in-out ${
          isOpen
            ? 'fixed inset-y-0 left-0 translate-x-0 shadow-2xl'
            : 'fixed inset-y-0 left-0 -translate-x-full md:relative md:translate-x-0'
        } min-h-screen`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-stone-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_DATA_URI}
              alt="BY.NVDILA"
              className="w-10 h-10 rounded-full object-cover border border-stone-700 shadow-md bg-stone-100"
            />
            <div>
              <h1 className="font-serif text-lg font-bold tracking-wide text-white">
                BY.NVDILA
              </h1>
              <p className="text-xs text-stone-400 tracking-wider uppercase font-medium">
                Brand Hijab System
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1.5 text-stone-400 hover:text-white rounded-lg transition"
              title="Tutup Menu"
            >
              ✕
            </button>
          )}
        </div>

        {/* Role Badge */}
        <div className="px-4 py-3 bg-stone-950/60 border-b border-stone-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-medium text-stone-300">Mode: Admin CRM</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            Menu Utama
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  if (onClose) onClose();
                }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition group ${
                isActive
                  ? 'bg-stone-800 text-white shadow-sm border border-stone-700/60'
                  : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-amber-200' : 'text-stone-400 group-hover:text-stone-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-amber-100 text-stone-900'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-stone-800/80 bg-stone-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-xs font-semibold text-amber-200 uppercase">
              {user?.name ? user.name.slice(0, 2) : (user?.email ? user.email.slice(0, 2) : 'AD')}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'Admin CRM'}
              </p>
              <p className="text-xs text-stone-400 truncate">
                {user?.email || 'admin@bynvdila.com'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Keluar"
            className="p-1.5 text-stone-400 hover:text-rose-300 hover:bg-stone-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
