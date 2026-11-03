import React, { useState } from 'react';
import {
  Users,
  MessageSquareCheck,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '../utils/storage';
import EmptyState from './EmptyState';

export default function FollowUpView({
  followups = [],
  customers = [],
  onOpenAdd,
  onOpenEdit,
  onOpenDelete,
  onQuickUpdateStatus,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredFollowups = followups.filter((f) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (f.customerName || '').toLowerCase().includes(term) ||
      (f.customerPhone || '').toLowerCase().includes(term) ||
      (f.notes || '').toLowerCase().includes(term);

    const matchStatus = statusFilter === 'ALL' || f.status === statusFilter;
    const matchCategory = categoryFilter === 'ALL' || f.category === categoryFilter;

    return matchSearch && matchStatus && matchCategory;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Selesai':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Sedang Dihubungi':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Dibatalkan':
        return 'bg-stone-100 text-stone-600 border-stone-200';
      default:
        return 'bg-sky-100 text-sky-800 border-sky-200';
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'New Customer':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Repeat Purchase':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Inactive Customer':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Product Recommendation':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-nvdila-charcoal">
            Follow-up & CRM Reminder
          </h2>
          <p className="text-xs text-stone-500">
            Jadwal pengingat kontak, penawaran hijab baru, dan reaktivasi pelanggan setia
          </p>
        </div>

        <button
          onClick={onOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nvdila-charcoal hover:bg-nvdila-darkMocha text-white text-xs font-semibold transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Follow-up Baru</span>
        </button>
      </div>

      {/* 3 Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pelanggan Terdaftar */}
        <div
          onClick={() => {
            setSearchTerm('');
            setCategoryFilter('ALL');
            setStatusFilter('ALL');
          }}
          className="bg-white p-4 rounded-2xl border border-nvdila-warm/80 shadow-2xs hover:shadow-sm hover:border-nvdila-taupe transition cursor-pointer"
          title="Klik untuk menampilkan semua pelanggan"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Pelanggan Terdaftar</span>
            <Users className="w-4 h-4 text-nvdila-mocha" />
          </div>
          <div className="font-serif text-2xl font-bold text-nvdila-charcoal">
            {customers.length}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Siap difollow-up langsung</p>
        </div>

        {/* Perlu Follow-up Cepat */}
        <div
          onClick={() => {
            setCategoryFilter((prev) => (prev === 'New Customer' ? 'Inactive Customer' : 'New Customer'));
          }}
          className="bg-white p-4 rounded-2xl border border-nvdila-warm/80 shadow-2xs hover:shadow-sm hover:border-amber-500 transition cursor-pointer"
          title="Klik untuk memfilter pelanggan perlu follow-up"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Perlu Follow-up Cepat</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-amber-600">
            {customers.filter((c) => c.segment === 'New Customer' || c.segment === 'Inactive Customer').length}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">New & Inactive Customers</p>
        </div>

        {/* Jadwal Pengingat Aktif */}
        <div
          onClick={() => {
            if (followups.filter((f) => f.status !== 'Selesai').length > 0) {
              setStatusFilter('Belum Dihubungi');
            } else {
              onOpenAdd && onOpenAdd();
            }
          }}
          className="bg-white p-4 rounded-2xl border border-nvdila-warm/80 shadow-2xs hover:shadow-sm hover:border-emerald-600 transition cursor-pointer"
          title="Klik untuk melihat jadwal pengingat follow-up"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Jadwal Pengingat Aktif</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-emerald-600">
            {followups.filter((f) => f.status !== 'Selesai').length}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Catatan belum selesai</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      {followups.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-nvdila-warm/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari pelanggan, catatan follow-up, nomor telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="New Customer">New Customer</option>
              <option value="Repeat Purchase">Repeat Purchase</option>
              <option value="Inactive Customer">Inactive Customer</option>
              <option value="Product Recommendation">Product Recommendation</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="Belum Dihubungi">Belum Dihubungi</option>
              <option value="Sedang Dihubungi">Sedang Dihubungi</option>
              <option value="Selesai">Selesai</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>
        </div>
      )}

      {/* Content Area */}
      {followups.length === 0 ? (
        <EmptyState
          icon={MessageSquareCheck}
          title="Belum ada follow-up"
          description="Belum ada agenda follow-up yang dijadwalkan. Buat pengingat untuk menyapa pelanggan baru atau menawarkan hijab edisi terbaru."
          actionLabel="Tambah Follow-up"
          onAction={onOpenAdd}
        />
      ) : filteredFollowups.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
          <p className="text-sm font-medium text-stone-700">Tidak ada agenda follow-up yang sesuai dengan filter.</p>
          <button
            onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); }}
            className="text-xs text-nvdila-darkMocha underline mt-2 font-medium"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFollowups.map((f) => {
            const rawPhone = (f.customerPhone || '').replace(/[^0-9]/g, '');
            const cleanPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;
            const encodedMsg = encodeURIComponent(f.notes || 'Halo kak, salam hangat dari by.Nvdila Hijab ✨');
            const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedMsg}` : null;

            return (
              <div
                key={f.id}
                className="bg-white rounded-2xl border border-nvdila-warm/80 p-5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between"
              >
                <div>
                  {/* Category & Status Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border ${getCategoryBadge(f.category)}`}>
                      {f.category}
                    </span>
                    <select
                      value={f.status}
                      onChange={(e) => onQuickUpdateStatus && onQuickUpdateStatus(f.id, e.target.value)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border focus:outline-none bg-white cursor-pointer ${getStatusBadge(f.status)}`}
                    >
                      <option value="Belum Dihubungi">Belum Dihubungi</option>
                      <option value="Sedang Dihubungi">Sedang Dihubungi</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Dibatalkan">Dibatalkan</option>
                    </select>
                  </div>

                  {/* Customer Information */}
                  <div className="mb-2">
                    <h3 className="font-serif text-sm font-semibold text-stone-900">
                      {f.customerName}
                    </h3>
                    <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                      {f.customerPhone || 'Nomor HP belum tersedia'}
                    </p>
                  </div>

                  {/* Message Note */}
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 text-xs text-stone-700 italic leading-relaxed my-2">
                    "{f.notes || 'Tidak ada pesan khusus.'}"
                  </div>

                  {/* Scheduled Date */}
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Jadwal: {formatDate(f.date)}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Chat WhatsApp</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-stone-400 italic">No HP tidak valid</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEdit(f)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenDelete(f)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
