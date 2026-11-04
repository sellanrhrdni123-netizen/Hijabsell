// Storage & Calculation Utilities for by.Nvdila CRM

const STORAGE_KEY = 'by_nvdila_crm_data_v1';
const AUTH_KEY = 'by_nvdila_crm_auth_v1';

export const getEmptyState = () => ({
  customers: [],
  products: [],
  orders: [],
  followups: [],
  activities: [],
});

export const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getEmptyState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    const dummyCustomerNames = ['Zahra Amelia Putri', 'Nabila Khairunnisa', 'Fathia Rahmadina', 'Dinda Ayu Maharani', 'Siti Hanifah'];
    const dummyProductIds = ['PRD-001', 'PRD-002', 'PRD-003', 'PRD-004', 'PRD-005', 'PRD-006'];
    const cleanCustomers = (parsed.customers || []).filter(c => !dummyCustomerNames.includes(c.name) && !['CUST-001', 'CUST-002', 'CUST-003', 'CUST-004', 'CUST-005'].includes(c.id));
    const cleanProducts = (parsed.products || []).filter(p => !dummyProductIds.includes(p.id));
    const cleanOrders = (parsed.orders || []).filter(o => !dummyCustomerNames.includes(o.customerName) && !['ORD-2026-001', 'ORD-2026-002', 'ORD-2026-003', 'ORD-2026-004'].includes(o.id));
    const cleanFollowups = (parsed.followups || []).filter(f => !dummyCustomerNames.includes(f.customerName));
    const cleanActivities = (parsed.activities || []).filter(a => !(a.title && a.title.includes('ORD-2026-00')));
    return {
      customers: cleanCustomers,
      products: cleanProducts,
      orders: cleanOrders,
      followups: cleanFollowups,
      activities: cleanActivities,
    };
  } catch (err) {
    console.error('Error loading CRM data:', err);
    return getEmptyState();
  }
};

const SYNC_TOPIC_DEFAULT = 'bynvdila_crm_sync_channel';
const CLIENT_ID = 'react_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

export const getSyncRoom = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const room = localStorage.getItem('by_nvdila_sync_room');
      if (room && room.trim()) return room.trim();
    }
  } catch (e) {}
  return SYNC_TOPIC_DEFAULT;
};

export const broadcastSync = (payload) => {
  if (typeof fetch === 'undefined') return;
  try {
    const room = getSyncRoom();
    fetch(`https://ntfy.sh/${encodeURIComponent(room)}`, {
      method: 'POST',
      headers: {
        'Title': 'BY.NVDILA Sync',
        'Priority': 'default',
      },
      body: JSON.stringify({ clientId: CLIENT_ID, ...payload }),
    }).catch(() => {});
  } catch (e) {}
};

export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (typeof window !== 'undefined' && window._byNvdilaSyncChannel) {
      window._byNvdilaSyncChannel.postMessage({ type: 'DATA_UPDATED' });
    }
    broadcastSync({ type: 'DATA_UPDATE', data, timestamp: Date.now() });
  } catch (err) {
    console.error('Error saving CRM data:', err);
  }
};

export const resetToEmpty = () => {
  const empty = getEmptyState();
  saveData(empty);
  return empty;
};

export const getAuthUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.role) return parsed;
    }
  } catch (e) {
    console.error('Error getting auth user:', e);
  }
  return null;
};

