import React from 'react';
import {
  LineChart,
  TrendingUp,
  Award,
  Users,
  ShoppingBag,
  AlertTriangle,
  UserCheck,
  CreditCard,
  Percent,
  Sparkles,
  ArrowRight,
  MessageSquareCheck,
} from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/storage';
import EmptyState from './EmptyState';

export default function InsightView({
  customers = [],
  orders = [],
  products = [],
  onOpenAddCustomer,
  onOpenAddOrder,
  onOpenFollowUp,
}) {
  // Check if enough real data exists
  const hasSufficientData = customers.length > 0 && orders.length > 0;

  if (!hasSufficientData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-xl font-bold text-nvdila-charcoal">
            Customer Insight by.Nvdila
          </h2>
          <p className="text-xs text-stone-500">
            Analisis data pelanggan, retensi belanja, dan performa produk hijab
          </p>
        </div>

        <EmptyState
          icon={LineChart}
          title="Insight akan tersedia setelah terdapat data pelanggan dan transaksi."
          description="Sistem Customer Relationship Management memerlukan minimal 1 pelanggan dan 1 transaksi nyata di database untuk menghitung metrik analitik, pertumbuhan, dan produk terlaris secara akurat tanpa manipulasi data."
          actionLabel="Tambah Pelanggan"
          onAction={onOpenAddCustomer}
          secondaryActionLabel="Tambah Pesanan"
          onSecondaryAction={onOpenAddOrder}
        />
      </div>
    );
  }

  // Real Calculated Metrics
  const totalCustomers = customers.length;
  const totalOrders = orders.length;
  const validOrders = orders.filter((o) => o.orderStatus !== 'Cancelled');
  const totalSales = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Spending & Orders per customer
  const customerSpendingMap = {};
  const customerOrdersCountMap = {};

  customers.forEach((c) => {
    customerSpendingMap[c.id] = 0;
    customerOrdersCountMap[c.id] = 0;
  });

  validOrders.forEach((o) => {
    if (o.customerId && customerSpendingMap[o.customerId] !== undefined) {
      customerSpendingMap[o.customerId] += Number(o.total) || 0;
      customerOrdersCountMap[o.customerId] += 1;
    }
  });

  // Repeat Purchase Calculation
  const repeatCustomersList = customers.filter(
    (c) => (customerOrdersCountMap[c.id] || 0) >= 2
  );
  const repeatPurchaseRate = totalCustomers > 0
    ? ((repeatCustomersList.length / totalCustomers) * 100).toFixed(1)
    : 0;

  // Average Customer Spending (ARPU)
  const averageCustomerSpending = totalCustomers > 0 ? totalSales / totalCustomers : 0;
  // Average Order Value (AOV)
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Customer Segmentation counts
  const segmentStats = {
    'VIP Customer': customers.filter((c) => c.segment === 'VIP Customer').length,
    'Loyal Customer': customers.filter((c) => c.segment === 'Loyal Customer').length,
    'Regular Customer': customers.filter((c) => c.segment === 'Regular Customer').length,
    'New Customer': customers.filter((c) => c.segment === 'New Customer').length,
    'Inactive Customer': customers.filter((c) => c.segment === 'Inactive Customer').length,
  };

  // Top Customers (Ranked by spending)
  const topCustomers = [...customers]
    .map((c) => ({
      ...c,
      totalSpent: customerSpendingMap[c.id] || 0,
      orderCount: customerOrdersCountMap[c.id] || 0,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  // Most Purchased Products
  const productSalesMap = {};
  validOrders.forEach((o) => {
    if (Array.isArray(o.items)) {
      o.items.forEach((it) => {
        const key = it.productName || 'Produk';
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            name: key,
            color: it.color || '',
            qty: 0,
            revenue: 0,
          };
        }
        productSalesMap[key].qty += Number(it.quantity) || 1;
        productSalesMap[key].revenue += Number(it.subtotal) || 0;
      });
    }
  });
  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Inactive Customers for Re-engagement
  const inactiveCustomers = customers.filter(
    (c) => c.segment === 'Inactive Customer' || (customerOrdersCountMap[c.id] || 0) === 0
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="font-serif text-xl font-bold text-nvdila-charcoal">
          Customer Insight by.Nvdila
        </h2>
        <p className="text-xs text-stone-500">
          Metrik analitik real-time yang dihitung 100% dari database pelanggan dan riwayat transaksi
        </p>
      </div>

      {/* 4 Analytical KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Repeat Purchase Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-nvdila-charcoal">
            {repeatPurchaseRate}%
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            {repeatCustomersList.length} dari {totalCustomers} pelanggan belanja &gt;1x
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Rata-rata Pengeluaran (ARPU)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-xl font-bold text-nvdila-charcoal">
            {formatRupiah(averageCustomerSpending)}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Rata-rata belanja per customer</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Nilai Rata-rata Pesanan (AOV)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-xl font-bold text-nvdila-charcoal">
            {formatRupiah(averageOrderValue)}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Nominal per transaksi checkout</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pelanggan Tidak Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-nvdila-charcoal">
            {inactiveCustomers.length}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Target prioritas reaktivasi</p>
        </div>
      </div>

      {/* Customer Segmentation & Growth Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segmentation Deep Dive */}
        <div className="bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-base font-semibold text-nvdila-charcoal flex items-center gap-2">
                <Users className="w-4 h-4 text-nvdila-mocha" />
                Customer Segmentation (Segmentasi Pelanggan)
              </h3>
              <p className="text-xs text-stone-500">
                Kategori loyalitas dinamis berdasarkan frekuensi & total transaksi
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {[
              { name: 'VIP Customer', desc: '>=8 pesanan atau belanja >= Rp 1.5jt', color: 'bg-amber-600', badge: 'bg-amber-100 text-amber-900 border-amber-200' },
              { name: 'Loyal Customer', desc: '4-7 pesanan terselesaikan', color: 'bg-rose-500', badge: 'bg-rose-100 text-rose-900 border-rose-200' },
              { name: 'Regular Customer', desc: '2-3 pesanan belanja ulang', color: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
              { name: 'New Customer', desc: 'Baru mendaftar / 1 pesanan perdana', color: 'bg-sky-600', badge: 'bg-sky-100 text-sky-900 border-sky-200' },
              { name: 'Inactive Customer', desc: 'Tidak ada transaksi >90 hari', color: 'bg-stone-400', badge: 'bg-stone-100 text-stone-700 border-stone-200' },
            ].map((seg) => {
              const count = segmentStats[seg.name] || 0;
              const percent = totalCustomers > 0 ? (count / totalCustomers) * 100 : 0;
              return (
                <div key={seg.name} className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${seg.badge}`}>
                        {seg.name}
                      </span>
                      <span className="text-[10px] text-stone-400">({seg.desc})</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-stone-800">
                      {count} orang ({percent.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${seg.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Growth Dynamics */}
        <div className="bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-base font-semibold text-nvdila-charcoal flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-600" />
                  Customer Growth (Pertumbuhan Pelanggan)
                </h3>
                <p className="text-xs text-stone-500">
                  Laju penambahan pelanggan dan retensi pembeli hijab by.Nvdila
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-950">
                  <span className="text-[10px] font-semibold uppercase tracking-wider block text-sky-700">Pelanggan Baru</span>
                  <span className="font-serif text-xl font-bold">{segmentStats['New Customer']}</span>
                  <p className="text-[10px] text-sky-700 mt-0.5">Potensi pembeli loyal berikutnya</p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <span className="text-[10px] font-semibold uppercase tracking-wider block text-emerald-700">Pelanggan Repeat</span>
                  <span className="font-serif text-xl font-bold">{repeatCustomersList.length}</span>
                  <p className="text-[10px] text-emerald-700 mt-0.5">Belanja lebih dari 1 kali</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="text-xs font-semibold text-stone-700 block">Rasio Retensi Pelanggan:</span>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-3 w-full bg-stone-200 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${repeatPurchaseRate}%` }}
                        className="bg-emerald-600 h-full"
                        title={`Repeat: ${repeatPurchaseRate}%`}
                      />
                      <div
                        style={{ width: `${100 - repeatPurchaseRate}%` }}
                        className="bg-sky-500 h-full"
                        title={`Satu kali checkout: ${(100 - repeatPurchaseRate).toFixed(1)}%`}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-stone-800">{repeatPurchaseRate}%</span>
                </div>
                <div className="flex justify-between text-[10px] text-stone-500 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                    Repeat ({repeatPurchaseRate}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
                    1x Pembelian ({(100 - repeatPurchaseRate).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                💡 <strong>Rekomendasi CRM:</strong> {repeatPurchaseRate > 30 ? 'Tingkat retensi pelanggan Anda sangat sehat. Pertahankan dengan reward VIP dan rekomendasi produk personal.' : 'Fokuskan otomasi follow-up pada pelanggan baru dalam 7 hari setelah pembelian pertama untuk meningkatkan repeat order.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboards Grid: Top Customers & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers Leaderboard */}
        <div className="bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
                  Top Customers (Pelanggan Teratas)
                </h3>
              </div>
              <span className="text-xs text-stone-400">Berdasarkan Total Belanja</span>
            </div>

            <div className="divide-y divide-stone-100">
              {topCustomers.map((cust, idx) => (
                <div key={cust.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-stone-900">{cust.name}</p>
                      <p className="text-[11px] text-stone-400">
                        {cust.segment} • {cust.orderCount} pesanan
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-xs font-bold text-nvdila-charcoal">
                      {formatRupiah(cust.totalSpent)}
                    </p>
                    <span className="text-[10px] text-stone-400 font-mono">ID: {cust.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Most Purchased Products */}
        <div className="bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
                  Most Purchased Products (Hijab Terlaris)
                </h3>
              </div>
              <span className="text-xs text-stone-400">Berdasarkan Kuantitas</span>
            </div>

            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs">
                Belum ada rincian produk pada pesanan yang tercatat.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {topProducts.map((prod, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center font-mono">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-stone-900">{prod.name}</p>
                        <p className="text-[11px] text-stone-400">Varian: {prod.color || 'Standar'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-stone-900 font-mono">
                        {prod.qty} pcs terjual
                      </span>
                      <p className="text-[10px] text-stone-400 font-serif">
                        Omset: {formatRupiah(prod.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inactive Customers Alert & Re-engagement Section */}
      <div className="bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-serif text-base font-semibold text-nvdila-charcoal flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Target Reaktivasi Pelanggan (Inactive Customers)
            </h3>
            <p className="text-xs text-stone-500">
              Pelanggan yang sudah lama tidak bertransaksi atau belum checkout kembali
            </p>
          </div>
        </div>

        {inactiveCustomers.length === 0 ? (
          <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            Hebat! Semua pelanggan Anda saat ini aktif dan teratur berbelanja hijab di by.Nvdila.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inactiveCustomers.map((cust) => (
              <div key={cust.id} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-stone-900">{cust.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-stone-200 text-stone-700 font-medium">
                      {cust.segment}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">{cust.phone || cust.email || '-'}</p>
                  <p className="text-[10px] text-stone-400 mt-1">
                    Bergabung: {formatDate(cust.joinDate)}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-stone-200">
                  <button
                    onClick={() => onOpenFollowUp && onOpenFollowUp(cust)}
                    className="w-full text-xs py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-medium transition flex items-center justify-center gap-1.5"
                  >
                    <MessageSquareCheck className="w-3.5 h-3.5" />
                    <span>Jadwalkan Follow-up Reaktivasi</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
