import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingCart, User, Calendar, CreditCard, Truck, Store, Hash } from 'lucide-react';
import { formatRupiah, isProductColorAvailable, getProductColors } from '../utils/storage';

export default function OrderModal({
  isOpen,
  onClose,
  onSave,
  order,
  customers = [],
  products = [],
}) {
  const isEditing = Boolean(order);

  const [formData, setFormData] = useState({
    id: '',
    customerId: '',
    customerName: '',
    customerPhone: '',
    items: [],
    total: 0,
    date: new Date().toISOString().slice(0, 10),
    paymentStatus: 'Lunas',
    orderStatus: 'Pending',
    channel: 'Shopee',
    resi: '',
    notes: '',
  });

  useEffect(() => {
    if (order) {
      setFormData({
        id: order.id || '',
        customerId: order.customerId || '',
        customerName: order.customerName || '',
        customerPhone: order.customerPhone || '',
        items: Array.isArray(order.items) && order.items.length > 0 ? [...order.items] : [],
        total: order.total || 0,
        date: order.date || new Date().toISOString().slice(0, 10),
        paymentStatus: order.paymentStatus || 'Lunas',
        orderStatus: order.orderStatus || 'Pending',
        channel: order.channel || 'Shopee',
        resi: order.resi || '',
        notes: order.notes || '',
      });
    } else {
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const initialItem = products.length > 0
        ? [{
            productId: products[0].id,
            productName: products[0].name,
            color: products[0].color ? products[0].color.split(',')[0].trim() : 'Standard',
            price: products[0].price,
            quantity: 1,
            subtotal: products[0].price,
          }]
        : [];

      const initialTotal = initialItem.reduce((s, it) => s + it.subtotal, 0);

      setFormData({
        id: `ORD-${year}-${randomSuffix}`,
        customerId: customers.length > 0 ? customers[0].id : '',
        customerName: customers.length > 0 ? customers[0].name : '',
        customerPhone: customers.length > 0 ? customers[0].phone : '',
        items: initialItem,
        total: initialTotal,
        date: new Date().toISOString().slice(0, 10),
        paymentStatus: 'Lunas',
        orderStatus: 'Processing',
        channel: 'Shopee',
        resi: '',
        notes: '',
      });
    }
  }, [order, isOpen, customers, products]);

  if (!isOpen) return null;

  const handleCustomerChange = (custId) => {
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setFormData({
        ...formData,
        customerId: found.id,
        customerName: found.name,
        customerPhone: found.phone,
      });
    } else {
      setFormData({
        ...formData,
        customerId: custId,
      });
    }
  };

  const handleAddItem = () => {
    if (products.length === 0) {
      alert('Belum ada produk di etalase. Tambahkan produk terlebih dahulu di menu Produk.');
      return;
    }
    const prod = products[0];
    const defaultColor = getProductColors(prod)[0] || '';
    const newItem = {
      productId: prod.id,
      productName: prod.name,
      color: defaultColor,
      price: prod.price,
      quantity: 1,
      subtotal: prod.price,
    };
    const newItems = [...formData.items, newItem];
    const newTotal = newItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
    setFormData({
      ...formData,
      items: newItems,
      total: newTotal,
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      alert('Pesanan harus memiliki minimal 1 produk.');
      return;
    }
    const newItems = formData.items.filter((_, idx) => idx !== index);
    const newTotal = newItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
    setFormData({
      ...formData,
      items: newItems,
      total: newTotal,
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    const current = { ...newItems[index] };

    if (field === 'productId') {
      const selectedProd = products.find((p) => p.id === value);
      if (selectedProd) {
        current.productId = selectedProd.id;
        current.productName = selectedProd.name;
        current.price = selectedProd.price;
        current.subtotal = current.price * current.quantity;
      }
    } else if (field === 'quantity') {
      const q = Math.max(1, Number(value) || 1);
      current.quantity = q;
      current.subtotal = current.price * q;
    } else if (field === 'price') {
      const p = Math.max(0, Number(value) || 0);
      current.price = p;
      current.subtotal = p * current.quantity;
    } else {
      current[field] = value;
    }

    newItems[index] = current;
    const newTotal = newItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
    setFormData({
      ...formData,
      items: newItems,
      total: newTotal,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      alert('Nama pelanggan wajib diisi.');
      return;
    }
    if (formData.items.length === 0) {
      alert('Pilih minimal satu produk pesanan.');
      return;
    }

    for (const item of formData.items) {
      const prod = products.find((p) => p.id === item.productId || p.name === item.productName);
      if (prod && getProductColors(prod).length > 0 && !isProductColorAvailable(prod, item.color)) {
        alert('warna tidak tersedia/habis');
        return;
      }
    }

    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-nvdila-warm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-nvdila-warm bg-nvdila-bg flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-nvdila-charcoal">
              {isEditing ? 'Edit Data Pesanan' : 'Buat Pesanan Baru'}
            </h3>
            <p className="text-xs text-stone-500">
              Kelola detail transaksi dan item hijab pelanggan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Order ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 font-mono bg-stone-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tanggal Pesanan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Saluran Penjualan
              </label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
              >
                <option value="Shopee">Shopee</option>
                <option value="TikTok Shop">TikTok Shop</option>
                <option value="Tokopedia">Tokopedia</option>
                <option value="WhatsApp">WhatsApp Admin</option>
                <option value="Website">Website by.Nvdila</option>
              </select>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-nvdila-mocha" />
                Data Pelanggan
              </span>
              {customers.length > 0 && (
                <span className="text-xs text-stone-500">
                  {customers.length} pelanggan terdaftar
                </span>
              )}
            </div>

            {customers.length > 0 ? (
              <div>
                <label className="block text-xs text-stone-600 mb-1">
                  Pilih dari Pelanggan Terdaftar:
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30"
                >
                  <option value="">-- Pilih Pelanggan atau Input Manual --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || c.email}) - {c.segment}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                Belum ada data pelanggan di database. Masukkan nama & nomor telepon di bawah untuk menyimpan sekaligus.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Nama Pelanggan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="081234567890"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-nvdila-mocha" />
                Item Hijab yang Dipesan
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Item</span>
              </button>
            </div>

            <div className="space-y-2 border border-stone-200 rounded-xl p-3 bg-stone-50/50">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 shadow-2xs">
                  <div className="flex-1 w-full">
                    {products.length > 0 ? (
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full text-xs px-2.5 py-2 rounded-lg border border-stone-300 bg-white"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - {formatRupiah(p.price)} (Stok: {p.stock})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Nama Produk Hijab"
                        value={item.productName}
                        onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                        className="w-full text-xs px-2.5 py-2 rounded-lg border border-stone-300"
                      />
                    )}
                  </div>

                  <div className="w-full sm:w-28">
                    <input
                      type="text"
                      placeholder="Warna"
                      value={item.color}
                      onChange={(e) => handleItemChange(idx, 'color', e.target.value)}
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>

                  <div className="w-full sm:w-20">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-stone-300 text-center font-medium"
                    />
                  </div>

                  <div className="w-full sm:w-28 text-right font-medium text-xs text-stone-700">
                    {formatRupiah(item.subtotal)}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100"
                    title="Hapus baris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Total Summary */}
              <div className="flex items-center justify-between pt-2 px-2 border-t border-stone-200">
                <span className="text-xs font-semibold text-stone-600">Total Belanja:</span>
                <span className="font-serif text-base font-bold text-nvdila-charcoal">
                  {formatRupiah(formData.total)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Status Pembayaran
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
              >
                <option value="Lunas">Lunas</option>
                <option value="Belum Lunas">Belum Lunas</option>
                <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Status Pesanan
              </label>
              <select
                value={formData.orderStatus}
                onChange={(e) => setFormData({ ...formData, orderStatus: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing (Diproses)</option>
                <option value="Shipped">Shipped (Dikirim)</option>
                <option value="Completed">Completed (Selesai)</option>
                <option value="Cancelled">Cancelled (Dibatalkan)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nomor Resi Pengiriman (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: SPXID0294821947"
                value={formData.resi}
                onChange={(e) => setFormData({ ...formData, resi: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Catatan Pesanan
              </label>
              <input
                type="text"
                placeholder="Req pita packing, kartu ucapan, dsb."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-nvdila-charcoal hover:bg-nvdila-darkMocha text-white text-sm font-medium transition shadow-sm"
            >
              {isEditing ? 'Simpan Perubahan' : 'Buat Pesanan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