export const setAuthUser = (auth) => {
  try {
    if (auth) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch (e) {
    console.error('Error saving auth user:', e);
  }
};

export const formatRupiah = (num) => {
  const value = Number(num) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const getProductColors = (product) => {
  if (!product) return [];
  const raw = product.color !== undefined ? product.color : (product.colors !== undefined ? product.colors : '');
  const items = Array.isArray(raw) ? raw : [raw];
  const colors = [];
  items.forEach((item) => {
    String(item || '')
      .replace(/\u00A0/g, ' ')
      .split(/[,/;\n|•]+/)
      .forEach((c) => {
        const cleaned = c.replace(/\s+/g, ' ').trim();
        if (cleaned) colors.push(cleaned);
      });
  });
  return [...new Set(colors)];
};

export const isProductColorAvailable = (product, requestedColor) => {
  if (!product) return false;
  const availableColors = getProductColors(product).map((c) => c.toLowerCase());
  if (availableColors.length === 0) return false;
  const req = String(requestedColor || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!req) return false;
  return availableColors.includes(req);
};

// Calculate Segment dynamically based on real transactions
export const calculateCustomerSegment = (customer, customerOrders = []) => {
  const orderCount = customerOrders.length;
  const totalSpent = customerOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  if (orderCount === 0) {
    // Check join date
    if (customer.joinDate) {
      const joinD = new Date(customer.joinDate);
      const now = new Date();
      const diffDays = (now - joinD) / (1000 * 60 * 60 * 24);
      if (diffDays > 60) return 'Inactive Customer';
    }
    return 'New Customer';
  }

  // Check last purchase date
  const sortedOrders = [...customerOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastOrderDate = new Date(sortedOrders[0].date);
  const now = new Date();
  const daysSinceLastOrder = (now - lastOrderDate) / (1000 * 60 * 60 * 24);

  if (daysSinceLastOrder > 90) {
    return 'Inactive Customer';
  }

  if (orderCount >= 8 || totalSpent >= 1500000) {
    return 'VIP Customer';
  }

  if (orderCount >= 4) {
    return 'Loyal Customer';
  }

  if (orderCount >= 2) {
    return 'Regular Customer';
  }

  return 'New Customer';
};

// Recalculate all customer segments according to real orders
export const refreshAllCustomerSegments = (customers, orders) => {
  return customers.map((c) => {
    const custOrders = orders.filter((o) => o.customerId === c.id || (c.name && o.customerName === c.name));
    const newSegment = calculateCustomerSegment(c, custOrders);
    const sortedOrders = [...custOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalSpent = custOrders
      .filter((o) => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const lastPurchaseDate = sortedOrders.length > 0 ? sortedOrders[0].date : (c.lastPurchaseDate || null);
    const totalOrders = custOrders.length;
    const points = Math.floor(totalSpent / 10000);
    return {
      ...c,
      segment: newSegment,
      totalOrders,
      totalSpent,
      lastPurchaseDate,
      points,
    };
  });
};

// Realistic testing sample data specifically for BY.NVDILA brand
export const generateSampleData = () => {
  const products = [
    {
      id: 'PRD-001',
      name: 'Pashmina Viscose Modal Premium BY.NVDILA',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
      category: 'Pashmina Viscose Modal',
      color: 'Espresso, Mauve Taupe, Soft Sand, Broken White',
      price: 89000,
      stock: 45,
      status: 'Tersedia',
      description: 'Bahan viscose modal premium yang ringan, super lembut, adem, dan jatuh flowy. Jahitan rapi double stitch khas BY.NVDILA, pas nempel di kepala tidak licin dan tidak mudah terlihat botak.',
    },
    {
      id: 'PRD-002',
      name: 'Hijab Instan Tali Malay BY.NVDILA',
      image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=600&q=80',
      category: 'Hijab Instan/Tali',
      color: 'Black Jet, Mocca, Sage Green, Dusty Rose',
      price: 69000,
      stock: 38,
      status: 'Tersedia',
      description: 'Model hijab instan yang bisa diatur dengan tali, diikat di belakang lalu dirapikan; cocok untuk styling cepat. Bahan viscose modal adem lembut, jahitan rapi kuat.',
    },
    {
      id: 'PRD-003',
      name: 'Bergo Instan Praktis Daily BY.NVDILA',
      image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=600&q=80',
      category: 'Bergo Instan Praktis',
      color: 'Caramel, Milo, Dark Grey, Navy, Nude',
      price: 59000,
      stock: 50,
      status: 'Tersedia',
      description: 'Versi hijab instan bergo paling praktis, bisa langsung dipakai setelah diikat. Pas nempel di kepala tapi tetap punya flow anggun, nyaman untuk harian.',
    },
    {
      id: 'PRD-004',
      name: 'Pashmina Viscose Modal Flowy Curve',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      category: 'Pashmina Viscose Modal',
      color: 'Oatmeal, Ash Brown, Choco Milk, Soft Lilac',
      price: 95000,
      stock: 22,
      status: 'Tersedia',
      description: 'Pashmina viscose modal dengan cutting curve elegan dan jahitan tepi double stitch rapi. Ringan nyaman seharian, tidak gerah, pas di kepala tidak licin.',
    },
    {
      id: 'PRD-005',
      name: 'Inner Ciput Silang Rajut Anti Pusing',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
      category: 'Inner/Ciput',
      color: 'Black, Cream, Beige, Dark Grey',
      price: 25000,
      stock: 65,
      status: 'Tersedia',
      description: 'Inner ciput rajut combed premium anti pusing, elastis tidak menekan telinga, adem seharian dan mengunci pashmina viscose agar pas nempel di kepala.',
    },
    {
      id: 'PRD-006',
      name: 'Hijab Instan Tali Segitiga Viscose by.Nvdila',
      image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
      category: 'Hijab Instan/Tali',
      color: 'Dusty Pink, Terracotta, Hazelnut',
      price: 75000,
      stock: 4,
      status: 'Stok Menipis',
      description: 'Hijab instan tali model segitiga dari bahan viscose modal premium yang lembut & flowy. Praktis diikat tanpa jarum, jahitan rapi, dan nyaman untuk daily outfit.',
    },
  ];

  const customers = [
    {
      id: 'CUST-001',
      name: 'Zahra Amelia Putri',
      phone: '081234567890',
      email: 'zahra.putri@gmail.com',
      address: 'Jl. Melati No. 14, Menteng, Jakarta Pusat',
      joinDate: '2026-01-10',
      segment: 'VIP Customer',
      status: 'Aktif',
      notes: 'Pelanggan setia sejak koleksi pertama. Menyukai pashmina viscose modal warna espresso dan soft sand.',
    },
    {
      id: 'CUST-002',
      name: 'Nabila Khairunnisa',
      phone: '082198765432',
      email: 'nabila.khair@gmail.com',
      address: 'Cluster Anggrek Blok C2 No. 8, Bintaro, Tangerang Selatan',
      joinDate: '2026-01-28',
      segment: 'Loyal Customer',
      status: 'Aktif',
      notes: 'Sering pesan lewat Shopee Live. Suka bundling bergo instan praktis dan inner ciput.',
    },
    {
      id: 'CUST-003',
      name: 'Fathia Rahmadina',
      phone: '085711223344',
      email: 'fathia.rahm@yahoo.com',
      address: 'Jl. Riau No. 45, Bandung',
      joinDate: '2026-02-14',
      segment: 'Regular Customer',
      status: 'Aktif',
      notes: 'Beli hijab instan tali untuk seragam bridesmaid.',
    },
    {
      id: 'CUST-004',
      name: 'Dinda Ayu Maharani',
      phone: '081399887766',
      email: 'dinda.maharani@gmail.com',
      address: 'Jl. Kaliurang KM 7, Sleman, Yogyakarta',
      joinDate: '2026-03-01',
      segment: 'New Customer',
      status: 'Aktif',
      notes: 'Customer baru dari TikTok Shop.',
    },
    {
      id: 'CUST-005',
      name: 'Siti Hanifah',
      phone: '087855443322',
      email: 'siti.hanifah@gmail.com',
      address: 'Jl. Pemuda No. 88, Semarang',
      joinDate: '2025-11-15',
      segment: 'Inactive Customer',
      status: 'Non-aktif',
      notes: 'Belum transaksi lagi selama 3 bulan terakhir. Perlu ditawari voucher reaktivasi.',
    },
  ];

  const orders = [
    {
      id: 'ORD-2026-001',
      customerId: 'CUST-001',
      customerName: 'Zahra Amelia Putri',
      customerPhone: '081234567890',
      items: [
        { productId: 'PRD-001', productName: 'Pashmina Viscose Modal Premium by.Nvdila', color: 'Espresso', price: 89000, quantity: 2, subtotal: 178000 },
        { productId: 'PRD-005', productName: 'Inner Ciput Silang Rajut Anti Pusing', color: 'Cream', price: 25000, quantity: 2, subtotal: 50000 },
      ],
      total: 228000,
      date: '2026-03-12',
      paymentStatus: 'Lunas',
      orderStatus: 'Completed',
      channel: 'Shopee',
      resi: 'SPXID0294821947',
      notes: 'Packing box exclusive by.Nvdila',
    },
    {
      id: 'ORD-2026-002',
      customerId: 'CUST-002',
      customerName: 'Nabila Khairunnisa',
      customerPhone: '082198765432',
      items: [
        { productId: 'PRD-003', productName: 'Bergo Instan Praktis Daily by.Nvdila', color: 'Caramel', price: 59000, quantity: 3, subtotal: 177000 },
      ],
      total: 177000,
      date: '2026-03-15',
      paymentStatus: 'Lunas',
      orderStatus: 'Shipped',
      channel: 'TikTok Shop',
      resi: 'JNT992817261',
      notes: 'Req kartu ucapan terima kasih',
    },
    {
      id: 'ORD-2026-003',
      customerId: 'CUST-001',
      customerName: 'Zahra Amelia Putri',
      customerPhone: '081234567890',
      items: [
        { productId: 'PRD-002', productName: 'Hijab Instan Tali Malay by.Nvdila', color: 'Black Jet', price: 69000, quantity: 2, subtotal: 138000 },
        { productId: 'PRD-004', productName: 'Pashmina Viscose Modal Flowy Curve', color: 'Oatmeal', price: 95000, quantity: 1, subtotal: 95000 },
      ],
      total: 233000,
      date: '2026-03-18',
      paymentStatus: 'Lunas',
      orderStatus: 'Processing',
      channel: 'WhatsApp',
      resi: '',
      notes: 'Transfer BCA Admin',
    },
    {
      id: 'ORD-2026-004',
      customerId: 'CUST-003',
      customerName: 'Fathia Rahmadina',
      customerPhone: '085711223344',
      items: [
        { productId: 'PRD-006', productName: 'Hijab Instan Tali Segitiga Viscose by.Nvdila', color: 'Dusty Pink', price: 75000, quantity: 2, subtotal: 150000 },
      ],
      total: 150000,
      date: '2026-03-20',
      paymentStatus: 'Lunas',
      orderStatus: 'Pending',
      channel: 'Tokopedia',
      resi: '',
      notes: 'Segera kirim ya min',
    },
  ];

  const followups = [
    {
      id: 'FLW-001',
      customerId: 'CUST-004',
      customerName: 'Dinda Ayu Maharani',
      customerPhone: '081399887766',
      category: 'New Customer',
      date: '2026-03-22',
      status: 'Belum Dihubungi',
      notes: 'Follow-up sambutan pelanggan baru dan tanyakan preferensi model hijab harian.',
    },
    {
      id: 'FLW-002',
      customerId: 'CUST-005',
      customerName: 'Siti Hanifah',
      customerPhone: '087855443322',
      category: 'Inactive Customer',
      date: '2026-03-23',
      status: 'Sedang Dihubungi',
      notes: 'Kirimkan katalog edisi Ramadhan dan voucher diskon 15% reaktivasi.',
    },
    {
      id: 'FLW-003',
      customerId: 'CUST-001',
      customerName: 'Zahra Amelia Putri',
      customerPhone: '081234567890',
      category: 'Product Recommendation',
      date: '2026-03-24',
      status: 'Selesai',
      notes: 'Rekomendasi warna baru Pashmina Viscose Modal Espresso sudah dikirim via WhatsApp.',
    },
  ];

  const activities = [
    {
      id: 'ACT-001',
      timestamp: new Date().toISOString(),
      type: 'order_created',
      title: 'Pesanan Baru ORD-2026-004',
      description: 'Fathia Rahmadina memesan 2x Hijab Instan Tali Segitiga Viscose via Tokopedia',
      customerId: 'CUST-003',
    },
    {
      id: 'ACT-002',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      type: 'customer_added',
      title: 'Pelanggan Baru Terdaftar',
      description: 'Dinda Ayu Maharani ditambahkan ke sistem CRM',
      customerId: 'CUST-004',
    },
    {
      id: 'ACT-003',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      type: 'followup_completed',
      title: 'Follow-up Selesai',
      description: 'Rekomendasi hijab dikirimkan ke Zahra Amelia Putri',
      customerId: 'CUST-001',
    },
  ];

  return { customers, products, orders, followups, activities };
};

// Export to CSV
export const exportOrdersToCSV = (orders) => {
  if (!orders || orders.length === 0) return;
  const headers = ['Order ID', 'Pelanggan', 'No HP', 'Tanggal', 'Status Pesanan', 'Status Pembayaran', 'Channel', 'Total (Rp)', 'Resi'];
  const rows = orders.map((o) => [
    `"${o.id}"`,
    `"${o.customerName || ''}"`,
    `"${o.customerPhone || ''}"`,
    `"${o.date || ''}"`,
    `"${o.orderStatus || ''}"`,
    `"${o.paymentStatus || ''}"`,
    `"${o.channel || ''}"`,
    o.total || 0,
    `"${o.resi || ''}"`,
  ]);
  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `by-nvdila-orders-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
