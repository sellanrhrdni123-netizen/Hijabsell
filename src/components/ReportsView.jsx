import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Download,
  Printer,
  ShoppingBag,
  Users,
  CreditCard,
  Layers,
  Sparkles,
  TrendingUp,
  Store,
  PieChart,
} from 'lucide-react';
import { formatRupiah, formatDate, exportOrdersToCSV } from '../utils/storage';
import EmptyState from './EmptyState';

export default function ReportsView({
  customers = [],
  orders = [],
  products = [],
  onOpenAddOrder,
}) {
  const [filterPeriod, setFilterPeriod] = useState('ALL'); // 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM' | 'ALL'
  const [activeReportTab, setActiveReportTab] = useState('sales'); // 'sales' | 'customers' | 'orders' | 'products' | 'segmentation'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const hasAnyData = orders.length > 0 || customers.length > 0;

  // Local date helper to avoid UTC off-by-one errors in Indonesian timezone (WIB)
  const getLocalDateStr = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const todayStr = getLocalDateStr(now);

  // Filter orders by period
  const filteredOrders = orders.filter((o) => {
    if (!o.date) return false;
    const orderDate = new Date(o.date);

    if (filterPeriod === 'TODAY') {
      return o.date === todayStr;
    } else if (filterPeriod === 'WEEK') {
      const diffTime = now - orderDate;
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    } else if (filterPeriod === 'MONTH') {
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    } else if (filterPeriod === 'CUSTOM') {
      if (customStart && o.date < customStart) return false;
      if (customEnd && o.date > customEnd) return false;
      return true;
    }
    return true;
  });

  // Filter customers by period (joinDate)
  const filteredCustomers = customers.filter((c) => {
    if (!c.joinDate) return true;
    const joinDate = new Date(c.joinDate);

    if (filterPeriod === 'TODAY') {
      return c.joinDate === todayStr;
    } else if (filterPeriod === 'WEEK') {
      const diffDays = (now - joinDate) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    } else if (filterPeriod === 'MONTH') {
      return (
        joinDate.getMonth() === now.getMonth() &&
        joinDate.getFullYear() === now.getFullYear()
      );
    } else if (filterPeriod === 'CUSTOM') {
      if (customStart && c.joinDate < customStart) return false;
      if (customEnd && c.joinDate > customEnd) return false;
      return true;
    }
    return true;
  });

  const periodSales = filteredOrders
    .filter((o) => o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const completedCount = filteredOrders.filter((o) => o.orderStatus === 'Completed').length;

  // Channel breakdown
  const channelBreakdown = filteredOrders.reduce((acc, o) => {
    const ch = o.channel || 'Marketplace Lainnya';
    if (!acc[ch]) acc[ch] = { count: 0, total: 0 };
    acc[ch].count += 1;
    if (o.orderStatus !== 'Cancelled') acc[ch].total += Number(o.total) || 0;
    return acc;
  }, {});

  // Product sales performance in filtered orders
  const productPerformanceMap = {};
  filteredOrders.forEach((o) => {
    if (Array.isArray(o.items)) {
      o.items.forEach((it) => {
        const key = it.productName || 'Hijab by.Nvdila';
        if (!productPerformanceMap[key]) {
          productPerformanceMap[key] = {
            name: key,
            productId: it.productId,
            color: it.color || 'Varian Campur',
            qtySold: 0,
            revenue: 0,
          };
        }
        productPerformanceMap[key].qtySold += Number(it.quantity) || 1;
        productPerformanceMap[key].revenue += Number(it.subtotal) || 0;
      });
    }
  });
  const productPerformanceList = Object.values(productPerformanceMap).sort((a, b) => b.qtySold - a.qtySold);

  // Customer Segmentation breakdown for filtered data
  const segmentStats = {
    'VIP Customer': filteredCustomers.filter((c) => c.segment === 'VIP Customer').length,
    'Loyal Customer': filteredCustomers.filter((c) => c.segment === 'Loyal Customer').length,
    'Regular Customer': filteredCustomers.filter((c) => c.segment === 'Regular Customer').length,
    'New Customer': filteredCustomers.filter((c) => c.segment === 'New Customer').length,
    'Inactive Customer': filteredCustomers.filter((c) => c.segment === 'Inactive Customer').length,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-nvdila-charcoal">
            Laporan Kinerja CRM & Penjualan by.Nvdila
          </h2>
          <p className="text-xs text-stone-500">
            Laporan terpadu penjualan hijab, performa pelanggan, status pesanan, dan segmentasi
          </p>
        </div>

        {hasAnyData && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportOrdersToCSV(filteredOrders.length > 0 ? filteredOrders : orders)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-nvdila-charcoal hover:bg-nvdila-darkMocha text-white text-xs font-semibold transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Period Filter Bar */}
      {hasAnyData && (
        <div className="bg-white p-4 rounded-2xl border border-nvdila-warm/80 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-600 mr-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              Filter Periode:
            </span>
            {[
              { id: 'ALL', label: 'Semua Waktu' },
              { id: 'TODAY', label: 'Hari Ini (Hari)' },
              { id: 'WEEK', label: '7 Hari Terakhir (Minggu)' },
              { id: 'MONTH', label: 'Bulan Ini' },
              { id: 'CUSTOM', label: 'Rentang Kustom' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterPeriod(p.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${
                  filterPeriod === p.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {filterPeriod === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500">Mulai:</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500">Sampai:</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-300"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {!hasAnyData ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="Belum ada data untuk ditampilkan dalam laporan"
          description="Sistem tidak akan menampilkan laporan atau statistik fiktif. Mulai tambahkan data pesanan dan pelanggan terlebih dahulu."
          actionLabel="Tambah Pesanan Pertama"
          onAction={onOpenAddOrder}
        />
      ) : (
        <div className="space-y-6">
          {/* Summary Metric Cards for Selected Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
              <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Omset Terfilter</span>
              <p className="font-serif text-2xl font-bold text-nvdila-charcoal mt-1">
                {formatRupiah(periodSales)}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">Penjualan valid pada periode ini</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
              <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Jumlah Pesanan</span>
              <p className="font-serif text-2xl font-bold text-nvdila-charcoal mt-1">
                {filteredOrders.length}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">{completedCount} pesanan selesai</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
              <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Pelanggan Terdata</span>
              <p className="font-serif text-2xl font-bold text-nvdila-charcoal mt-1">
                {filteredCustomers.length}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">Basis data pelanggan periode ini</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
              <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Koleksi Produk</span>
              <p className="font-serif text-2xl font-bold text-nvdila-charcoal mt-1">
                {products.length}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">{productPerformanceList.length} model terjual di periode ini</p>
            </div>
          </div>

          {/* 5 Required Report Categories Tabs */}
          <div className="flex border-b border-stone-200 overflow-x-auto text-xs font-semibold gap-2">
            {[
              { id: 'sales', label: '1. Laporan Penjualan (Sales)' },
              { id: 'customers', label: '2. Laporan Pelanggan (Customers)' },
              { id: 'orders', label: '3. Laporan Pesanan (Orders)' },
              { id: 'products', label: '4. Laporan Produk (Products)' },
              { id: 'segmentation', label: '5. Laporan Segmentasi Pelanggan' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id)}
                className={`py-3 px-4 border-b-2 transition whitespace-nowrap ${
                  activeReportTab === tab.id
                    ? 'border-stone-900 text-stone-900 font-bold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Report Tab 1: Sales */}
          {activeReportTab === 'sales' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-nvdila-warm/80 p-6 shadow-2xs space-y-4">
                  <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
                    Ringkasan Penjualan per Saluran (Marketplace & WhatsApp)
                  </h3>
                  {Object.keys(channelBreakdown).length === 0 ? (
                    <p className="text-xs text-stone-400 py-6 text-center">Belum ada transaksi pada periode ini.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(channelBreakdown).map(([ch, info]) => {
                        const pct = periodSales > 0 ? (info.total / periodSales) * 100 : 0;
                        return (
                          <div key={ch} className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-stone-800">{ch} ({info.count} pesanan)</span>
                              <span className="font-serif font-bold text-stone-900">{formatRupiah(info.total)} ({pct.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                              <div style={{ width: `${pct}%` }} className="h-full bg-nvdila-darkMocha rounded-full" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-nvdila-warm/80 p-6 shadow-2xs space-y-4">
                  <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
                    Metrik Efisiensi Penjualan
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                      <span className="text-stone-500 block text-[10px] uppercase font-semibold">Rata-rata Nilai Pesanan (AOV)</span>
                      <span className="font-serif text-lg font-bold text-stone-900">
                        {formatRupiah(filteredOrders.length > 0 ? periodSales / filteredOrders.length : 0)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                      <span className="text-stone-500 block text-[10px] uppercase font-semibold">Pesanan Selesai (Completed Rate)</span>
                      <span className="font-serif text-lg font-bold text-emerald-800">
                        {filteredOrders.length > 0 ? ((completedCount / filteredOrders.length) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                      <span className="text-stone-500 block text-[10px] uppercase font-semibold">Pesanan Dibatalkan</span>
                      <span className="font-serif text-lg font-bold text-rose-800">
                        {filteredOrders.filter((o) => o.orderStatus === 'Cancelled').length} pesanan
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Report Tab 2: Customers */}
          {activeReportTab === 'customers' && (
            <div className="bg-white rounded-2xl border border-nvdila-warm/80 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
                    Laporan Basis Data & Riwayat Belanja Pelanggan
                  </h3>
                  <p className="text-xs text-stone-500">Daftar pelanggan terdaftar dan total belanja riil</p>
                </div>
                <span className="text-xs font-mono text-stone-500">{filteredCustomers.length} Pelanggan</span>
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">Tidak ada pelanggan pada periode ini.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">Customer ID</th>
                        <th className="py-3 px-4">Nama Pelanggan</th>
                        <th className="py-3 px-4">Kontak</th>
                        <th className="py-3 px-4">Bergabung</th>
                        <th className="py-3 px-4">Segmentasi</th>
                        <th className="py-3 px-4">Jumlah Pesanan</th>
                        <th className="py-3 px-4">Total Belanja</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredCustomers.map((c) => {
                        const custOrders = orders.filter((o) => o.customerId === c.id);
                        const spent = custOrders
                          .filter((o) => o.orderStatus !== 'Cancelled')
                          .reduce((s, o) => s + (Number(o.total) || 0), 0);

                        return (
                          <tr key={c.id} className="hover:bg-stone-50/70">
                            <td className="py-3 px-4 font-mono font-medium">{c.id}</td>
                            <td className="py-3 px-4 font-semibold text-stone-900">{c.name}</td>
                            <td className="py-3 px-4 text-stone-600">{c.phone || c.email || '-'}</td>
                            <td className="py-3 px-4 text-stone-500">{formatDate(c.joinDate)}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-700">
                                {c.segment}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-medium">{custOrders.length} order</td>
                            <td className="py-3 px-4 font-serif font-bold text-nvdila-charcoal">{formatRupiah(spent)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Report Tab 3: Orders */}
          {activeReportTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-nvdila-warm/80 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
                    Laporan Transaksi Pesanan Lengkap
                  </h3>
                  <p className="text-xs text-stone-500">Rincian pesanan dari seluruh kanal marketplace & WA</p>
                </div>
                <span className="text-xs font-mono text-stone-500">{filteredOrders.length} Pesanan</span>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">Tidak ada pesanan pada periode ini.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Tanggal</th>
                        <th className="py-3 px-4">Pelanggan</th>
                        <th className="py-3 px-4">Saluran</th>
                        <th className="py-3 px-4">Item Produk</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4">Status Pesanan</th>
                        <th className="py-3 px-4">Pembayaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-stone-50/70">
                          <td className="py-3 px-4 font-mono font-medium">{o.id}</td>
                          <td className="py-3 px-4 text-stone-600">{formatDate(o.date)}</td>
                          <td className="py-3 px-4 font-medium text-stone-900">{o.customerName}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700">{o.channel || 'Marketplace'}</span>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-stone-600">
                            {o.items?.map((it) => `${it.productName} (${it.quantity}x)`).join(', ') || '-'}
                          </td>
                          <td className="py-3 px-4 font-serif font-bold text-nvdila-charcoal">{formatRupiah(o.total)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              o.orderStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'
                            }`}>
                              {o.orderStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              o.paymentStatus === 'Lunas' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                            }`}>
                              {o.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Report Tab 4: Products */}
          {activeReportTab === 'products' && (
            <div className="bg-white rounded-2xl border border-nvdila-warm/80 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
                    Laporan Kinerja Penjualan Produk Hijab
                  </h3>
                  <p className="text-xs text-stone-500">Performa kuantitas terjual, omset, dan sisa stok</p>
                </div>
                <span className="text-xs font-mono text-stone-500">{products.length} Produk Terdaftar</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4">Kode</th>
                      <th className="py-3 px-4">Model Hijab</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Harga Satuan</th>
                      <th className="py-3 px-4">Terjual (Periode Ini)</th>
                      <th className="py-3 px-4">Omset Dihasilkan</th>
                      <th className="py-3 px-4">Sisa Stok</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {products.map((p) => {
                      const perf = productPerformanceMap[p.name] || { qtySold: 0, revenue: 0 };
                      return (
                        <tr key={p.id} className="hover:bg-stone-50/70">
                          <td className="py-3 px-4 font-mono font-medium">{p.id}</td>
                          <td className="py-3 px-4 font-semibold text-stone-900">{p.name}</td>
                          <td className="py-3 px-4 text-stone-600">{p.category}</td>
                          <td className="py-3 px-4 font-serif font-medium">{formatRupiah(p.price)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-stone-800">{perf.qtySold} pcs</td>
                          <td className="py-3 px-4 font-serif font-bold text-nvdila-darkMocha">{formatRupiah(perf.revenue)}</td>
                          <td className="py-3 px-4 font-mono">{p.stock} pcs</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              p.stock === 0 ? 'bg-rose-100 text-rose-800' : p.stock <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {p.status || (p.stock > 0 ? 'Tersedia' : 'Habis')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Report Tab 5: Customer Segmentation */}
          {activeReportTab === 'segmentation' && (
            <div className="bg-white rounded-2xl border border-nvdila-warm/80 p-6 shadow-2xs space-y-4">
              <div>
                <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
                  Laporan Segmentasi Pelanggan by.Nvdila
                </h3>
                <p className="text-xs text-stone-500">
                  Distribusi tingkatan loyalitas dan kontribusi belanja pelanggan
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {[
                  { name: 'VIP Customer', criteria: '>=8 pesanan / >= Rp 1.500.000', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
                  { name: 'Loyal Customer', criteria: '4-7 pesanan', badge: 'bg-rose-100 text-rose-900 border-rose-300' },
                  { name: 'Regular Customer', criteria: '2-3 pesanan', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
                  { name: 'New Customer', criteria: '1 pesanan / baru bergabung', badge: 'bg-sky-100 text-sky-900 border-sky-300' },
                  { name: 'Inactive Customer', criteria: 'Belum transaksi >90 hari', badge: 'bg-stone-100 text-stone-700 border-stone-300' },
                ].map((seg) => {
                  const count = segmentStats[seg.name] || 0;
                  const pct = filteredCustomers.length > 0 ? (count / filteredCustomers.length) * 100 : 0;
                  const segCustIds = filteredCustomers.filter((c) => c.segment === seg.name).map((c) => c.id);
                  const segTotalSpent = filteredOrders
                    .filter((o) => segCustIds.includes(o.customerId) && o.orderStatus !== 'Cancelled')
                    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

                  return (
                    <div key={seg.name} className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${seg.badge}`}>
                            {seg.name}
                          </span>
                          <span className="font-mono text-xs font-bold text-stone-900">{count} orang</span>
                        </div>
                        <p className="text-[11px] text-stone-400">Kriteria: {seg.criteria}</p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-stone-200">
                        <span className="text-[10px] text-stone-400 block">Akumulasi Belanja Segmen:</span>
                        <span className="font-serif text-sm font-bold text-nvdila-charcoal">{formatRupiah(segTotalSpent)}</span>
                        <span className="text-[10px] text-stone-400 block mt-0.5">{pct.toFixed(0)}% dari total pelanggan</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
