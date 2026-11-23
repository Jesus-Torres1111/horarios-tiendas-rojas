import { useState, useEffect } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { DEFAULT_COLORS } from '../utils/constants';
import { PATTERNS, PATTERN_ICONS } from '../utils/format';

const PALETTE = Array.from(new Set([...DEFAULT_COLORS, '#faf20f', '#06b6d4', '#ff84a1', '#b97e2b']));

export default function AddPersonModal({ onClose, onCreate, storeName, suggestedName, suggestedColor }) {
  const [name, setName] = useState(suggestedName);
  const [color, setColor] = useState(suggestedColor);
  const [pattern, setPattern] = useState('manana');

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ name: name.trim() || suggestedName, color, pattern });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full sm:max-w-lg rounded-t-[28px] sm:rounded-[28px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl pop-in"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-[#d50000] flex items-center justify-center">
              <UserPlus size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg leading-tight">Agregar personal</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{storeName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full bg-slate-50 border border-slate-100 text-slate-400 hover:text-[#d50000] transition-colors">
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Nombre</label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full shrink-0 shadow-sm flex items-center justify-center text-white font-black text-lg"
                style={{ backgroundColor: color }}
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                placeholder="Ej: MARIA"
                maxLength={20}
                autoFocus
                className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-sm font-black uppercase text-slate-900 placeholder-slate-300 focus:outline-none focus:border-[#d50000] focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Color en el horario</label>
            <div className="flex flex-wrap items-center gap-2">
              {PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-90 ${color.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-offset-2 ring-slate-900' : ''}`}
                  style={{ backgroundColor: c }}
                >
                  {color.toLowerCase() === c.toLowerCase() && <Check size={16} strokeWidth={3} className="text-white mix-blend-difference" />}
                </button>
              ))}
              <label className="w-9 h-9 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-lg font-black cursor-pointer hover:border-slate-500 overflow-hidden relative">
                +
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">¿Cómo trabaja?</label>
            <div className="space-y-2">
              {PATTERNS.map(p => {
                const Icon = PATTERN_ICONS[p.id];
                const selected = pattern === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPattern(p.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${selected ? 'border-[#d50000] bg-red-50/60' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-[#d50000] text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-black text-sm ${selected ? 'text-slate-900' : 'text-slate-700'}`}>{p.label}</div>
                      <div className="text-[11px] font-semibold text-slate-400 leading-tight mt-0.5">{p.description}</div>
                    </div>
                    {selected && <Check size={18} strokeWidth={3} className="text-[#d50000] shrink-0" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-3">Después puedes cambiar cualquier día tocándolo en la tabla.</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-white flex gap-3 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" className="flex-[2] py-3.5 rounded-xl bg-[#d50000] hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/20 transition-all active:scale-[0.98]">
            Agregar a la tienda
          </button>
        </div>
      </form>
    </div>
  );
}