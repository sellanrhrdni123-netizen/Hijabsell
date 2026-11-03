import React, { useState } from 'react';
import {
  ReceiptText,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Phone,
} from 'lucide-react';
import { formatRupiah, formatDate, exportOrdersToCSV } from '../utils/storage';
import EmptyState from './EmptyState';

export default function OrdersView({
  orders = [],
  customers = [],
  onOpenAdd,
  onOpenEdit,
  onOpenDelete,
  onQuickUpdateStatus,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');

  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (o.id || '').toLowerCase().includes(term) ||
      (o.customerName || '').toLowerCase().includes(term) ||
      (o.resi || '').toLowerCase().includes(term);

    const matchStatus = statusTab === 'ALL' || o.orderStatus === statusTab;
    const matchChannel = channelFilter === 'ALL' || o.channel === channelFilter;

    return matchSearch && matchStatus && matchChannel;
  });

  const getOrderStatusBadge = (st) => {
    switch (st) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Shipped':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Processing':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getPaymentStatusBadge = (st) => {
    switch (st) {
      case 'Lunas':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Belum Lunas':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const statusCounts = {
    ALL: orders.length,
    Pending: orders.filter((o) => o.orderStatus === 'Pending').length,
    Processing: orders.filter((o) => o.orderStatus === 'Processing').length,
    Shipped: orders.filter((o) => o.orderStatus === 'Shipped').length,
    Completed: orders.filter((o) => o.orderStatus === 'Completed').length,
    Cancelled: orders.filter((o) => o.orderStatus === 'Cancelled').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-nvdila-charcoal">
            Manajemen Pesanan Hijab
          </h2>
          <p className="text-xs text-stone-500">
            Kelola transaksi masuk dari marketplace (Shopee, TikTok Shop, Tokopedia) dan WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-2">
          {orders.length > 0 && (
            <button
              onClick={() => exportOrdersToCSV(orders)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          <button
            onClick={onOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nvdila-charcoal hover:bg-nvdila-darkMocha text-white text-xs font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pesanan</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      {orders.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'Semua Pesanan' },
            { id: 'Pending', label: 'Pending' },
            { id: 'Processing', label: 'Diproses' },
            { id: 'Shipped', label: 'Dikirim' },
            { id: 'Completed', label: 'Selesai' },
            { id: 'Cancelled', label: 'Dibatalkan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
                statusTab === tab.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusTab === tab.id ? 'bg-stone-800 text-stone-200' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {statusCounts[tab.id] || 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filter & Search Bar */}
      {orders.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-nvdila-warm/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari Order ID, nama pelanggan, nomor resi pengiriman..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 focus:outline-none"
            >
              <option value="ALL">Semua Saluran (Channel)</option>
              <option value="Shopee">Shopee</option>
              <option value="TikTok Shop">TikTok Shop</option>
              <option value="Tokopedia">Tokopedia</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Website">Website</option>
            </select>
          </div>
        </div>
      )}

      {/* Content Area */}
      {orders.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="Belum ada pesanan"
          description="Sistem belum mencatat transaksi pesanan hijab. Mulai tambahkan pesanan dari pembeli marketplace atau WhatsApp."
          actionLabel="Tambah Pesanan Baru"
          onAction={onOpenAdd}
        />
      ) : filteredOrders.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
          <p className="text-sm font-medium text-stone-700">Tidak ada pesanan yang sesuai dengan filter.</p>
          <button
            onClick={() => { setSearchTerm(''); setStatusTab('ALL'); setChannelFilter('ALL'); }}
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
                  <th className="py-3.5 px-4">Order ID & Saluran</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Item Produk</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Pembayaran</th>
                  <th className="py-3.5 px-4">Status Pesanan</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((o) => {
                  const phoneNum = o.customerPhone ? o.customerPhone.replace(/[^0-9]/g, '') : '';
                  const cleanPhone = phoneNum.startsWith('0') ? '62' + phoneNum.slice(1) : phoneNum;
                  const waUrl = cleanPhone
                    ? `https://wa.me/${cleanPhone}?text=Halo%20kak%20${encodeURIComponent(o.customerName)}%2C%20berikut%20informasi%20pesanan%20${o.id}%20by.Nvdila%20total%20${formatRupiah(o.total)}%20status%20${o.orderStatus}.%20Terima%20kasih!`
                    : null;

                  return (
                    <tr key={o.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-stone-900">{o.id}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] px-2 py-0.2 rounded-md bg-stone-100 text-stone-600 font-medium">
                            {o.channel || 'Marketplace'}
                          </span>
                          {o.resi && (
                            <span className="text-[10px] font-mono text-stone-400" title={`Resi: ${o.resi}`}>
                              Resi: {o.resi}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900">{o.customerName}</div>
                        <div className="text-[11px] text-stone-500">{o.customerPhone || '-'}</div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          {Array.isArray(o.items) && o.items.length > 0 ? (
                            o.items.map((it, idx) => (
                              <div key={idx} className="text-stone-700 truncate">
                                • {it.productName} <span className="text-stone-400">({it.quantity}x {it.color || ''})</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-stone-400">1x Produk Hijab</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-stone-600">
                        {formatDate(o.date)}
                      </td>

                      <td className="py-3.5 px-4 font-serif font-bold text-nvdila-charcoal text-sm">
                        {formatRupiah(o.total)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getPaymentStatusBadge(o.paymentStatus)}`}>
                          {o.paymentStatus || 'Lunas'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {/* Quick Status Select */}
                        <select
                          value={o.orderStatus}
                          onChange={(e) => onQuickUpdateStatus && onQuickUpdateStatus(o.id, e.target.value)}
                          className={`text-[10px] font-medium px-2 py-1 rounded-lg border focus:outline-none bg-white cursor-pointer ${getOrderStatusBadge(o.orderStatus)}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Kirim Konfirmasi WhatsApp"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => onOpenEdit(o)}
                            title="Edit Pesanan"
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenDelete(o)}
                            title="Hapus Pesanan"
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
            <span>Menampilkan {filteredOrders.length} transaksi</span>
            <span className="text-[11px] text-stone-400">Total nilai transaksi tersaring: {formatRupiah(filteredOrders.reduce((s, o) => s + (Number(o.total) || 0), 0))}</span>
          </div>
        </div>
      )}
    </div>
  );
}
