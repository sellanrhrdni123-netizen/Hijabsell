import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Package,
  Layers,
} from 'lucide-react';
import { formatRupiah } from '../utils/storage';
import EmptyState from './EmptyState';

export default function ProductsView({
  products = [],
  onOpenAdd,
  onOpenEdit,
  onOpenDelete,
  onUpdateStock,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (p.name || '').toLowerCase().includes(term) ||
      (p.id || '').toLowerCase().includes(term) ||
      (p.color || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term);

    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const getStockBadge = (stock, status) => {
    if (stock === 0 || status === 'Stok Habis') {
      return { label: 'Stok Habis', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
    if (stock <= 5 || status === 'Stok Menipis') {
      return { label: `Menipis (${stock})`, bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    return { label: `Tersedia (${stock})`, bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-nvdila-charcoal">
            Katalog Produk Hijab by.Nvdila
          </h2>
          <p className="text-xs text-stone-500">
            Kelola inventaris, variasi warna, harga jual, dan stok produk
          </p>
        </div>

        <button
          onClick={onOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nvdila-charcoal hover:bg-nvdila-darkMocha text-white text-xs font-semibold transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk Hijab</span>
        </button>
      </div>

      {/* Filter and View Toggles */}
      {products.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-nvdila-warm/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama hijab, kode produk, warna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nvdila-taupe/30"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Pashmina Viscose Modal">Pashmina Viscose Modal</option>
              <option value="Hijab Instan/Tali">Hijab Instan/Tali</option>
              <option value="Bergo Instan Praktis">Bergo Instan Praktis</option>
              <option value="Inner/Ciput">Inner/Ciput</option>
            </select>

            <div className="flex border border-stone-200 rounded-xl overflow-hidden bg-stone-50 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                  viewMode === 'grid' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                  viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                Tabel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      {products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Belum ada produk"
          description="Katalog produk by.Nvdila masih kosong. Tambahkan produk hijab pertama Anda untuk mulai mengelola stok dan pesanan."
          actionLabel="Tambah Produk Baru"
          onAction={onOpenAdd}
        />
      ) : filteredProducts.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
          <p className="text-sm font-medium text-stone-700">Tidak ada produk yang cocok dengan pencarian.</p>
          <button
            onClick={() => { setSearchTerm(''); setCategoryFilter('ALL'); }}
            className="text-xs text-nvdila-darkMocha underline mt-2 font-medium"
          >
            Reset Filter
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((p) => {
            const badge = getStockBadge(p.stock, p.status);
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-nvdila-warm/80 shadow-2xs overflow-hidden flex flex-col justify-between group hover:shadow-md transition"
              >
                {/* Image & Category Tag */}
                <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                  <img
                    src={p.image || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-xs text-white font-medium">
                      {p.category}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-stone-400">{p.id}</span>
                    <h3 className="font-serif text-sm font-semibold text-stone-900 line-clamp-1 mt-0.5">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-1">
                      Warna: {p.color || '-'}
                    </p>
                    {p.description && (
                      <p className="text-[11px] text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Harga Jual</span>
                      <span className="font-serif text-sm font-bold text-nvdila-charcoal">
                        {formatRupiah(p.price)}
                      </span>
                    </div>

                    {/* Stock Quick Adjustment */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateStock && onUpdateStock(p.id, Math.max(0, p.stock - 1))}
                        className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center transition"
                        title="Kurangi stok (-1)"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-medium px-1.5 min-w-[20px] text-center">
                        {p.stock}
                      </span>
                      <button
                        onClick={() => onUpdateStock && onUpdateStock(p.id, p.stock + 1)}
                        className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center transition"
                        title="Tambah stok (+1)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onOpenEdit(p)}
                    className="text-xs px-2.5 py-1 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-white transition flex items-center gap-1 font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onOpenDelete(p)}
                    className="text-xs px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 transition flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-nvdila-warm/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Varian Warna</th>
                  <th className="py-3 px-4">Harga</th>
                  <th className="py-3 px-4">Stok</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((p) => {
                  const badge = getStockBadge(p.stock, p.status);
                  return (
                    <tr key={p.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80'}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                          />
                          <div>
                            <span className="font-mono text-[10px] text-stone-400 block">{p.id}</span>
                            <span className="font-semibold text-stone-900">{p.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600">{p.category}</td>
                      <td className="py-3 px-4 text-stone-600 max-w-xs truncate">{p.color || '-'}</td>
                      <td className="py-3 px-4 font-serif font-bold text-nvdila-charcoal">{formatRupiah(p.price)}</td>
                      <td className="py-3 px-4 font-mono font-medium">{p.stock} pcs</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenEdit(p)}
                            className="p-1.5 text-stone-400 hover:text-stone-800 rounded hover:bg-stone-100"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenDelete(p)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
