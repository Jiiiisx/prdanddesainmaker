import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { ColorSwatch } from '../types';

interface ColorPaletteSectionProps {
  colors: ColorSwatch[];
  title?: string;
  subtitle?: string;
  copiedText?: string;
}

export const ColorPaletteSection: React.FC<ColorPaletteSectionProps> = ({
  colors,
  title = 'Interactive Color Tokens',
  subtitle = 'Klik swatch untuk copy hex',
  copiedText = 'Tersalin!',
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <div className="mt-4 pt-3 border-t-2 border-[#18181B]/15">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-black text-[#18181B] uppercase tracking-wider">
          {title}
        </span>
        <span className="text-[11px] font-semibold text-slate-500">{subtitle}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {colors.map((c, i) => {
          const isCopied = copiedHex === c.hex;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleCopy(c.hex)}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-white hover:bg-slate-50 border-1.5 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-left group focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div
                className="w-7 h-7 rounded-md border-1.5 border-[#18181B] shadow-[1px_1px_0px_0px_#18181B] flex items-center justify-center shrink-0 relative overflow-hidden"
                style={{ backgroundColor: c.hex }}
              >
                {isCopied && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-500 truncate">{c.name}</p>
                <p className="text-xs font-mono font-bold text-[#18181B] group-hover:text-indigo-600 truncate flex items-center gap-1">
                  {c.hex}
                  {isCopied ? (
                    <span className="text-[10px] text-emerald-700 font-sans font-bold">{copiedText}</span>
                  ) : (
                    <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                  )}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
