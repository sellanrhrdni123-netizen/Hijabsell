import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  CreditCard,
  Clock,
  MessageSquareCheck,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { formatRupiah, formatDate, formatDateTime } from '../utils/storage';
import EmptyState from './EmptyState';

export default function CustomerDetailView({
  customer,
  orders = [],
  followups = [],
  activities = [],
  onBack,
  onEdit,
  onDelete,
  onOpenAddOrderForCustomer,
  onOpenAddFollowUpForCustomer,
}) {
  if (!customer) return null;

  // Filter specific to this customer
  const customerOrders = orders.filter((o) => o.customerId === customer.id || o.customerName === customer.name);
  const customerFollowups = followups.filter((f) => f.customerId === customer.id || f.customerName === customer.name);
  const customerActivities = activities.filter(
    (a) => a.customerId === customer.id || (customer.name && a.description && a.description.toLowerCase().includes(customer.name.toLowerCase()))
  );

  // Metrics
  const totalOrders = customerOrders.length;
  const totalSpent = customerOrders
    .filter((o) => o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const sortedOrders = [...customerOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastPurchaseDate = sortedOrders.length > 0 ? formatDate(sortedOrders[0].date) : 'Belum ada pembelian';
  const aov = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // Aggregate products bought
  const productSummary = {};
  customerOrders.forEach((o) => {
    if (Array.isArray(o.items)) {
      o.items.forEach((it) => {
        const key = it.productName || 'Hijab by.Nvdila';
        if (!productSummary[key]) {
          productSummary[key] = {
            name: key,
            color: it.color || 'Varian Campur',
            qty: 0,
            subtotal: 0,
          };
        }
        productSummary[key].qty += Number(it.quantity) || 1;
        productSummary[key].subtotal += Number(it.subtotal) || 0;
      });
    }
  });
  const purchasedProductsList = Object.values(productSummary);

  const getSegmentBadgeColor = (seg) => {
    switch (seg) {
      case 'VIP Customer':
      case 'VIP':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Loyal Customer':
      case 'Loyal':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'Regular Customer':
      case 'Regular':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'New Customer':
      case 'New':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  const whatsappPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
  const cleanPhone = whatsappPhone.startsWith('0') ? '62' + whatsappPhone.slice(1) : (whatsappPhone.startsWith('8') ? '62' + whatsappPhone : whatsappPhone);
  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
  const whatsappUrl = cleanPhone 
    ? (isMobile ? `whatsapp://send?phone=${cleanPhone}&text=Halo%20kak%20${encodeURIComponent(customer.name)}%2C%20salam%20dari%20by.Nvdila%20Hijab%20✨` : `https://web.whatsapp.com/send?phone=${cleanPhone}&text=Halo%20kak%20${encodeURIComponent(customer.name)}%2C%20salam%20dari%20by.Nvdila%20Hijab%20✨`)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Button & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition w-fit px-3 py-1.5 rounded-lg bg-white border border-nvdila-warm shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Pelanggan</span>
        </button>

        <div className="flex items-center gap-2">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Chat WhatsApp</span>
            </a>
          )}
          <button
            onClick={() => onOpenAddFollowUpForCustomer(customer)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-medium transition shadow-2xs"
          >
            <MessageSquareCheck className="w-3.5 h-3.5" />
            <span>+ Follow-up</span>
          </button>
          <button
            onClick={() => onOpenAddOrderForCustomer(customer)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-nvdila-charcoal hover:bg-nvdila-darkMocha text-white text-xs font-medium transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Buat Pesanan</span>
          </button>
          <button
            onClick={() => onEdit(customer)}
            className="p-2 rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 transition"
            title="Edit Data"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(customer)}
            className="p-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
            title="Hapus Pelanggan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customer Header Card */}
      <div className="bg-white rounded-2xl border border-nvdila-warm/80 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nvdila-warm to-nvdila-sand flex items-center justify-center font-serif text-2xl font-bold text-nvdila-darkMocha shadow-inner">
              {customer.name?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-serif text-2xl font-bold text-nvdila-charcoal">
                  {customer.name}
                </h2>
                <span className={`text-xs px-3 py-0.5 rounded-full font-medium border ${getSegmentBadgeColor(customer.segment)}`}>
                  {customer.segment}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  customer.status === 'Aktif' ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'
                }`}>
                  {customer.status}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>{customer.points !== undefined ? customer.points : Math.floor(totalSpent / 10000)} Poin</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono mt-1">
                ID: {customer.id} • Bergabung sejak: {formatDate(customer.joinDate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
          <span className="text-xs text-stone-500 uppercase tracking-wider font-medium">Total Pesanan</span>
          <p className="font-serif text-2xl font-bold text-nvdila-charcoal mt-1">
            {totalOrders}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">Transaksi selesai & diproses</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
          <span className="text-xs text-stone-500 uppercase tracking-wider font-medium">Total Pengeluaran</span>
          <p className="font-serif text-2xl font-bold text-nvdila-charcoal mt-1">
            {formatRupiah(totalSpent)}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">Akumulasi belanja produk hijab</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
          <span className="text-xs text-stone-500 uppercase tracking-wider font-medium">Pembelian Terakhir</span>
          <p className="font-serif text-lg font-bold text-nvdila-charcoal mt-1 truncate">
            {lastPurchaseDate}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">Waktu transaksi terbaru</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
          <span className="text-xs text-stone-500 uppercase tracking-wider font-medium">Rata-rata Pesanan (AOV)</span>
          <p className="font-serif text-xl font-bold text-nvdila-charcoal mt-1">
            {formatRupiah(aov)}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">Rata-rata nominal per checkout</p>
        </div>
      </div>

      {/* Information & Products Bought Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information Card */}
        <div className="bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs space-y-4">
          <h3 className="font-serif text-base font-semibold text-nvdila-charcoal border-b border-stone-100 pb-2">
            Informasi Pelanggan
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-semibold">Nomor Telepon / WhatsApp</span>
                <span className="font-medium text-stone-800">{customer.phone || '-'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-semibold">Email</span>
                <span className="font-medium text-stone-800">{customer.email || '-'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-semibold">Alamat Pengiriman</span>
                <span className="font-medium text-stone-800 leading-relaxed">{customer.address || '-'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-semibold">Tanggal Bergabung</span>
                <span className="font-medium text-stone-800">{formatDate(customer.joinDate)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <span className="text-stone-400 block text-[10px] uppercase font-semibold mb-1">Catatan Admin</span>
              <p className="text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 leading-relaxed italic">
                {customer.notes || 'Belum ada catatan khusus untuk pelanggan ini.'}
              </p>
            </div>
          </div>
        </div>

        {/* Products Ever Purchased */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-4">
              <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
                Produk yang Pernah Dibeli
              </h3>
              <span className="text-xs text-stone-500 font-medium">
                {purchasedProductsList.length} Model Hijab
              </span>
            </div>

            {purchasedProductsList.length === 0 ? (
              <div className="py-8 text-center text-stone-500 text-xs">
                Belum ada produk yang dibeli oleh pelanggan ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {purchasedProductsList.map((prod, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-xs text-stone-900">{prod.name}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">Warna: {prod.color}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-600 font-medium mt-1 inline-block">
                        Total {prod.qty} pcs
                      </span>
                    </div>
                    <span className="font-serif text-xs font-bold text-nvdila-darkMocha">
                      {formatRupiah(prod.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Riwayat Pembelian (Purchase History) */}
      <div className="bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
              Riwayat Pembelian
            </h3>
            <p className="text-xs text-stone-500">Daftar transaksi pesanan dari pelanggan ini</p>
          </div>
          <button
            onClick={() => onOpenAddOrderForCustomer(customer)}
            className="text-xs px-3 py-1.5 rounded-xl bg-nvdila-charcoal hover:bg-nvdila-darkMocha text-white font-medium transition"
          >
            + Buat Pesanan
          </button>
        </div>

        {customerOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Belum ada riwayat pembelian"
            description="Pelanggan ini belum memiliki catatan pesanan di sistem CRM."
            actionLabel="Buat Pesanan Pertama"
            onAction={() => onOpenAddOrderForCustomer(customer)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider border-y border-stone-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Saluran</th>
                  <th className="py-3 px-4">Item Produk</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status Pesanan</th>
                  <th className="py-3 px-4">Pembayaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {customerOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-stone-800">{ord.id}</td>
                    <td className="py-3 px-4 text-stone-600">{formatDate(ord.date)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                        {ord.channel || 'Marketplace'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-700">
                      {ord.items?.map((it) => `${it.productName} (${it.quantity}x)`).join(', ') || '-'}
                    </td>
                    <td className="py-3 px-4 font-serif font-bold text-nvdila-charcoal">
                      {formatRupiah(ord.total)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        ord.orderStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        ord.paymentStatus === 'Lunas' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                      }`}>
                        {ord.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Follow-up & Activity Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Follow-up Notes */}
        <div className="bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
                Riwayat Follow-up
              </h3>
              <p className="text-xs text-stone-500">Catatan pengingat dan pesan personal</p>
            </div>
            <button
              onClick={() => onOpenAddFollowUpForCustomer(customer)}
              className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition"
            >
              + Follow-up
            </button>
          </div>

          {customerFollowups.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl">
              Belum ada riwayat follow-up untuk pelanggan ini.
            </div>
          ) : (
            <div className="space-y-3">
              {customerFollowups.map((flw) => (
                <div key={flw.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-800">{flw.category}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-600 font-medium">
                      {flw.status}
                    </span>
                  </div>
                  <p className="text-stone-600 italic bg-white p-2 rounded-lg border border-stone-100">
                    "{flw.notes}"
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono">
                    Jadwal: {formatDate(flw.date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Activity Log */}
        <div className="bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
          <h3 className="font-serif text-base font-semibold text-nvdila-charcoal mb-1">
            Aktivitas Pelanggan
          </h3>
          <p className="text-xs text-stone-500 mb-4">Timeline riwayat aktivitas terkait pelanggan ini</p>

          {customerActivities.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl">
              Belum ada aktivitas tercatat untuk pelanggan ini.
            </div>
          ) : (
            <div className="space-y-3">
              {customerActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-nvdila-mocha mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-stone-800">{act.title}</p>
                    <p className="text-stone-500">{act.description}</p>
                    <span className="text-[10px] text-stone-400 font-mono">{formatDateTime(act.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
