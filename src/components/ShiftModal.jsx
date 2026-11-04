import { useState, useEffect } from 'react';
import { X, Check, Clock, Sparkles } from 'lucide-react';
import { DAYS, HOURS, SHIFT_TYPES, getShiftDetails, getShiftHours } from '../utils/constants';
import { SHORT_DAYS, SHIFT_NAMES, PATTERNS, PATTERN_ICONS, hourLabel, rangeLabel } from '../utils/format';
import HourBar from './HourBar';

const WEEKDAYS = DAYS.slice(0, 5);
const WEEKEND = DAYS.slice(5);

function SectionTitle({ number, children, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        {number && (
          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">{number}</span>
        )}
        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{children}</h4>
      </div>
      {action}
    </div>
  );
}

export default function ShiftModal({
  isOpen, onClose, personName, personColor, day, currentShift, onSave, isBulk,
  onUpdateName, onUpdateColor, onApplyPattern
}) {
  const [selectedDays, setSelectedDays] = useState(isBulk ? [...DAYS] : [day]);
  const [localShift, setLocalShift] = useState(() => {
    const shift = { ...currentShift };
    if (shift.type === 'personalizado' && shift.start < 0) {
      shift.start = 0;
      shift.end = 6;
    }
    return shift;
  });
  const [localName, setLocalName] = useState(personName);
  const [localColor, setLocalColor] = useState(personColor);
  const [picking, setPicking] = useState('start');
  const [shiftTouched, setShiftTouched] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  const isCustom = localShift.type === 'personalizado';
  const willSaveShift = !isBulk || shiftTouched;
  const totalHours = getShiftHours(localShift);

  const toggleDay = (d) => {
    setSelectedDays(prev => {
      if (prev.includes(d)) return prev.length > 1 ? prev.filter(x => x !== d) : prev;
      return [...prev, d];
    });
  };

  const selectDays = (list) => setSelectedDays([...list]);

  const selectType = (id) => {
    setShiftTouched(true);
    setPicking('start');
    setLocalShift(prev => {
      if (id === 'personalizado') {
        const valid = prev.start >= 0 && prev.end >= prev.start;
        return { type: id, start: valid ? prev.start : 0, end: valid ? prev.end : 6 };
      }
      const details = getShiftDetails(id);
      return { type: id, start: details.start, end: details.end };
    });
  };

  const pickHour = (i) => {
    setShiftTouched(true);
    setLocalShift(prev => {
      if (picking === 'start') return { ...prev, start: i, end: i };
      if (i < prev.start) return { ...prev, start: i, end: prev.start };
      return { ...prev, end: i };
    });
    setPicking(p => (p === 'start' ? 'end' : 'start'));
  };

  const saveIdentity = () => {
    const cleanName = localName.trim();
    if (cleanName && cleanName !== personName) onUpdateName(cleanName);
    if (localColor !== personColor) onUpdateColor(localColor);
  };

  const handleConfirm = () => {
    if (willSaveShift) onSave(localShift.type, localShift.start, localShift.end, selectedDays);
    saveIdentity();
    onClose();
  };

  const handlePattern = (patternId) => {
    onApplyPattern(patternId);
    saveIdentity();
    onClose();
  };

  const summary = willSaveShift
    ? `${selectedDays.length} ${selectedDays.length === 1 ? 'día' : 'días'} · ${SHIFT_NAMES[localShift.type]} · ${rangeLabel(localShift)}${totalHours > 0 ? ` · ${totalHours} h` : ''}`
    : 'Solo se guardarán el nombre y el color';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-xl rounded-t-[28px] sm:rounded-[28px] max-h-[94vh] flex flex-col overflow-hidden shadow-2xl pop-in">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <label className="relative w-12 h-12 rounded-full shadow-md shrink-0 cursor-pointer overflow-hidden ring-4 ring-slate-100" style={{ backgroundColor: localColor }}>
              <input type="color" value={localColor} onChange={(e) => setLocalColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
            <div className="min-w-0">
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value.toUpperCase())}
                placeholder="Nombre"
                maxLength={20}
                className="font-black text-slate-900 text-lg bg-transparent border-b-2 border-dashed border-slate-200 focus:border-[#d50000] outline-none w-full max-w-[200px] transition-colors uppercase"
              />
              <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                {isBulk ? 'Editar empleado y semana' : `Turno del ${day.charAt(0)}${day.slice(1).toLowerCase()}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-50 border border-slate-100 text-slate-400 hover:text-[#d50000] transition-colors shrink-0 self-start">
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-7 bg-white">
          {isBulk && onApplyPattern && (
            <div>
              <SectionTitle>
                <span className="inline-flex items-center gap-1.5"><Sparkles size={13} strokeWidth={3} className="text-[#d50000]" /> Plantillas rápidas</span>
              </SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PATTERNS.map(p => {
                  const Icon = PATTERN_ICONS[p.id];
                  return (
                    <button
                      key={p.id}
                      onClick={() => handlePattern(p.id)}
                      className="flex items-center gap-3 p-3 rounded-2xl border-2 border-slate-100 hover:border-[#d50000] hover:bg-red-50/40 text-left transition-all active:scale-[0.98]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <Icon size={16} strokeWidth={2.5} />
                      </div>
                      <span className="text-xs font-black text-slate-700 leading-tight">{p.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] font-semibold text-slate-400 mt-2">Reemplaza los 7 días de esta persona.</p>
            </div>
          )}

          <div>
            <SectionTitle
              number={1}
              action={
                <div className="flex gap-3">
                  <button onClick={() => selectDays(WEEKDAYS)} className="text-[10px] font-black text-[#d50000] hover:underline uppercase tracking-wider">Lun–Vie</button>
                  <button onClick={() => selectDays(WEEKEND)} className="text-[10px] font-black text-[#d50000] hover:underline uppercase tracking-wider">Fin de semana</button>
                  <button onClick={() => selectDays(DAYS)} className="text-[10px] font-black text-[#d50000] hover:underline uppercase tracking-wider">Todos</button>
                </div>
              }
            >
              ¿Qué días cambiar?
            </SectionTitle>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map(d => {
                const isSel = selectedDays.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={`py-3 rounded-xl text-[11px] font-black border-2 transition-all active:scale-95 ${isSel ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                  >
                    {SHORT_DAYS[d]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <SectionTitle number={2}>Elige el turno</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5">
              {SHIFT_TYPES.map(opt => {
                const selected = localShift.type === opt.id;
                const Icon = opt.icon;
                const preview = opt.id === 'personalizado'
                  ? (isCustom ? localShift : { type: 'personalizado', start: -1, end: -1 })
                  : { type: opt.id };
                const rangeText = opt.id === 'descansa'
                  ? 'Día libre'
                  : opt.id === 'personalizado' && !isCustom
                    ? 'Tú eliges las horas'
                    : rangeLabel(preview);
                return (
                  <button
                    key={opt.id}
                    onClick={() => selectType(opt.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.97] flex flex-col gap-2.5 ${selected ? 'border-[#d50000] bg-red-50/50 shadow-md ring-1 ring-[#d50000]' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={17} strokeWidth={2.5} className={selected ? 'text-[#d50000]' : 'text-slate-400'} />
                        <span className={`font-black text-xs uppercase ${selected ? 'text-slate-900' : 'text-slate-600'}`}>{opt.label}</span>
                      </div>
                      {selected && <Check size={16} strokeWidth={3} className="text-[#d50000]" />}
                    </div>
                    <div className={`text-[11px] font-bold ${selected ? 'text-[#d50000]' : 'text-slate-400'}`}>{rangeText}</div>
                    <HourBar sched={preview} />
                  </button>
                );
              })}
            </div>
          </div>

          {isCustom && (
            <div className="fade-in">
              <SectionTitle number={3}>
                <span className="inline-flex items-center gap-1.5"><Clock size={13} strokeWidth={3} /> Horas de trabajo</span>
              </SectionTitle>
              <div className="rounded-2xl bg-violet-50/60 border border-violet-100 p-4">
                <p className="text-xs font-bold text-violet-700 mb-3">
                  {picking === 'start' ? 'Paso 1: toca la hora en que entra' : 'Paso 2: toca la última hora que trabaja'}
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {HOURS.map((_, i) => {
                    const inRange = i >= localShift.start && i <= localShift.end;
                    const isEdge = i === localShift.start || i === localShift.end;
                    return (
                      <button
                        key={i}
                        onClick={() => pickHour(i)}
                        className={`py-2.5 rounded-lg border-2 text-[11px] font-black transition-all active:scale-95 ${isEdge ? 'bg-violet-600 border-violet-600 text-white shadow-sm' : inRange ? 'bg-violet-100 border-violet-200 text-violet-800' : 'bg-white border-slate-200 text-slate-500 hover:border-violet-300'}`}
                      >
                        {hourLabel(i, 'start').replace(':00', '')}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-white border border-violet-100 px-4 py-3">
                  <div className="text-xs font-bold text-slate-500">
                    Entra <span className="text-slate-900 font-black">{hourLabel(localShift.start, 'start')}</span>
                    <span className="mx-2 text-slate-300">→</span>
                    Sale <span className="text-slate-900 font-black">{hourLabel(localShift.end, 'end')}</span>
                  </div>
                  <span className="text-xs font-black text-violet-700">{totalHours} h</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
          <p className="text-[11px] font-bold text-slate-500 mb-3 truncate">{summary}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleConfirm} className="flex-[2] py-3.5 rounded-xl bg-[#d50000] hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/20 transition-all active:scale-[0.98]">
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}