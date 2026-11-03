import React from 'react';
import { Sparkles, Plus } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Sparkles,
  title = "Belum ada data",
  description = "Mulai tambahkan data pertama Anda untuk melihat informasi dan statistik di sini.",
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 md:p-12 bg-white/70 backdrop-blur-sm border border-nvdila-warm/60 rounded-2xl shadow-sm ${className}`}>
      <div className="w-16 h-16 mb-4 rounded-2xl bg-nvdila-cream flex items-center justify-center text-nvdila-mocha border border-nvdila-warm">
        <Icon className="w-8 h-8 stroke-[1.6]" />
      </div>
      <h3 className="font-serif text-xl font-medium text-nvdila-charcoal mb-2">
        {title}
      </h3>
      <p className="text-sm text-stone-500 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nvdila-charcoal hover:bg-nvdila-darkMocha text-white text-sm font-medium transition shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>{actionLabel}</span>
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-nvdila-sand text-nvdila-charcoal hover:bg-nvdila-cream text-sm font-medium transition"
          >
            <span>{secondaryActionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
