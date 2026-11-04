import React, { useState } from 'react';
import {
  ShoppingBag,
  Package,
  Clock,
  User,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Phone,
  Sparkles,
  LogOut,
  Tag,
  CheckCircle,
  Truck,
  X,
  Search,
  Minus,
  Plus,
} from 'lucide-react';
import { formatRupiah, formatDate, getProductColors, isProductColorAvailable } from '../utils/storage';
import EmptyState from './EmptyState';
import { LOGO_DATA_URI } from '../assets/logoBase64';

export default function CustomerPortal({
  user,
  customers = [],
  products = [],
  orders = [],
  onPlaceOrder,
  onCancelOrder,
  onSwitchToAdmin,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'catalog' | 'my-orders' | 'history' | 'profile'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchaseColor, setPurchaseColor] = useState('');
  const [purchaseAddress, setPurchaseAddress] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [orderSuccessNotification, setOrderSuccessNotification] = useState(null);

  // Identify current customer profile strictly by user email or customerId
  const matchedCust = customers.find((c) =>
    (c.email && user?.email && c.email.toLowerCase() === user.email.toLowerCase()) ||
    (user?.customerId && c.id === user.customerId)
  );

  const currentCustomer = matchedCust
    ? {
        ...matchedCust,
        email: user?.email || matchedCust.email,
      }
    : {
        id: user?.customerId || 'CUST-PORTAL',
        name: user?.name || (user?.email ? user.email.split('@')[0] : 'Pelanggan by.Nvdila'),
        phone: user?.phone || '081234567890',
        email: user?.email || 'pelanggan@bynvdila.com',
        address: 'Alamat belum diatur',
        joinDate: new Date().toISOString().slice(0, 10),
        segment: 'New Customer',
        status: 'Aktif',
        notes: 'Akses login pelanggan by.Nvdila',
      };

  // Filter orders strictly for this customer
  const customerAllOrders = orders.filter(
    (o) => o.customerId === currentCustomer.id || o.customerName === currentCustomer.name
  );
  const activeOrders = customerAllOrders.filter(
    (o) => o.orderStatus !== 'Completed' && o.orderStatus !== 'Cancelled'
  );
  const historyOrders = customerAllOrders.filter(
    (o) => o.orderStatus === 'Completed' || o.orderStatus === 'Cancelled'
  );

  const totalSpent = customerAllOrders
    .filter((o) => o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const sortedCustOrders = [...customerAllOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastPurchaseDate = sortedCustOrders.length > 0 ? formatDate(sortedCustOrders[0].date) : '-';

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setPurchaseQty(1);
    const colors = getProductColors(product);
    setPurchaseColor(colors.length > 0 ? colors[0] : '');
    setPurchaseAddress(currentCustomer?.address || '');
    setPurchaseNotes('');
  };

  const handleConfirmPurchase = () => {
    if (!selectedProduct) return;
    if (selectedProduct.stock <= 0) {
      alert('Maaf, produk ini saat ini sedang habis stok.');
      return;
    }
    if (purchaseQty > selectedProduct.stock) {
      alert(`Jumlah pesanan (${purchaseQty}) melebihi stok yang tersedia (${selectedProduct.stock} pcs).`);
      return;
    }

    if (!isProductColorAvailable(selectedProduct, purchaseColor)) {
      alert('warna tidak tersedia/habis');
      return;
    }

    if (!purchaseAddress || !purchaseAddress.trim()) {
      alert('Wajib mengisi alamat pengiriman untuk memesan hijab.');
      return;
    }

    if (onPlaceOrder) {
      const createdOrder = onPlaceOrder({
        product: selectedProduct,
        quantity: purchaseQty,
        color: purchaseColor,
        address: purchaseAddress.trim(),
        notes: purchaseNotes,
      });

      if (!createdOrder) {
        return;
      }

      setOrderSuccessNotification({
        orderId: createdOrder?.id || `ORD-${Date.now().toString().slice(-6)}`,
        productName: selectedProduct.name,
        quantity: purchaseQty,
        color: purchaseColor,
        total: (Number(selectedProduct.price) || 0) * purchaseQty,
      });

      setSelectedProduct(null);
      setActiveTab('my-orders');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchSearch =
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.color || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-nvdila-bg flex flex-col font-sans">
      {/* Customer Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-nvdila-warm/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <img
              src={LOGO_DATA_URI}
              alt="BY.NVDILA"
              className="w-9 h-9 rounded-full object-cover border border-stone-200 shadow-sm bg-white"
            />
            <div>
              <h1 className="font-serif text-lg font-bold text-nvdila-charcoal tracking-wide">
                BY.NVDILA
              </h1>
              <p className="text-[10px] text-stone-400 tracking-wider uppercase font-semibold">
                Hijab & Modest Wear
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'home' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Beranda (Home)
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'catalog' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Katalog Hijab
            </button>
            <button
              onClick={() => setActiveTab('my-orders')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'my-orders' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Pesanan Saya</span>
              {activeOrders.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'history' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Riwayat Pembelian
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'profile' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Profil Saya
            </button>
          </nav>

          {/* Right Action Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSwitchToAdmin}
              className="px-3 py-1.5 rounded-xl bg-stone-900 text-amber-200 hover:text-white hover:bg-stone-800 text-xs font-medium transition shadow-2xs flex items-center gap-1.5"
              title="Beralih ke Admin CRM"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin CRM</span>
            </button>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-stone-100 py-2 bg-stone-50 text-[11px] font-medium text-stone-600">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-2 py-1 ${activeTab === 'home' ? 'text-stone-900 font-bold' : ''}`}
          >
            Beranda
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-2 py-1 ${activeTab === 'catalog' ? 'text-stone-900 font-bold' : ''}`}
          >
            Katalog
          </button>
          <button
            onClick={() => setActiveTab('my-orders')}
            className={`px-2 py-1 ${activeTab === 'my-orders' ? 'text-stone-900 font-bold' : ''}`}
          >
            Pesanan ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-2 py-1 ${activeTab === 'history' ? 'text-stone-900 font-bold' : ''}`}
          >
            Riwayat
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-2 py-1 ${activeTab === 'profile' ? 'text-stone-900 font-bold' : ''}`}
          >
            Profil
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Tab 0: Home (Beranda) */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Aesthetic Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-stone-900 via-stone-800 to-nvdila-darkMocha text-white p-8 sm:p-12 shadow-sm">
              <div className="max-w-xl space-y-3 relative z-10">
                <span className="text-[11px] uppercase tracking-widest text-amber-200 font-semibold px-3 py-1 rounded-full bg-amber-200/20 border border-amber-200/30">
                  Selamat Datang di by.Nvdila
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
                  Kenyamanan & Keanggunan Modest Wear Pilihan
                </h2>
                <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                  Menghadirkan hijab pashmina silk, voal curve curved edge, dan inner anti pusing dengan material berkualitas premium untuk menyempurnakan penampilan santun Anda.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="px-5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-stone-900 text-xs font-semibold transition shadow-sm flex items-center gap-2"
                  >
                    <span>Jelajahi Katalog Hijab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveTab('my-orders')}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition"
                  >
                    Lacak Pesanan Saya ({activeOrders.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Greeting & Loyalty Overview Card */}
            <div className="bg-white rounded-2xl border border-nvdila-warm/80 p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-nvdila-cream border border-nvdila-warm flex items-center justify-center font-serif text-xl font-bold text-nvdila-darkMocha">
                    {currentCustomer.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      Assalamu'alaikum, {currentCustomer.name}!
                    </h3>
                    <p
                      onClick={() => setActiveTab('profile')}
                      className="text-xs text-stone-500 cursor-pointer hover:underline"
                      title="Klik untuk membuka profil member"
                    >
                      Member Status: <span className="font-semibold text-amber-900">{currentCustomer.segment}</span> • ID: {currentCustomer.id}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  <div
                    onClick={() => setActiveTab('my-orders')}
                    className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-center min-w-18 cursor-pointer hover:border-stone-400 hover:shadow-2xs transition"
                    title="Klik untuk membuka Pesanan Aktif"
                  >
                    <span className="text-[10px] text-stone-400 block">Pesanan Aktif</span>
                    <span className="font-bold font-serif text-stone-900">{activeOrders.length}</span>
                  </div>
                  <div
                    onClick={() => setActiveTab('my-orders')}
                    className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-center min-w-18 cursor-pointer hover:border-stone-400 hover:shadow-2xs transition"
                    title="Klik untuk membuka Total Pesanan"
                  >
                    <span className="text-[10px] text-stone-400 block">Total Pesanan</span>
                    <span className="font-bold font-serif text-stone-900">{customerAllOrders.length}</span>
                  </div>
                  <div
                    onClick={() => setActiveTab('history')}
                    className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-center min-w-22 cursor-pointer hover:border-emerald-400 hover:shadow-2xs transition"
                    title="Klik untuk membuka Total Belanja"
                  >
                    <span className="text-[10px] text-stone-400 block">Total Belanja</span>
                    <span className="font-bold font-serif text-emerald-800">{formatRupiah(totalSpent)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Hijab Products */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    Koleksi Hijab Pilihan
                  </h3>
                  <p className="text-xs text-stone-500">Model terpopuler yang paling banyak diminati</p>
                </div>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="text-xs text-nvdila-darkMocha hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Lihat Semua ({products.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {products.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="Belum ada produk ditampilkan"
                  description="Admin belum mengunggah produk hijab ke dalam sistem CRM."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {products.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="bg-white rounded-2xl border border-nvdila-warm/80 overflow-hidden shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                        <img
                          src={p.image || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80'}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <span className="absolute top-2.5 left-2.5 text-[10px] px-2.5 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-xs text-white font-medium">
                          {p.category}
                        </span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-serif text-sm font-semibold text-stone-900 line-clamp-1 group-hover:text-nvdila-darkMocha transition">
                            {p.name}
                          </h4>
                          <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                            {p.color || '-'}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                          <span className="font-serif text-sm font-bold text-nvdila-charcoal">
                            {formatRupiah(p.price)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectProduct(p);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold transition flex items-center gap-1 shadow-2xs"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              <span>Beli Sekarang</span>
                            </button>
                            <span className="text-xs font-semibold text-nvdila-darkMocha group-hover:translate-x-0.5 transition flex items-center">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Brand Values / Modest Promise */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-nvdila-warm/80 shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-lg bg-nvdila-cream text-nvdila-darkMocha flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-serif text-sm font-bold text-stone-900">Bahan Viscose Modal Premium</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Viscose modal premium yang ringan, super lembut, adem, dan jatuh flowy untuk pemakaian harian yang nyaman.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-nvdila-warm/80 shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <h4 className="font-serif text-sm font-bold text-stone-900">Pas Nempel di Kepala</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Pas nempel di kepala tapi tetap punya flow anggun, tidak licin, tidak terlalu tebal, dan tidak mudah terlihat botak.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-nvdila-warm/80 shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-serif text-sm font-bold text-stone-900">Jahitan Rapi Double Stitch</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Jahitan rapi dengan teknik double stitch khas by.Nvdila, kuat, awet, dan tidak mudah berserabut.
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Aesthetic Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-stone-900 via-stone-800 to-nvdila-darkMocha text-white p-8 sm:p-12 shadow-sm">
              <div className="max-w-xl space-y-3 relative z-10">
                <span className="text-[11px] uppercase tracking-widest text-amber-200 font-semibold px-3 py-1 rounded-full bg-amber-200/20 border border-amber-200/30">
                  Koleksi Eksklusif by.Nvdila
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
                  Anggun, Lembut & Nyaman Sepanjang Hari
                </h2>
                <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                  Temukan koleksi pashmina viscose modal premium, hijab instan tali, dan bergo praktis yang lembut, flowy, serta pas di kepala.
                </p>
              </div>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 text-xs">
                {['ALL', 'Pashmina Viscose Modal', 'Hijab Instan/Tali', 'Bergo Instan Praktis', 'Inner/Ciput'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua Koleksi' : cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari hijab atau warna..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30"
                />
              </div>
            </div>

            {/* Product Grid */}
            {products.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="Belum ada produk hijab di katalog"
                description="Produk baru akan segera diunggah oleh admin by.Nvdila. Silakan kembali lagi nanti."
              />
            ) : filteredProducts.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-stone-200">
                <p className="text-sm font-semibold text-stone-800">Tidak ada produk yang sesuai dengan pencarian Anda.</p>
                <button
                  onClick={() => { setSearchTerm(''); setCategoryFilter('ALL'); }}
                  className="text-xs text-nvdila-darkMocha underline mt-2 font-medium"
                >
                  Tampilkan Semua Koleksi
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className="bg-white rounded-2xl border border-nvdila-warm/80 overflow-hidden shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                      <img
                        src={p.image || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80'}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <span className="absolute top-2.5 left-2.5 text-[10px] px-2.5 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-xs text-white font-medium">
                        {p.category}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-serif text-sm font-semibold text-stone-900 line-clamp-1 group-hover:text-nvdila-darkMocha transition">
                          {p.name}
                        </h3>
                        <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                          Warna: {p.color || '-'}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                        <span className="font-serif text-sm font-bold text-nvdila-charcoal">
                          {formatRupiah(p.price)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectProduct(p);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold transition flex items-center gap-1 shadow-2xs"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Beli Sekarang</span>
                          </button>
                          <span className="text-xs font-semibold text-nvdila-darkMocha group-hover:translate-x-0.5 transition flex items-center">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Orders (Pesanan Saya) */}
        {activeTab === 'my-orders' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-nvdila-charcoal">
                Pesanan Saya yang Sedang Berjalan
              </h2>
              <p className="text-xs text-stone-500">
                Lacak status proses dan pengiriman paket hijab Anda
              </p>
            </div>

            {orderSuccessNotification && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between gap-3 animate-in fade-in shadow-xs">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-emerald-950">
                      Alhamdulillah! Pesanan #{orderSuccessNotification.orderId} Berhasil Dibuat
                    </p>
                    <p className="text-emerald-800">
                      {orderSuccessNotification.quantity}x {orderSuccessNotification.productName} ({orderSuccessNotification.color}) senilai {formatRupiah(orderSuccessNotification.total)} telah otomatis masuk ke sistem CRM, stok terpotong, dan profil member Anda telah terupdate.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderSuccessNotification(null)}
                  className="text-emerald-700 hover:text-emerald-900 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeOrders.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Belum ada pesanan aktif"
                description="Anda tidak memiliki pesanan yang sedang diproses atau dalam perjalanan saat ini."
                actionLabel="Lihat Katalog Hijab"
                onAction={() => setActiveTab('catalog')}
              />
            ) : (
              <div className="space-y-4">
                {activeOrders.map((ord) => (
                  <div key={ord.id} className="bg-white rounded-2xl border border-nvdila-warm/80 p-5 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-900">{ord.id}</span>
                        <span className="text-xs text-stone-400">• {formatDate(ord.date)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200 font-medium">
                          {ord.channel || 'Customer Portal'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          {ord.paymentStatus || 'Lunas'}
                        </span>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-900 border border-amber-200 w-fit">
                        Status: {ord.orderStatus}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      {ord.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-stone-700">
                          <span>{it.productName} ({it.quantity}x {it.color})</span>
                          <span className="font-medium">{formatRupiah(it.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    {ord.resi && (
                      <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Truck className="w-3.5 h-3.5 text-sky-700" />
                          Nomor Resi: <span className="font-mono">{ord.resi}</span>
                        </span>
                        <span className="text-[11px] text-sky-700 font-medium">Dalam Pengiriman</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        {(ord.orderStatus === 'Pending' || ord.orderStatus === 'Processing') && (
                          <button
                            type="button"
                            onClick={() => onCancelOrder && onCancelOrder(ord.id)}
                            className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Batalkan Pesanan</span>
                          </button>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-stone-500 mr-2">Total Pembayaran:</span>
                        <span className="font-serif text-base font-bold text-nvdila-charcoal">
                          {formatRupiah(ord.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Purchase History (Riwayat Pembelian) */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-nvdila-charcoal">
                Riwayat Pembelian Selesai
              </h2>
              <p className="text-xs text-stone-500">
                Arsip seluruh transaksi produk hijab Anda di by.Nvdila
              </p>
            </div>

            {historyOrders.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Belum ada riwayat pembelian"
                description="Riwayat transaksi yang telah selesai akan otomatis tercatat dan tersimpan di sini."
                actionLabel="Mulai Berbelanja"
                onAction={() => setActiveTab('catalog')}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-nvdila-warm/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Tanggal</th>
                        <th className="py-3 px-4">Item Produk</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {historyOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-stone-50/70">
                          <td className="py-3 px-4 font-mono font-medium text-stone-800">{ord.id}</td>
                          <td className="py-3 px-4 text-stone-600">{formatDate(ord.date)}</td>
                          <td className="py-3 px-4 text-stone-700">
                            {ord.items?.map((it) => `${it.productName} (${it.quantity}x)`).join(', ') || '-'}
                          </td>
                          <td className="py-3 px-4 font-serif font-bold text-nvdila-charcoal">{formatRupiah(ord.total)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ord.orderStatus === 'Cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {ord.orderStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Profile (Profil) */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-nvdila-warm/80 p-6 shadow-2xs space-y-5">
              <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
                <div className="w-16 h-16 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-serif text-2xl font-bold">
                  {currentCustomer.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    {currentCustomer.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium border border-amber-200">
                      Member: {currentCustomer.segment}
                    </span>
                    <span className="text-xs text-stone-400 font-mono">
                      ID: {currentCustomer.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-b border-stone-100 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                  <span className="text-[10px] text-stone-400 block mb-0.5">Total Pesanan</span>
                  <span className="font-bold font-serif text-stone-900 text-base">{customerAllOrders.length}</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                  <span className="text-[10px] text-stone-400 block mb-0.5">Total Belanja</span>
                  <span className="font-bold font-serif text-emerald-800 text-sm">{formatRupiah(totalSpent)}</span>
                </div>
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-center">
                  <span className="text-[10px] text-amber-700 block mb-0.5">Status Member</span>
                  <span className="font-bold font-serif text-amber-900 text-base">{currentCustomer.segment}</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                  <span className="text-[10px] text-stone-400 block mb-0.5">Belanja Terakhir</span>
                  <span className="font-semibold text-stone-800 text-xs">{lastPurchaseDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone-400 block mb-1">Nomor WhatsApp</span>
                  <span className="font-semibold text-stone-800">{currentCustomer.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-1">Email Terdaftar</span>
                  <span className="font-semibold text-stone-800">{currentCustomer.email || '-'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-stone-400 block mb-1">Alamat Pengiriman Utama</span>
                  <p className="font-medium text-stone-800 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
                    {currentCustomer.address || 'Alamat belum dilengkapi.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  Keuntungan Loyalitas by.Nvdila ({currentCustomer.segment})
                </span>
                <p className="leading-relaxed">
                  Sebagai member <strong>{currentCustomer.segment}</strong>, Anda berhak mendapatkan prioritas perilisan hijab edisi khusus, voucher kejutan, dan layanan pengiriman cepat di setiap pemesanan.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Product Detail & Direct Checkout Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl border border-nvdila-warm animate-in fade-in zoom-in-95 my-8">
            <div className="relative aspect-16/10 bg-stone-100">
              <img
                src={selectedProduct.image || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80'}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-900/60 text-white hover:bg-stone-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-nvdila-cream border border-nvdila-warm text-nvdila-darkMocha font-medium">
                  {selectedProduct.category}
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900 mt-2">
                  {selectedProduct.name}
                </h3>
                <p className="font-serif text-lg font-bold text-nvdila-charcoal mt-1">
                  {formatRupiah(selectedProduct.price)}
                </p>
              </div>

              {/* Stock status badge */}
              <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500">Ketersediaan Stok:</span>
                <span className={`font-semibold ${selectedProduct.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {selectedProduct.stock > 0 ? `Tersedia (${selectedProduct.stock} pcs)` : 'Habis'}
                </span>
              </div>

              {/* Color variant selection */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Pilihan Warna:
                </label>
                <input
                  type="text"
                  value={purchaseColor}
                  onChange={(e) => setPurchaseColor(e.target.value)}
                  placeholder="Pilih atau ketik varian warna"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 mb-2 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30"
                />
                {getProductColors(selectedProduct).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {getProductColors(selectedProduct).map((col) => {
                      const isSelected = (purchaseColor || '').trim().toLowerCase() === col.trim().toLowerCase();
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setPurchaseColor(col)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                            isSelected
                              ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {col}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quantity selector */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Jumlah Pesanan:
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      disabled={purchaseQty <= 1}
                      onClick={() => setPurchaseQty((q) => Math.max(1, q - 1))}
                      className="p-2 hover:bg-stone-100 disabled:opacity-40 transition text-stone-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={selectedProduct.stock || 1}
                      value={purchaseQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1) {
                          setPurchaseQty(Math.min(val, selectedProduct.stock || 1));
                        }
                      }}
                      className="w-12 text-center text-xs font-bold border-none focus:outline-none py-1"
                    />
                    <button
                      type="button"
                      disabled={purchaseQty >= (selectedProduct.stock || 1)}
                      onClick={() => setPurchaseQty((q) => Math.min((selectedProduct.stock || 1), q + 1))}
                      className="p-2 hover:bg-stone-100 disabled:opacity-40 transition text-stone-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-stone-500">
                    Total: <span className="font-serif font-bold text-stone-900 text-sm">{formatRupiah((selectedProduct.price || 0) * purchaseQty)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address (Wajib) */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Alamat Pengiriman Lengkap <span className="text-rose-500 font-bold">* (Wajib Diisi)</span>:
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Wajib diisi: Masukkan alamat pengiriman lengkap Anda (Jalan, No Rumah, Kota, Kode Pos)"
                  value={purchaseAddress}
                  onChange={(e) => setPurchaseAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30"
                />
              </div>

              {/* Order Notes */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Catatan Pesanan (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Misal: packing box kado, mohon dicek jahitan, dsb"
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30"
                />
              </div>

              {selectedProduct.description && (
                <div>
                  <span className="text-xs font-semibold text-stone-700 block mb-1">Deskripsi & Karakter Bahan:</span>
                  <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  disabled={selectedProduct.stock <= 0}
                  onClick={handleConfirmPurchase}
                  className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {selectedProduct.stock > 0
                      ? `Beli Sekarang • ${formatRupiah((selectedProduct.price || 0) * purchaseQty)}`
                      : 'Stok Produk Habis'}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo Admin by.Nvdila, saya ingin konsultasi produk: ${selectedProduct.name} (Warna: ${purchaseColor || selectedProduct.color})`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Konsultasi via WA</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 text-xs font-medium"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-nvdila-warm/80 py-4 text-center text-xs text-stone-400">
        <p>© 2026 by.Nvdila Hijab. Sistem CRM & Manajemen Pelanggan Resmi.</p>
      </footer>
    </div>
  );
}
