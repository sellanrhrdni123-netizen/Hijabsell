import React, { useState, useEffect } from 'react';
import { X, Image, Tag, DollarSign, Layers, Palette, FileText } from 'lucide-react';

export default function ProductModal({ isOpen, onClose, onSave, product }) {
  const isEditing = Boolean(product);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    image: '',
    category: 'Pashmina Viscose Modal',
    color: '',
    price: '',
    stock: '',
    status: 'Tersedia',
    description: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id || '',
        name: product.name || '',
        image: product.image || '',
        category: product.category || 'Pashmina Viscose Modal',
        color: product.color || '',
        price: product.price || '',
        stock: product.stock !== undefined ? product.stock : '',
        status: product.status || 'Tersedia',
        description: product.description || '',
      });
    } else {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setFormData({
        id: `PRD-${randomSuffix}`,
        name: '',
        image: '',
        category: 'Pashmina Viscose Modal',
        color: '',
        price: '',
        stock: 20,
        status: 'Tersedia',
        description: '',
      });
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama produk wajib diisi.');
      return;
    }
    const numPrice = Number(formData.price) || 0;
    const numStock = Number(formData.stock) || 0;
    let autoStatus = 'Tersedia';
    if (numStock === 0) autoStatus = 'Stok Habis';
    else if (numStock <= 5) autoStatus = 'Stok Menipis';

    onSave({
      ...formData,
      price: numPrice,
      stock: numStock,
      status: formData.status || autoStatus,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-nvdila-warm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-nvdila-warm bg-nvdila-bg flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-nvdila-charcoal">
              {isEditing ? 'Edit Data Produk Hijab' : 'Tambah Produk Hijab Baru'}
            </h3>
            <p className="text-xs text-stone-500">
              Katalog produk resmi brand by.Nvdila
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
                Kode Produk (ID) <span className="text-rose-500">*</span>
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
                Kategori Hijab <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha bg-white"
              >
                <option value="Pashmina Viscose Modal">Pashmina Viscose Modal</option>
                <option value="Hijab Instan/Tali">Hijab Instan/Tali</option>
                <option value="Bergo Instan Praktis">Bergo Instan Praktis</option>
                <option value="Inner/Ciput">Inner/Ciput</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nama Produk <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pashmina Viscose Modal Premium by.Nvdila"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Pilihan Warna / Variasi
            </label>
            <div className="relative">
              <Palette className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Contoh: Mocca, Champagne, Dusty Rose, Sage, Broken White"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Harga (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                required
                placeholder="89000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Jumlah Stok <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="50"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Status Ketersediaan
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha bg-white"
              >
                <option value="Tersedia">Tersedia</option>
                <option value="Stok Menipis">Stok Menipis</option>
                <option value="Stok Habis">Stok Habis</option>
              </select>
            </div>
          </div>

          {/* Image Upload File-Only */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Foto Produk (Upload File dari Perangkat)
            </label>
            <div className="flex items-center gap-3">
              {formData.image && (
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                />
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 transition">
                <span>📁 Pilih File Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setFormData({ ...formData, image: evt.target.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              {formData.image && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image: '' })}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  Hapus Foto
                </button>
              )}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Unggah file gambar JPG, PNG, atau WebP dari perangkat Anda.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Deskripsi Produk & Bahan
            </label>
            <textarea
              rows={3}
              placeholder="Bahan viscose modal premium yang lembut & flowy, jahitan double stitch rapi, pas nempel di kepala tidak licin."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30 focus:border-nvdila-mocha"
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
              {isEditing ? 'Simpan Perubahan' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
