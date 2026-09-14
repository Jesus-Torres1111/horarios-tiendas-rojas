import { useState } from 'react';
import { X, Check, Clock } from 'lucide-react';
import { DAYS, HOURS, SHIFT_TYPES } from '../utils/constants';

export default function ShiftModal({ isOpen, onClose, personName, personColor, day, currentShift, onSave, isBulk, onUpdateName, onUpdateColor }) {
  const [selectedDays, setSelectedDays] = useState(isBulk ? [...DAYS] : [day]);
  const [localShift, setLocalShift] = useState({ ...currentShift });
  const [localName, setLocalName] = useState(personName);
  const [localColor, setLocalColor] = useState(personColor);

  if (!isOpen) return null;

  const toggleDay = (d) => {
    setSelectedDays(prev => {
      if (prev.includes(d) && prev.length > 1) return prev.filter(x => x !== d);
      if (!prev.includes(d)) return [...prev, d];
      return prev;
    });
  };

  const handleConfirm = () => {
    onSave(localShift.type, localShift.start, localShift.end, selectedDays);
    if (localName.trim() !== personName) onUpdateName(localName.trim());
    if (localColor !== personColor) onUpdateColor(localColor);
    onClose();
  };

  const isCustom = localShift.type === 'personalizado';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 fade-in" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-[750px] max-h-[90vh] rounded-[24px] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        <div className={`flex flex-col bg-white border-b md:border-b-0 md:border-r border-slate-100 overflow-hidden ${isCustom ? 'md:w-5/12' : 'w-full'}`}>
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <input type="color" value={localColor} onChange={(e) => setLocalColor(e.target.value)} className="w-10 h-10 p-0 border-0 rounded-full cursor-pointer shadow-sm shrink-0 bg-transparent overflow-hidden" />
              <div className="flex flex-col">
                <input type="text" value={localName} onChange={(e) => setLocalName(e.target.value.toUpperCase())} placeholder="Nombre..." className="font-black text-slate-900 text-lg bg-transparent border-b-2 border-dashed border-slate-200 focus:border-[#d50000] focus:bg-slate-50 px-1 outline-none w-full max-w-[160px] transition-colors uppercase" />
                <span className="text-[10px] font-bold text-slate-400 mt-1 px-1 uppercase tracking-widest">Editar empleado</span>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-[#d50000] bg-white shadow-sm p-2 rounded-full transition-colors border border-slate-100 self-start">
              <X size={16} strokeWidth={3}/>
            </button>
          </div>

          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asignar a los días</label>
              <button onClick={() => setSelectedDays([...DAYS])} className="text-[10px] font-black text-[#d50000] hover:underline uppercase tracking-widest">Toda la semana</button>
            </div>
            <div className="flex gap-1.5">
              {DAYS.map(d => {
                const isSel = selectedDays.includes(d);
                return (
                  <button key={d} onClick={() => toggleDay(d)} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-colors border-2 ${isSel ? 'bg-[#d50000] border-[#d50000] text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                    {d.substring(0, 2)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 space-y-3 overflow-y-auto flex-1 bg-slate-50/30">
            {SHIFT_TYPES.map(opt => {
              const isSelected = localShift.type === opt.id;
              const Icon = opt.icon;
              return (
                <button key={opt.id} onClick={() => setLocalShift(prev => ({ ...prev, type: opt.id }))} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all ${isSelected ? 'border-[#d50000] ring-1 ring-[#d50000] bg-white shadow-md' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
                  <div className="flex items-center gap-4">
                    <Icon size={20} className={isSelected ? 'text-[#d50000]' : 'text-slate-400'} strokeWidth={2.5}/>
                    <div>
                      <div className={`font-black text-sm uppercase ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>{opt.label}</div>
                      <div className={`text-[10px] font-bold tracking-wide ${isSelected ? 'text-[#d50000]' : 'text-slate-400'}`}>{opt.getRange()}</div>
                    </div>
                  </div>
                  {isSelected && <Check size={20} className="text-[#d50000]" strokeWidth={3}/>}
                </button>
              );
            })}
          </div>

          {!isCustom && (
            <div className="p-5 border-t border-slate-100 bg-white shrink-0">
              <button onClick={handleConfirm} className="w-full py-3.5 bg-[#d50000] hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98]">
                Guardar y cerrar
              </button>
            </div>
          )}
        </div>

        {isCustom && (
          <div className="md:w-7/12 flex flex-col bg-slate-50 p-6 overflow-hidden h-[60vh] md:h-auto min-h-[400px]">
            <h4 className="font-black text-slate-800 flex items-center gap-2 mb-6 shrink-0 uppercase tracking-wide text-sm">
              <Clock size={18} className="text-[#d50000]" strokeWidth={2.5}/> Configuración de horas
            </h4>
            <div className="flex gap-6 flex-1 min-h-0">
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 shrink-0">Entrada</label>
                <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-2 pb-2">
                  {HOURS.map((h, i) => (
                    <button key={`start-${i}`} onClick={() => setLocalShift(prev => ({ ...prev, start: i }))} className={`py-3 rounded-xl border-2 text-[11px] font-bold transition-colors ${localShift.start === i ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      {h.split(' a ')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 shrink-0">Salida</label>
                <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-2 pb-2">
                  {HOURS.map((h, i) => {
                    const isDisabled = i < localShift.start;
                    return (
                      <button key={`end-${i}`} disabled={isDisabled} onClick={() => setLocalShift(prev => ({ ...prev, end: i }))} className={`py-3 rounded-xl border-2 text-[11px] font-bold transition-colors ${isDisabled ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-100 text-slate-400' : localShift.end === i ? 'bg-[#d50000] border-[#d50000] text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        {h.split(' a ')[1]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200 shrink-0">
              <button onClick={handleConfirm} className="w-full py-3.5 bg-[#d50000] hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98]">
                Guardar horas y cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}