import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Calendar, User, Tag, Sparkles } from 'lucide-react';

export default function FollowUpModal({
  isOpen,
  onClose,
  onSave,
  followup,
  customers = [],
  initialCustomer = null,
}) {
  const isEditing = Boolean(followup);

  const [formData, setFormData] = useState({
    id: '',
    customerId: '',
    customerName: '',
    customerPhone: '',
    category: 'New Customer',
    date: new Date().toISOString().slice(0, 10),
    status: 'Belum Dihubungi',
    notes: '',
  });

  const getTemplateMessage = (category, name) => {
    const cust = name || 'Kakak';
    switch (category) {
      case 'New Customer':
        return `Halo ${cust}, terima kasih sudah berbelanja hijab di by.Nvdila! Bagaimana kesan pemakaian hijab pertamanya kak? Semoga nyaman dan suka dengan bahannya ya ✨`;
      case 'Repeat Purchase':
        return `Assalamu'alaikum ${cust}! by.Nvdila baru saja merilis variasi warna baru untuk koleksi favorit kakak lho. Ada penawaran khusus potongan 10% untuk repeat order minggu ini ✨`;
      case 'Inactive Customer':
        return `Halo ${cust}, kami rindu kakak di by.Nvdila! Ini voucher eksklusif potongan Rp 20.000 (KODE: KANGENBYNVDILA) untuk koleksi hijab terbaru kami. Yuk cek sekarang! 🌸`;
      case 'Product Recommendation':
        return `Halo ${cust}, berdasarkan hijab yang kakak sukai sebelumnya, kami rekomendasikan French Khimar atau Pashmina Silk warna Earth Tone by.Nvdila yang super anggun & serasi!`;
      default:
        return `Halo ${cust}, salam hangat dari tim by.Nvdila!`;
    }
  };

  useEffect(() => {
    if (followup) {
      setFormData({
        id: followup.id || '',
        customerId: followup.customerId || '',
        customerName: followup.customerName || '',
        customerPhone: followup.customerPhone || '',
        category: followup.category || 'New Customer',
        date: followup.date || new Date().toISOString().slice(0, 10),
        status: followup.status || 'Belum Dihubungi',
        notes: followup.notes || '',
      });
    } else {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const targetCustomer = initialCustomer || (customers.length > 0 ? customers[0] : null);
      const custName = targetCustomer ? targetCustomer.name : '';
      const custId = targetCustomer ? targetCustomer.id : '';
      const custPhone = targetCustomer ? targetCustomer.phone : '';
      const defaultCat = 'New Customer';

      setFormData({
        id: `FLW-${randomSuffix}`,
        customerId: custId,
        customerName: custName,
        customerPhone: custPhone,
        category: defaultCat,
        date: new Date().toISOString().slice(0, 10),
        status: 'Belum Dihubungi',
        notes: getTemplateMessage(defaultCat, custName),
      });
    }
  }, [followup, isOpen, initialCustomer, customers]);

  if (!isOpen) return null;

  const handleCustomerSelect = (id) => {
    const found = customers.find((c) => c.id === id);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        customerId: found.id,
        customerName: found.name,
        customerPhone: found.phone,
        notes: prev.notes || getTemplateMessage(prev.category, found.name),
      }));
    }
  };

  const handleCategoryChange = (newCat) => {
    setFormData((prev) => ({
      ...prev,
      category: newCat,
      notes: getTemplateMessage(newCat, prev.customerName),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      alert('Nama pelanggan wajib diisi.');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-nvdila-warm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-nvdila-warm bg-nvdila-bg flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-nvdila-charcoal">
              {isEditing ? 'Edit Data Follow-up' : 'Buat Jadwal Follow-up'}
            </h3>
            <p className="text-xs text-stone-500">
              Reminder & komunikasi personal pelanggan by.Nvdila
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Pilih Pelanggan <span className="text-rose-500">*</span>
            </label>
            {customers.length > 0 ? (
              <select
                value={formData.customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
              >
                <option value="">-- Pilih Pelanggan --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || c.email}) - {c.segment}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                placeholder="Nama Pelanggan"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Kategori Follow-up
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
              >
                <option value="New Customer">New Customer (Sapaan Awal)</option>
                <option value="Repeat Purchase">Repeat Purchase (Tawaran Baru)</option>
                <option value="Inactive Customer">Inactive Customer (Reaktivasi)</option>
                <option value="Product Recommendation">Product Recommendation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tanggal Pengingat
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Status Follow-up
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
            >
              <option value="Belum Dihubungi">Belum Dihubungi (Pending)</option>
              <option value="Sedang Dihubungi">Sedang Dihubungi (In Progress)</option>
              <option value="Selesai">Selesai (Completed)</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-stone-700">
                Pesan / Catatan Follow-up
              </label>
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    notes: getTemplateMessage(p.category, p.customerName),
                  }))
                }
                className="text-[11px] text-nvdila-mocha hover:underline flex items-center gap-1 font-medium"
              >
                <Sparkles className="w-3 h-3" />
                Reset ke Template
              </button>
            </div>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30"
              placeholder="Tulis draf pesan WhatsApp atau catatan admin..."
            />
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
              {isEditing ? 'Simpan Perubahan' : 'Buat Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
