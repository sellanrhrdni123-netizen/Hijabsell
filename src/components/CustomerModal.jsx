import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Tag, ShieldCheck, FileText } from 'lucide-react';

export default function CustomerModal({ isOpen, onClose, onSave, customer }) {
  const isEditing = Boolean(customer);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    joinDate: new Date().toISOString().slice(0, 10),
    segment: 'New Customer',
    status: 'Aktif',
    notes: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        id: customer.id || '',
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        joinDate: customer.joinDate || new Date().toISOString().slice(0, 10),
        segment: customer.segment || 'New Customer',
        status: customer.status || 'Aktif',
        notes: customer.notes || '',
      });
    } else {
      // Auto-generate clean ID
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setFormData({
        id: `CUST-${randomSuffix}`,
        name: '',
        phone: '',
        email: '',
        address: '',
        joinDate: new Date().toISOString().slice(0, 10),
        segment: 'New Customer',
        status: 'Aktif',
        notes: '',
      });
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama pelanggan wajib diisi.');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-nvdila-warm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-nvdila-warm bg-nvdila-bg flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-nvdila-charcoal">
              {isEditing ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
            </h3>
            <p className="text-xs text-stone-500">
              {isEditing ? 'Perbarui profil pelanggan by.Nvdila' : 'Daftarkan pelanggan baru ke sistem CRM'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Customer ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha bg-stone-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tanggal Bergabung <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.joinDate}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nama Lengkap Pelanggan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="Contoh: Zahra Amelia Putri"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  placeholder="08123456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="zahra@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Alamat Pengiriman Lengkap
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <textarea
                rows={2}
                placeholder="Jl. Melati No. 14, Menteng, Jakarta Pusat, DKI Jakarta"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Segment Pelanggan
              </label>
              <select
                value={formData.segment}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha bg-white"
              >
                <option value="New Customer">New Customer (Pelanggan Baru)</option>
                <option value="Regular Customer">Regular Customer (Biasa)</option>
                <option value="Loyal Customer">Loyal Customer (Setia)</option>
                <option value="VIP Customer">VIP Customer (Prioritas)</option>
                <option value="Inactive Customer">Inactive Customer (Tidak Aktif)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Status Pelanggan
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha bg-white"
              >
                <option value="Aktif">Aktif</option>
                <option value="Non-aktif">Non-aktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Catatan Pelanggan
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <textarea
                rows={2}
                placeholder="Preferensi warna hijab, marketplace langganan, ukuran pashmina, dsb."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
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
              {isEditing ? 'Simpan Perubahan' : 'Simpan Pelanggan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
