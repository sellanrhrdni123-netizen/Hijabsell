import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Mail,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '../utils/storage';
import EmptyState from './EmptyState';

export default function CustomersView({
  customers = [],
  orders = [],
  initialSegmentFilter = 'ALL',
  onOpenAdd,
  onOpenEdit,
  onOpenDelete,
  onSelectCustomer,
  onRefreshSegments,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState(initialSegmentFilter || 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  React.useEffect(() => {
    if (initialSegmentFilter) {
      setSegmentFilter(initialSegmentFilter);
    }
  }, [initialSegmentFilter]);

  // Filter logic
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (c.name || '').toLowerCase().includes(term) ||
      (c.phone || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.id || '').toLowerCase().includes(term) ||
      (c.address || '').toLowerCase().includes(term);

    let matchSegment = segmentFilter === 'ALL';
    if (segmentFilter === 'REPEAT') {
      const orderCount = orders.filter((o) => o.customerId === c.id && o.orderStatus !== 'Cancelled').length;
      matchSegment = orderCount >= 2 || (c.segment && c.segment !== 'New Customer' && c.segment !== 'Inactive Customer');
    } else if (segmentFilter !== 'ALL') {
      matchSegment = c.segment === segmentFilter;
    }
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchSearch && matchSegment && matchStatus;
  });

  const getSegmentBadgeColor = (seg) => {
    switch (seg) {
      case 'VIP Customer':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Loyal Customer':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'Regular Customer':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'New Customer':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-nvdila-charcoal">
            Daftar Pelanggan by.Nvdila
          </h2>
          <p className="text-xs text-stone-500">
            Kelola data profil, preferensi hijab, dan segmentasi pelanggan
          </p>
        </div>

        <div className="flex items-center gap-2">
          {customers.length > 0 && onRefreshSegments && (
            <button
              onClick={onRefreshSegments}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium transition shadow-2xs"
              title="Perbarui segmen pelanggan berdasarkan transaksi nyata"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Hitung Ulang Segmentasi</span>
            </button>
          )}

          <button
            onClick={onOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nvdila-charcoal hover:bg-nvdila-darkMocha text-white text-xs font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      {customers.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-nvdila-warm/80 shadow-2xs flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari pelanggan berdasarkan nama, nomor telepon, email, alamat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 focus:outline-none"
            >
              <option value="ALL">Semua Segment</option>
              <option value="REPEAT">Repeat Customers (≥ 2x)</option>
              <option value="New Customer">New Customer</option>
              <option value="Regular Customer">Regular Customer</option>
              <option value="Loyal Customer">Loyal Customer</option>
              <option value="VIP Customer">VIP Customer</option>
              <option value="Inactive Customer">Inactive Customer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Non-aktif">Non-aktif</option>
            </select>
          </div>
        </div>
      )}

      {/* Content Area */}
      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada pelanggan"
          description="Sistem CRM by.Nvdila belum memiliki data pelanggan. Mulai tambahkan pelanggan baru untuk mencatat riwayat dan segmentasi."
          actionLabel="Tambah Pelanggan Baru"
          onAction={onOpenAdd}
        />
      ) : filteredCustomers.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
          <p className="text-sm font-medium text-stone-700">Tidak ada pelanggan yang cocok dengan pencarian.</p>
          <button
            onClick={() => { setSearchTerm(''); setSegmentFilter('ALL'); setStatusFilter('ALL'); }}
            className="text-xs text-nvdila-darkMocha underline mt-2 font-medium"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-nvdila-warm/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4">ID Pelanggan</th>
                  <th className="py-3.5 px-4">Nama Pelanggan</th>
                  <th className="py-3.5 px-4">Kontak</th>
                  <th className="py-3.5 px-4">Alamat</th>
                  <th className="py-3.5 px-4">Bergabung</th>
                  <th className="py-3.5 px-4">Segmentasi</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredCustomers.map((c) => {
                  const custOrders = orders.filter((o) => o.customerId === c.id || (c.name && o.customerName === c.name));
                  const orderCount = custOrders.length;
                  const totalSpent = custOrders.filter((o) => o.orderStatus !== 'Cancelled').reduce((sum, o) => sum + (Number(o.total) || 0), 0);

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-nvdila-cream/30 transition group cursor-pointer"
                      onClick={() => onSelectCustomer(c)}
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-stone-700">
                        {c.id}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 group-hover:text-nvdila-darkMocha transition">
                          {c.name}
                        </div>
                        {orderCount > 0 ? (
                          <span className="text-[10px] text-stone-400">
                            {orderCount} pesanan • {formatRupiah(totalSpent)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400">
                            Belum ada pesanan
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-stone-800">{c.phone || '-'}</span>
                          {c.email && (
                            <span className="text-[11px] text-stone-400">{c.email}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-stone-600" title={c.address}>
                        {c.address || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-stone-600">
                        {formatDate(c.joinDate)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${getSegmentBadgeColor(c.segment)}`}>
                          {c.segment}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          c.status === 'Aktif' ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {c.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectCustomer(c)}
                            title="Lihat Detail Pelanggan"
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenEdit(c)}
                            title="Edit Data"
                            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-800 hover:bg-stone-100 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenDelete(c)}
                            title="Hapus"
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-500 flex items-center justify-between">
            <span>Menampilkan {filteredCustomers.length} dari {customers.length} pelanggan</span>
            <span className="text-[11px] text-stone-400">Klik baris pelanggan untuk membuka profil & riwayat lengkap</span>
          </div>
        </div>
      )}
    </div>
  );
}
