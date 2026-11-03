import React from 'react';
import {
  Users,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  UserCheck,
  Calendar,
  ArrowUpRight,
  Clock,
  Sparkles,
  ChevronRight,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { formatRupiah, formatDate, formatDateTime } from '../utils/storage';
import EmptyState from './EmptyState';

export default function DashboardView({
  customers = [],
  orders = [],
  products = [],
  activities = [],
  onNavigate,
  onOpenAddCustomer,
  onOpenAddProduct,
  onOpenAddOrder,
}) {
  const hasData = customers.length > 0 || orders.length > 0 || products.length > 0;

  // KPI Calculations strictly from real data
  const totalCustomers = customers.length;
  const newCustomers = customers.filter(
    (c) => c.segment === 'New Customer' || (c.joinDate && (new Date() - new Date(c.joinDate)) / (1000 * 3600 * 24) <= 30)
  ).length;
  const totalOrders = orders.length;
  const completedOrValidOrders = orders.filter((o) => o.orderStatus !== 'Cancelled');
  const totalSales = completedOrValidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Repeat Customers: customers with >= 2 orders
  const customerOrderCounts = orders.reduce((acc, o) => {
    if (o.customerId) {
      acc[o.customerId] = (acc[o.customerId] || 0) + 1;
    }
    return acc;
  }, {});
  const repeatCustomerCount = Object.values(customerOrderCounts).filter((cnt) => cnt >= 2).length;

  // Customer Segmentation counts
  const segmentStats = {
    'New Customer': customers.filter((c) => c.segment === 'New Customer').length,
    'Regular Customer': customers.filter((c) => c.segment === 'Regular Customer').length,
    'Loyal Customer': customers.filter((c) => c.segment === 'Loyal Customer').length,
    'VIP Customer': customers.filter((c) => c.segment === 'VIP Customer').length,
    'Inactive Customer': customers.filter((c) => c.segment === 'Inactive Customer').length,
  };

  // Recent Orders (up to 5)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Recent Activities (up to 5)
  const recentActivities = [...activities].slice(0, 5);

  // Real Sales Chart Data Preparation (Grouped by actual order dates)
  const salesByDate = orders.reduce((acc, o) => {
    const d = o.date || 'Unknown';
    acc[d] = (acc[d] || 0) + (Number(o.total) || 0);
    return acc;
  }, {});
  const salesDateKeys = Object.keys(salesByDate).sort();
  const maxSales = Math.max(...Object.values(salesByDate), 1);

  // Real Customer Growth by Month/Date
  const customersByDate = customers.reduce((acc, c) => {
    const d = c.joinDate || 'Unknown';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const customerDateKeys = Object.keys(customersByDate).sort();
  const maxCustGrowth = Math.max(...Object.values(customersByDate), 1);

  return (
    <div className="space-y-6">
      {/* Brand Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-nvdila-darkMocha p-4 sm:p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-200/20 text-amber-200 font-semibold border border-amber-200/30">
              by.nvdila Modest Wear
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold mt-2">
              Panel Kontrol & Manajemen Bisnis
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Pusat pengelolaan data pelanggan loyal, produk hijab pashmina viscose, bergo instan, dan riwayat pesanan langsung di aplikasi.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (Honest 0 when empty) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Pelanggan */}
        <div
          onClick={() => onNavigate && onNavigate('customers')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs hover:shadow-sm hover:border-nvdila-taupe transition cursor-pointer"
          title="Klik untuk membuka Database Pelanggan"
        >
          <div className="flex items-center justify-between text-stone-500 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Total Customers</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-nvdila-charcoal truncate whitespace-nowrap">
            {totalCustomers}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Pelanggan terdaftar</p>
        </div>

        {/* Pelanggan Baru */}
        <div
          onClick={() => onNavigate && onNavigate('customers', { segment: 'New Customer' })}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs hover:shadow-sm hover:border-emerald-600 transition cursor-pointer"
          title="Klik untuk membuka Pelanggan Baru"
        >
          <div className="flex items-center justify-between text-stone-500 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">New Customers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-nvdila-charcoal truncate whitespace-nowrap">
            {newCustomers}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Bulan ini / segmen baru</p>
        </div>

        {/* Total Pesanan */}
        <div
          onClick={() => onNavigate && onNavigate('orders')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs hover:shadow-sm hover:border-amber-600 transition cursor-pointer"
          title="Klik untuk membuka Manajemen Pesanan"
        >
          <div className="flex items-center justify-between text-stone-500 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-nvdila-charcoal truncate whitespace-nowrap">
            {totalOrders}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Semua status pesanan</p>
        </div>

        {/* Total Penjualan */}
        <div
          onClick={() => onNavigate && onNavigate('reports')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs hover:shadow-sm hover:border-nvdila-mocha transition cursor-pointer"
          title="Klik untuk membuka Laporan Penjualan"
        >
          <div className="flex items-center justify-between text-stone-500 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Total Sales</span>
            <div className="w-8 h-8 rounded-lg bg-nvdila-cream flex items-center justify-center text-nvdila-darkMocha">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-xl lg:text-2xl font-bold text-nvdila-charcoal truncate whitespace-nowrap" title={formatRupiah(totalSales)}>
            {formatRupiah(totalSales)}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Akumulasi omset tercatat</p>
        </div>

        {/* Repeat Customers */}
        <div
          onClick={() => onNavigate && onNavigate('customers', { segment: 'REPEAT' })}
          className="col-span-2 sm:col-span-2 lg:col-span-1 xl:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-nvdila-warm/80 shadow-2xs hover:shadow-sm hover:border-rose-600 transition cursor-pointer"
          title="Klik untuk membuka Database Pelanggan"
        >
          <div className="flex items-center justify-between text-stone-500 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Repeat Customers</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-nvdila-charcoal truncate whitespace-nowrap">
            {repeatCustomerCount}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            {totalCustomers > 0 ? `${((repeatCustomerCount / totalCustomers) * 100).toFixed(0)}% dari total pelanggan` : 'Belum ada transaksi'}
          </p>
        </div>
      </div>

      {/* Charts & Segmentation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart (Strictly Real Data) */}
        <div className="bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
                Grafik Tren Penjualan
              </h3>
              <p className="text-xs text-stone-500">
                Berdasarkan riwayat pesanan nyata di database
              </p>
            </div>
            {salesDateKeys.length > 0 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {salesDateKeys.length} Tanggal Transaksi
              </span>
            )}
          </div>

          {salesDateKeys.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
              <CreditCard className="w-8 h-8 text-stone-300 mb-2" />
              <p className="text-sm font-medium text-stone-600">Belum ada data penjualan</p>
              <p className="text-xs text-stone-400 max-w-xs mt-1">
                Grafik akan otomatis tergambar setelah terdapat data pesanan yang diinput.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="flex items-end gap-3 h-48 pt-4 px-2 border-b border-stone-200 overflow-x-auto pb-1">
                {salesDateKeys.map((date) => {
                  const val = salesByDate[date];
                  const heightPercent = Math.max(15, (val / maxSales) * 100);
                  return (
                    <div key={date} className="flex-1 min-w-[36px] flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-mono text-stone-500 opacity-0 group-hover:opacity-100 transition mb-1">
                        {formatRupiah(val)}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-nvdila-darkMocha to-nvdila-taupe group-hover:brightness-110 transition shadow-xs"
                      />
                      <span className="text-[10px] text-stone-500 mt-2 truncate max-w-full text-center">
                        {date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-stone-500 px-1">
                <span>Total Penjualan: {formatRupiah(totalSales)}</span>
                <span>Rata-rata: {formatRupiah(totalOrders > 0 ? totalSales / totalOrders : 0)}/order</span>
              </div>
            </div>
          )}
        </div>

        {/* Customer Growth Chart (Strictly Real Data) */}
        <div className="bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
                Grafik Pertumbuhan Pelanggan
              </h3>
              <p className="text-xs text-stone-500">
                Berdasarkan tanggal bergabung pelanggan nyata
              </p>
            </div>
            {customerDateKeys.length > 0 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                {totalCustomers} Pelanggan Terdaftar
              </span>
            )}
          </div>

          {customerDateKeys.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
              <Users className="w-8 h-8 text-stone-300 mb-2" />
              <p className="text-sm font-medium text-stone-600">Belum ada data pelanggan</p>
              <p className="text-xs text-stone-400 max-w-xs mt-1">
                Grafik pertumbuhan akan otomatis muncul setelah pelanggan didaftarkan.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="flex items-end gap-3 h-48 pt-4 px-2 border-b border-stone-200 overflow-x-auto pb-1">
                {customerDateKeys.map((date) => {
                  const val = customersByDate[date];
                  const heightPercent = Math.max(20, (val / maxCustGrowth) * 100);
                  return (
                    <div key={date} className="flex-1 min-w-[36px] flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-mono text-stone-600 opacity-0 group-hover:opacity-100 transition mb-1 font-semibold">
                        +{val} org
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-sky-700 to-sky-400 group-hover:brightness-110 transition shadow-xs"
                      />
                      <span className="text-[10px] text-stone-500 mt-2 truncate max-w-full text-center">
                        {date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-stone-500 px-1">
                <span>Total Akumulasi: {totalCustomers} Pelanggan</span>
                <span>Terdaftar Baru: {newCustomers} Pelanggan</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Segmentation & Recent Orders Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Segmentation */}
        <div className="bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-base font-semibold text-nvdila-charcoal mb-1">
              Segmentasi Pelanggan
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Distribusi tingkatan loyalitas pelanggan
            </p>

            {totalCustomers === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                <Users className="w-8 h-8 text-stone-300 mb-2" />
                <p className="text-sm font-medium text-stone-600">Belum ada pelanggan</p>
                <p className="text-xs text-stone-400 mt-1">
                  Data segmentasi akan dihitung setelah ada pelanggan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(segmentStats).map(([seg, count]) => {
                  const percent = totalCustomers > 0 ? (count / totalCustomers) * 100 : 0;
                  return (
                    <div key={seg} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-stone-700">{seg}</span>
                        <span className="text-stone-500 font-mono">
                          {count} ({percent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            seg === 'VIP Customer'
                              ? 'bg-amber-600'
                              : seg === 'Loyal Customer'
                              ? 'bg-rose-500'
                              : seg === 'Regular Customer'
                              ? 'bg-emerald-600'
                              : seg === 'New Customer'
                              ? 'bg-sky-600'
                              : 'bg-stone-400'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100">
            <button
              onClick={() => onNavigate('insight')}
              className="w-full py-2 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium transition flex items-center justify-center gap-1.5"
            >
              <span>Buka Customer Insight Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
                Pesanan Terbaru
              </h3>
              <p className="text-xs text-stone-500">Transaksi marketplace & WhatsApp terkini</p>
            </div>
            {orders.length > 0 && (
              <button
                onClick={() => onNavigate('orders')}
                className="text-xs text-nvdila-darkMocha hover:underline font-medium flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <EmptyState
              title="Belum ada pesanan"
              description="Belum ada transaksi yang tercatat dalam sistem CRM by.Nvdila."
            />
          ) : (
            <div className="divide-y divide-stone-100">
              {recentOrders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-stone-800">
                        {ord.id}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                        {ord.channel || 'Marketplace'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-stone-900 mt-0.5">
                      {ord.customerName}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {formatDate(ord.date)} • {ord.items?.length || 1} item hijab
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-sm font-bold text-nvdila-charcoal">
                      {formatRupiah(ord.total)}
                    </p>
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                        ord.orderStatus === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.orderStatus === 'Shipped'
                          ? 'bg-sky-100 text-sky-800'
                          : ord.orderStatus === 'Processing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {ord.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Customer Activity */}
        <div className="bg-white p-6 rounded-2xl border border-nvdila-warm/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-base font-semibold text-nvdila-charcoal">
                Aktivitas Pelanggan Terbaru
              </h3>
              <p className="text-xs text-stone-500">Log interaksi, pesanan, dan follow-up</p>
            </div>
          </div>

          {recentActivities.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Belum ada aktivitas"
              description="Aktivitas pelanggan akan otomatis tercatat setiap kali ada pendaftaran, pesanan, atau follow-up."
              actionLabel="Tambah Pelanggan"
              onAction={onOpenAddCustomer}
            />
          ) : (
            <div className="space-y-4">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-nvdila-cream border border-nvdila-warm flex items-center justify-center text-nvdila-darkMocha shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-stone-800">
                      {act.title}
                    </p>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {act.description}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-1 font-mono">
                      {formatDateTime(act.timestamp)}
                    </p>
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
