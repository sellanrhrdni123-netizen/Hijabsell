import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi Hapus",
  message = "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                {title}
              </h3>
              <p className="text-xs text-stone-500">
                Peringatan tindakan permanen
              </p>
            </div>
          </div>

          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            {message}
          </p>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-medium transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition shadow-sm"
            >
              Ya, Hapus Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
