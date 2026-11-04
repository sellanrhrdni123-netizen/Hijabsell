import React, { useState, useEffect } from 'react';
import {
  loadData,
  saveData,
  resetToEmpty,
  generateSampleData,
  getAuthUser,
  setAuthUser,
  refreshAllCustomerSegments,
  isProductColorAvailable,
} from './utils/storage';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import CustomersView from './components/CustomersView';
import CustomerDetailView from './components/CustomerDetailView';
import ProductsView from './components/ProductsView';
import OrdersView from './components/OrdersView';
import InsightView from './components/InsightView';
import FollowUpView from './components/FollowUpView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import CustomerPortal from './components/CustomerPortal';

// Modals
import CustomerModal from './components/CustomerModal';
import ProductModal from './components/ProductModal';
import OrderModal from './components/OrderModal';
import FollowUpModal from './components/FollowUpModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';

export default function App() {
  const [auth, setAuth] = useState(getAuthUser());
  const [data, setData] = useState(() => {
    const loaded = loadData();
    const synced = refreshAllCustomerSegments(loaded.customers, loaded.orders);
    return { ...loaded, customers: synced };
  });
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerFilterSegment, setCustomerFilterSegment] = useState('ALL');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleNavigate = (view, filter = {}) => {
    setSelectedCustomer(null);
    if (filter && filter.segment) {
      setCustomerFilterSegment(filter.segment);
    } else {
      setCustomerFilterSegment('ALL');
    }
    setCurrentView(view);
    setIsMobileSidebarOpen(false);
  };

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [followUpTargetCustomer, setFollowUpTargetCustomer] = useState(null);

  const [deleteConfig, setDeleteConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Sync to localStorage
  const updateData = (newData) => {
    setData(newData);
    saveData(newData);
  };

  const logActivity = (type, title, description, customerId = null) => {
    const newAct = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      title,
      description,
      customerId,
    };
    return [newAct, ...(data.activities || [])];
  };

  // Auth Handlers
  const handleLogin = (userObj) => {
    const cleanEmail = (userObj.email || '').trim();
    let finalAuth = {
      ...userObj,
      email: cleanEmail,
    };

    if (userObj.role === 'customer') {
      const match = data.customers.find(
        (c) => c.email && c.email.toLowerCase() === cleanEmail.toLowerCase()
      );
      if (match) {
        finalAuth.customerId = match.id;
        finalAuth.name = match.name;
        finalAuth.phone = match.phone;
      } else {
        const emailPrefix = cleanEmail.split('@')[0] || 'customer';
        const formattedName = emailPrefix
          .replace(/[._-]/g, ' ')
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        finalAuth.customerId = userObj.customerId || `CUST-${Date.now().toString().slice(-4)}`;
        finalAuth.name = userObj.name && userObj.name !== 'Pelanggan by.Nvdila' ? userObj.name : formattedName;
      }
    } else {
      if (!finalAuth.name || finalAuth.name === 'Admin by.Nvdila') {
        const isAdminEmail = cleanEmail.toLowerCase().includes('admin');
        finalAuth.name = isAdminEmail ? 'Admin by.Nvdila' : `Admin (${cleanEmail.split('@')[0]})`;
      }
    }

    setAuth(finalAuth);
    setAuthUser(finalAuth);
  };

  const handleLogout = () => {
    setIsMobileSidebarOpen(false);
    setAuth(null);
    setAuthUser(null);
  };

  const handleSwitchRole = (newRole) => {
    setIsMobileSidebarOpen(false);
    const updated = {
      ...auth,
      role: newRole,
      name: newRole === 'admin'
        ? (auth?.email?.toLowerCase().includes('admin') ? 'Admin by.Nvdila' : `Admin (${auth?.email?.split('@')[0] || 'CRM'})`)
        : (auth?.name || 'Pelanggan by.Nvdila'),
      email: auth?.email || (newRole === 'admin' ? 'admin@bynvdila.com' : 'pelanggan@bynvdila.com'),
    };
    setAuth(updated);
    setAuthUser(updated);
  };

  // --- Customer CRUD ---
  const handleSaveCustomer = (custData) => {
    let updatedCustomers;
    let activities;
    const exists = data.customers.some((c) => c.id === custData.id);

    if (exists) {
      updatedCustomers = data.customers.map((c) => (c.id === custData.id ? custData : c));
      activities = logActivity('customer_updated', `Update Pelanggan: ${custData.name}`, `Data profil pelanggan ${custData.name} diperbarui`, custData.id);
    } else {
      updatedCustomers = [custData, ...data.customers];
      activities = logActivity('customer_added', `Pelanggan Baru: ${custData.name}`, `Pelanggan baru berhasil didaftarkan ke sistem CRM`, custData.id);
    }

    // Auto refresh segments based on current orders
    const synced = refreshAllCustomerSegments(updatedCustomers, data.orders);
    updateData({ ...data, customers: synced, activities });

    if (selectedCustomer && selectedCustomer.id === custData.id) {
      setSelectedCustomer(custData);
    }
  };

  const handleDeleteCustomer = (cust) => {
    setDeleteConfig({
      isOpen: true,
      title: 'Hapus Data Pelanggan',
      message: `Apakah Anda yakin ingin menghapus pelanggan "${cust.name}"? Riwayat transaksi pelanggan ini akan tetap ada namun profilnya akan dihapus.`,
      onConfirm: () => {
        const updatedCustomers = data.customers.filter((c) => c.id !== cust.id);
        const activities = logActivity('customer_deleted', `Pelanggan Dihapus: ${cust.name}`, `Data pelanggan ${cust.name} dihapus dari sistem CRM`, cust.id);
        updateData({ ...data, customers: updatedCustomers, activities });
        if (selectedCustomer && selectedCustomer.id === cust.id) {
          setSelectedCustomer(null);
        }
      },
    });
  };

  const handleRefreshSegments = () => {
    const refreshed = refreshAllCustomerSegments(data.customers, data.orders);
    updateData({ ...data, customers: refreshed });
    alert('Segmentasi seluruh pelanggan berhasil dihitung ulang berdasarkan transaksi nyata!');
  };

  // --- Product CRUD ---
  const handleSaveProduct = (prodData) => {
    let updatedProducts;
    let activities;
    const exists = data.products.some((p) => p.id === prodData.id);

    if (exists) {
      updatedProducts = data.products.map((p) => (p.id === prodData.id ? prodData : p));
      activities = logActivity('product_updated', `Update Produk: ${prodData.name}`, `Stok atau detail hijab ${prodData.name} diperbarui`);
    } else {
      updatedProducts = [prodData, ...data.products];
      activities = logActivity('product_added', `Produk Baru: ${prodData.name}`, `Hijab ${prodData.name} ditambahkan ke katalog by.Nvdila`);
    }

    updateData({ ...data, products: updatedProducts, activities });
  };

  const handleDeleteProduct = (prod) => {
    setDeleteConfig({
      isOpen: true,
      title: 'Hapus Produk Hijab',
      message: `Apakah Anda yakin ingin menghapus produk "${prod.name}" dari katalog?`,
      onConfirm: () => {
        const updatedProducts = data.products.filter((p) => p.id !== prod.id);
        const activities = logActivity('product_deleted', `Produk Dihapus: ${prod.name}`, `Produk dihapus dari katalog`);
        updateData({ ...data, products: updatedProducts, activities });
      },
    });
  };

  const handleUpdateStock = (prodId, newStock) => {
    const updated = data.products.map((p) => {
      if (p.id === prodId) {
        let status = 'Tersedia';
        if (newStock === 0) status = 'Stok Habis';
        else if (newStock <= 5) status = 'Stok Menipis';
        return { ...p, stock: newStock, status };
      }
      return p;
    });
    updateData({ ...data, products: updated });
  };

  // --- Order CRUD ---
  const handleSaveOrder = (orderData) => {
    let updatedOrders;
    let activities;
    const exists = data.orders.some((o) => o.id === orderData.id);

    // If new customer specified in order that doesn't exist in customers, auto-create customer!
    let updatedCustomers = [...data.customers];
    if (orderData.customerId && !updatedCustomers.some((c) => c.id === orderData.customerId)) {
      const newCust = {
        id: orderData.customerId,
        name: orderData.customerName,
        phone: orderData.customerPhone || '',
        email: '',
        address: '',
        joinDate: orderData.date,
        segment: 'New Customer',
        status: 'Aktif',
        notes: `Pelanggan otomatis dari pesanan ${orderData.id} (${orderData.channel})`,
      };
      updatedCustomers.push(newCust);
    }

    let updatedProducts = [...data.products];
    if (exists) {
      updatedOrders = data.orders.map((o) => (o.id === orderData.id ? orderData : o));
      activities = logActivity('order_updated', `Pesanan Diperbarui: ${orderData.id}`, `Pesanan ${orderData.customerName} diperbarui`, orderData.customerId);
    } else {
      updatedOrders = [orderData, ...data.orders];
      activities = logActivity('order_created', `Pesanan Baru: ${orderData.id}`, `${orderData.customerName} membuat pesanan via ${orderData.channel || 'Marketplace'}`, orderData.customerId);

      // Decrement product stock immutably if new order created
      if (Array.isArray(orderData.items)) {
        orderData.items.forEach((item) => {
          const matchIdx = updatedProducts.findIndex((p) => p.id === item.productId || p.name === item.productName);
          if (matchIdx !== -1) {
            const currentStock = updatedProducts[matchIdx].stock;
            const newStock = Math.max(0, currentStock - (item.quantity || 1));
            let status = 'Tersedia';
            if (newStock === 0) status = 'Stok Habis';
            else if (newStock <= 5) status = 'Stok Menipis';
            updatedProducts[matchIdx] = {
              ...updatedProducts[matchIdx],
              stock: newStock,
              status,
            };
          }
        });
      }
    }

    // Recalculate customer segments dynamically based on all orders!
    const syncedCustomers = refreshAllCustomerSegments(updatedCustomers, updatedOrders);
    updateData({ ...data, customers: syncedCustomers, orders: updatedOrders, products: updatedProducts, activities });
  };

  const handleDeleteOrder = (order) => {
    setDeleteConfig({
      isOpen: true,
      title: 'Hapus Data Pesanan',
      message: `Apakah Anda yakin ingin menghapus pesanan "${order.id}" milik ${order.customerName}?`,
      onConfirm: () => {
        const updatedOrders = data.orders.filter((o) => o.id !== order.id);
        const activities = logActivity('order_deleted', `Pesanan Dihapus: ${order.id}`, `Pesanan dihapus dari sistem`);

        // Restore product stock upon order deletion
        let updatedProducts = [...data.products];
        if (Array.isArray(order.items)) {
          order.items.forEach((item) => {
            const matchIdx = updatedProducts.findIndex((p) => p.id === item.productId || p.name === item.productName);
            if (matchIdx !== -1) {
              const newStock = updatedProducts[matchIdx].stock + (item.quantity || 1);
              let status = 'Tersedia';
              if (newStock === 0) status = 'Stok Habis';
              else if (newStock <= 5) status = 'Stok Menipis';
              updatedProducts[matchIdx] = {
                ...updatedProducts[matchIdx],
                stock: newStock,
                status,
              };
            }
          });
        }

        const syncedCustomers = refreshAllCustomerSegments(data.customers, updatedOrders);
        updateData({ ...data, orders: updatedOrders, customers: syncedCustomers, products: updatedProducts, activities });
      },
    });
  };

  const handleQuickUpdateOrderStatus = (orderId, newStatus) => {
    const updated = data.orders.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o));
    const activities = logActivity('order_status', `Status Pesanan Berubah: ${orderId}`, `Status diubah menjadi ${newStatus}`);
    const syncedCustomers = refreshAllCustomerSegments(data.customers, updated);
    updateData({ ...data, orders: updated, customers: syncedCustomers, activities });
  };

  // Automated End-to-End Customer Purchase Pipeline
  const handleCustomerPurchase = ({ product, quantity = 1, color = '', address = '', notes = '' }) => {
    if (!isProductColorAvailable(product, color)) {
      alert('warna tidak tersedia/habis');
      return null;
    }
    const cleanAddress = (address || '').trim();
    if (!cleanAddress) {
      alert('Wajib mengisi alamat pengiriman untuk memesan hijab.');
      return null;
    }
    const qty = Math.max(1, Number(quantity) || 1);
    const subtotal = (Number(product.price) || 0) * qty;
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const today = new Date().toISOString().slice(0, 10);
    const selectedColor = (color || '').trim();

    let custId = auth?.customerId;
    let custName = auth?.name || 'Pelanggan by.Nvdila';
    let custPhone = auth?.phone || '';
    let custEmail = auth?.email || '';

    let updatedCustomers = [...data.customers];
    const matchIdx = updatedCustomers.findIndex(
      (c) => (custId && c.id === custId) || (custEmail && c.email && c.email.toLowerCase() === custEmail.toLowerCase())
    );

    if (matchIdx !== -1) {
      custId = updatedCustomers[matchIdx].id;
      custName = updatedCustomers[matchIdx].name;
      custPhone = updatedCustomers[matchIdx].phone || custPhone;
      custEmail = updatedCustomers[matchIdx].email || custEmail;
    } else {
      if (!custId) custId = `CUST-${Date.now().toString().slice(-4)}`;
      const newCust = {
        id: custId,
        name: custName,
        phone: custPhone || '081234567890',
        email: custEmail || 'pelanggan@bynvdila.com',
        address: 'Jl. Melati No. 14, Menteng, Jakarta Pusat',
        joinDate: today,
        segment: 'New Customer',
        status: 'Aktif',
        notes: `Pelanggan Customer Portal via pesanan ${orderId}`,
        totalOrders: 0,
        totalSpent: 0,
        lastPurchaseDate: today,
        points: 0,
      };
      updatedCustomers = [newCust, ...updatedCustomers];
    }

    const newOrder = {
      id: orderId,
      customerId: custId,
      customerName: custName,
      customerPhone: custPhone,
      phone: custPhone,
      customerEmail: custEmail,
      email: custEmail,
      items: [
        {
          productId: product.id,
          productName: product.name,
          color: selectedColor,
          price: product.price,
          quantity: qty,
          subtotal: subtotal,
        },
      ],
      qty: qty,
      total: subtotal,
      date: today,
      channel: 'Customer Portal',
      paymentStatus: 'Lunas',
      orderStatus: 'Processing',
      resi: '',
      notes: notes || 'Pesanan online dari Customer Portal by.Nvdila',
    };

    const updatedOrders = [newOrder, ...data.orders];

    // Deduct product inventory stock
    const updatedProducts = data.products.map((p) => {
      if (p.id === product.id) {
        const newStock = Math.max(0, p.stock - qty);
        let status = 'Tersedia';
        if (newStock === 0) status = 'Stok Habis';
        else if (newStock <= 5) status = 'Stok Menipis';
        return {
          ...p,
          stock: newStock,
          status,
        };
      }
      return p;
    });

    // Automatically log a new customer activity entry in activities
    const activityTitle = `Pesanan Baru: ${product.name}`;
    const activityDesc = `Pelanggan ${custName} memesan ${qty}x ${product.name} via Customer Portal`;
    const newActivities = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'order_created',
        title: activityTitle,
        description: activityDesc,
        customerId: custId,
      },
      ...(data.activities || []),
    ];

    // Recalculate customer loyalty segment, total orders, spending, and last purchase date
    const syncedCustomers = refreshAllCustomerSegments(updatedCustomers, updatedOrders);

    if (selectedCustomer) {
      const refreshedCust = syncedCustomers.find((c) => c.id === selectedCustomer.id || (custId && c.id === custId));
      if (refreshedCust) setSelectedCustomer(refreshedCust);
    }

    updateData({
      ...data,
      customers: syncedCustomers,
      products: updatedProducts,
      orders: updatedOrders,
      activities: newActivities,
    });

    return newOrder;
  };

  const handleCustomerCancelOrder = (orderId) => {
    const ord = data.orders.find((o) => o.id === orderId);
    if (!ord) {
      alert('Pesanan tidak ditemukan.');
      return;
    }
    if (ord.orderStatus === 'Shipped') {
      alert('Pesanan sudah dalam proses pengiriman dan tidak dapat dibatalkan.');
      return;
    }
    if (ord.orderStatus === 'Completed') {
      alert('Pesanan sudah selesai dan tidak dapat dibatalkan.');
      return;
    }
    if (ord.orderStatus === 'Cancelled') {
      alert('Pesanan ini sudah dibatalkan.');
      return;
    }
    if (!window.confirm(`Apakah Anda yakin ingin membatalkan pesanan ${orderId}? Stok produk akan dikembalikan.`)) {
      return;
    }

    let updatedProducts = [...data.products];
    if (Array.isArray(ord.items)) {
      ord.items.forEach((item) => {
        const matchIdx = updatedProducts.findIndex((p) => p.id === item.productId || p.name === item.productName);
        if (matchIdx !== -1) {
          const newStock = updatedProducts[matchIdx].stock + (item.quantity || 1);
          let status = 'Tersedia';
          if (newStock === 0) status = 'Stok Habis';
          else if (newStock <= 5) status = 'Stok Menipis';
          updatedProducts[matchIdx] = {
            ...updatedProducts[matchIdx],
            stock: newStock,
            status,
          };
        }
      });
    }

    const updatedOrders = data.orders.map((o) => (o.id === orderId ? { ...o, orderStatus: 'Cancelled' } : o));
    const newActivities = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'order_cancelled',
        title: `Pesanan Dibatalkan: ${orderId}`,
        description: `Pesanan dibatalkan oleh pelanggan ${auth?.name || 'Pelanggan'}`,
        customerId: ord.customerId,
      },
      ...(data.activities || []),
    ];
    const syncedCustomers = refreshAllCustomerSegments(data.customers, updatedOrders);
    updateData({
      ...data,
      orders: updatedOrders,
      customers: syncedCustomers,
      products: updatedProducts,
      activities: newActivities,
    });
    alert(`Pesanan ${orderId} berhasil dibatalkan. Stok produk telah dikembalikan.`);
  };

  // --- Follow-up CRUD ---
  const handleSaveFollowUp = (flwData) => {
    let updatedFlw;
    let activities;
    const exists = data.followups.some((f) => f.id === flwData.id);

    if (exists) {
      updatedFlw = data.followups.map((f) => (f.id === flwData.id ? flwData : f));
      activities = logActivity('followup_updated', `Update Follow-up: ${flwData.customerName}`, `Status follow-up diubah menjadi ${flwData.status}`, flwData.customerId);
    } else {
      updatedFlw = [flwData, ...data.followups];
      activities = logActivity('followup_created', `Follow-up Baru: ${flwData.customerName}`, `Jadwal reminder ${flwData.category} dibuat`, flwData.customerId);
    }

    updateData({ ...data, followups: updatedFlw, activities });
  };

  const handleDeleteFollowUp = (flw) => {
    setDeleteConfig({
      isOpen: true,
      title: 'Hapus Jadwal Follow-up',
      message: `Hapus reminder follow-up untuk "${flw.customerName}"?`,
      onConfirm: () => {
        const updatedFlw = data.followups.filter((f) => f.id !== flw.id);
        updateData({ ...data, followups: updatedFlw });
      },
    });
  };

  const handleQuickUpdateFollowUpStatus = (flwId, newStatus) => {
    const updated = data.followups.map((f) => (f.id === flwId ? { ...f, status: newStatus } : f));
    updateData({ ...data, followups: updated });
  };

  // --- Settings: Sample Data & Reset ---
  const handleLoadSampleData = () => {
    const sample = generateSampleData();
    const synced = refreshAllCustomerSegments(sample.customers, sample.orders);
    updateData({ ...sample, customers: synced });
  };

  const handleResetToEmpty = () => {
    const empty = resetToEmpty();
    setData(empty);
    setSelectedCustomer(null);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `by-nvdila-crm-backup-${new Date().toISOString().slice(0, 10)}.json`);
    dl.click();
  };

  const handleImportJSON = (json) => {
    if (json && typeof json === 'object') {
      const formatted = {
        customers: Array.isArray(json.customers) ? json.customers : [],
        products: Array.isArray(json.products) ? json.products : [],
        orders: Array.isArray(json.orders) ? json.orders : [],
        followups: Array.isArray(json.followups) ? json.followups : [],
        activities: Array.isArray(json.activities) ? json.activities : [],
      };
      updateData(formatted);
    }
  };

  // If not logged in, show Login
  if (!auth) {
    return <LoginView onLogin={handleLogin} />;
  }

  // If customer role, show Customer Portal
  if (auth.role === 'customer') {
    return (
      <CustomerPortal
        user={auth}
        customers={data.customers}
        products={data.products}
        orders={data.orders}
        onPlaceOrder={handleCustomerPurchase}
        onCancelOrder={handleCustomerCancelOrder}
        onSwitchToAdmin={() => handleSwitchRole('admin')}
        onLogout={handleLogout}
      />
    );
  }

  // Header Titles Map
  const viewTitles = {
    dashboard: { title: 'Dashboard CRM', subtitle: 'Ikhtisar performa bisnis hijab & segmentasi pelanggan BY.NVDILA' },
    customers: { title: 'Daftar Pelanggan', subtitle: 'Manajemen database & riwayat profil pelanggan' },
    products: { title: 'Katalog Produk Hijab', subtitle: 'Manajemen produk, warna, harga, dan ketersediaan stok' },
    orders: { title: 'Manajemen Pesanan', subtitle: 'Transaksi pesanan dari Shopee, TikTok Shop, Tokopedia & WhatsApp' },
    insight: { title: 'Customer Insight', subtitle: 'Analisis analitis pertumbuhan & loyalitas pelanggan' },
    followup: { title: 'CRM Follow-up', subtitle: 'Otomasi pengingat sapaan, penawaran warna baru, & reaktivasi' },
    reports: { title: 'Laporan Penjualan', subtitle: 'Laporan berkala kinerja penjualan hijab' },
    settings: { title: 'Pengaturan Sistem', subtitle: 'Konfigurasi akun, integrasi marketplace, dan opsi data' },
  };

  const currentHeaderInfo = viewTitles[currentView] || { title: 'BY.NVDILA', subtitle: '' };

  return (
    <div className="min-h-screen bg-nvdila-bg flex font-sans text-stone-800">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={(view) => {
          setSelectedCustomer(null);
          setCurrentView(view);
          setIsMobileSidebarOpen(false);
        }}
        user={auth}
        onLogout={handleLogout}
        counts={{
          customers: data.customers.length,
          products: data.products.length,
          orders: data.orders.length,
          followups: data.followups.filter((f) => f.status === 'Belum Dihubungi').length,
        }}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={selectedCustomer ? `Profil: ${selectedCustomer.name}` : currentHeaderInfo.title}
          subtitle={selectedCustomer ? `Customer ID: ${selectedCustomer.id}` : currentHeaderInfo.subtitle}
          onOpenAddCustomer={currentView === 'customers' ? () => {
            setEditingCustomer(null);
            setIsCustomerModalOpen(true);
          } : undefined}
          onOpenAddProduct={currentView === 'products' ? () => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          } : undefined}
          onOpenAddOrder={currentView === 'orders' ? () => {
            setEditingOrder(null);
            setIsOrderModalOpen(true);
          } : undefined}
          onOpenAddFollowUp={currentView === 'followup' ? () => {
            setEditingFollowUp(null);
            setFollowUpTargetCustomer(null);
            setIsFollowUpModalOpen(true);
          } : undefined}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          user={auth}
        />

        {/* Content Body */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <DashboardView
              customers={data.customers}
              orders={data.orders}
              products={data.products}
              activities={data.activities}
              onNavigate={handleNavigate}
            />
          )}

          {/* Customers View or Customer Detail View */}
          {currentView === 'customers' && (
            selectedCustomer ? (
              <CustomerDetailView
                customer={data.customers.find((c) => c.id === selectedCustomer.id) || selectedCustomer}
                orders={data.orders}
                followups={data.followups}
                activities={data.activities}
                onBack={() => setSelectedCustomer(null)}
                onEdit={(c) => {
                  setEditingCustomer(c);
                  setIsCustomerModalOpen(true);
                }}
                onDelete={handleDeleteCustomer}
                onOpenAddOrderForCustomer={(c) => {
                  setEditingOrder({
                    customerId: c.id,
                    customerName: c.name,
                    customerPhone: c.phone,
                  });
                  setIsOrderModalOpen(true);
                }}
                onOpenAddFollowUpForCustomer={(c) => {
                  setFollowUpTargetCustomer(c);
                  setEditingFollowUp(null);
                  setIsFollowUpModalOpen(true);
                }}
              />
            ) : (
              <CustomersView
                customers={data.customers}
                orders={data.orders}
                initialSegmentFilter={customerFilterSegment}
                onOpenAdd={() => {
                  setEditingCustomer(null);
                  setIsCustomerModalOpen(true);
                }}
                onOpenEdit={(c) => {
                  setEditingCustomer(c);
                  setIsCustomerModalOpen(true);
                }}
                onOpenDelete={handleDeleteCustomer}
                onSelectCustomer={(c) => setSelectedCustomer(c)}
                onRefreshSegments={handleRefreshSegments}
              />
            )
          )}

          {/* Products View */}
          {currentView === 'products' && (
            <ProductsView
              products={data.products}
              onOpenAdd={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              onOpenEdit={(p) => {
                setEditingProduct(p);
                setIsProductModalOpen(true);
              }}
              onOpenDelete={handleDeleteProduct}
              onUpdateStock={handleUpdateStock}
            />
          )}

          {/* Orders View */}
          {currentView === 'orders' && (
            <OrdersView
              orders={data.orders}
              customers={data.customers}
              onOpenAdd={() => {
                setEditingOrder(null);
                setIsOrderModalOpen(true);
              }}
              onOpenEdit={(o) => {
                setEditingOrder(o);
                setIsOrderModalOpen(true);
              }}
              onOpenDelete={handleDeleteOrder}
              onQuickUpdateStatus={handleQuickUpdateOrderStatus}
            />
          )}

          {/* Customer Insight View */}
          {currentView === 'insight' && (
            <InsightView
              customers={data.customers}
              orders={data.orders}
              products={data.products}
              onOpenAddCustomer={() => {
                setEditingCustomer(null);
                setIsCustomerModalOpen(true);
              }}
              onOpenAddOrder={() => {
                setEditingOrder(null);
                setIsOrderModalOpen(true);
              }}
              onOpenFollowUp={(c) => {
                setFollowUpTargetCustomer(c);
                setEditingFollowUp(null);
                setIsFollowUpModalOpen(true);
              }}
            />
          )}

          {/* Follow-up View */}
          {currentView === 'followup' && (
            <FollowUpView
              followups={data.followups}
              customers={data.customers}
              onOpenAdd={() => {
                setFollowUpTargetCustomer(null);
                setEditingFollowUp(null);
                setIsFollowUpModalOpen(true);
              }}
              onOpenEdit={(f) => {
                setEditingFollowUp(f);
                setIsFollowUpModalOpen(true);
              }}
              onOpenDelete={handleDeleteFollowUp}
              onQuickUpdateStatus={handleQuickUpdateFollowUpStatus}
            />
          )}

          {/* Reports View */}
          {currentView === 'reports' && (
            <ReportsView
              customers={data.customers}
              orders={data.orders}
              products={data.products}
              onOpenAddOrder={() => {
                setEditingOrder(null);
                setIsOrderModalOpen(true);
              }}
            />
          )}

          {/* Settings View */}
          {currentView === 'settings' && (
            <SettingsView
              onLoadSampleData={handleLoadSampleData}
              onResetToEmpty={handleResetToEmpty}
              onExportJSON={handleExportJSON}
              onImportJSON={handleImportJSON}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
      />

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSave={handleSaveOrder}
        order={editingOrder}
        customers={data.customers}
        products={data.products}
      />

      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        onSave={handleSaveFollowUp}
        followup={editingFollowUp}
        customers={data.customers}
        initialCustomer={followUpTargetCustomer}
      />

      <DeleteConfirmModal
        isOpen={deleteConfig.isOpen}
        onClose={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}
        onConfirm={deleteConfig.onConfirm}
        title={deleteConfig.title}
        message={deleteConfig.message}
      />
    </div>
  );
}
