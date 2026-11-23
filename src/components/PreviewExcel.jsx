import React, { useEffect } from 'react';
import { X, TableProperties } from 'lucide-react';
import { DAYS, getShiftHours, getWeekDates, getContrastColorHex } from '../utils/constants';
import { excelCellShiftText } from '../utils/format';

const DEFAULT_SHIFT = { type: 'mañana', start: 0, end: 6 };

function toCssContrastColor(hexColor) {
  const argb = getContrastColorHex(hexColor);
  return argb === 'FFFFFFFF' ? '#FFFFFF' : '#000000';
}

function getCellVisual(type, personColor) {
  if (type === 'descansa') {
    return {
      style: { backgroundColor: '#FF0000', color: '#FFFFFF' },
      className: 'font-black'
    };
  }
  if (type === 'vacaciones') {
    return {
      style: { backgroundColor: '#CCE5FF', color: '#004085' },
      className: 'font-black'
    };
  }
  if (type === 'sin_turno') {
    return {
      style: { backgroundColor: '#F1F5F9', color: '#94A3B8' },
      className: 'font-bold'
    };
  }
  return {
    style: { backgroundColor: personColor, color: toCssContrastColor(personColor) },
    className: 'font-bold'
  };
}

export default function PreviewExcel({ isOpen, onClose, store, stores, schedule, startDate }) {
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const targetStores = stores ? stores : (store ? [store] : []);
  if (!isOpen || targetStores.length === 0) return null;

  const weekDates = getWeekDates(startDate);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm md:p-6 fade-in" onClick={onClose}>
      <div className="bg-slate-100 w-full h-full md:h-auto md:max-w-[95vw] md:max-h-[95vh] md:rounded-[24px] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-[#d50000] rounded-xl">
              <TableProperties size={20} strokeWidth={2.5} />
            </div>
            <h3 className="font-black text-slate-900 text-sm md:text-base uppercase tracking-widest">
              {stores ? 'Reporte Global de Tiendas' : `Reporte - ${store?.name}`}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 border border-slate-200 rounded-full hover:bg-red-50 hover:text-[#d50000] transition-colors shadow-sm">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-4 md:p-8 overflow-auto flex-1 bg-slate-100/50">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl border border-slate-200 w-max mx-auto">
            <table className="border-collapse border border-black bg-white font-sans select-none">
              <thead>
                <tr>
                  <th rowSpan={2} className="border border-black bg-white text-slate-900 px-6 py-3 text-base font-black tracking-wide min-w-[210px]">
                    Nombres
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="border border-black bg-[#b4c6e7] text-slate-900 px-4 py-1.5 text-xs font-black uppercase tracking-wider min-w-[165px]">
                      {day}
                    </th>
                  ))}
                  <th rowSpan={2} className="border border-black bg-[#7030A0] text-white px-4 py-3 text-xs font-black uppercase tracking-wider min-w-[95px]">
                    Horas Prog.
                  </th>
                </tr>
                <tr>
                  {weekDates.map((dateStr, idx) => (
                    <th key={idx} className="border border-black bg-white text-slate-800 px-3 py-1 text-xs font-bold">
                      {dateStr}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {targetStores.map(currentStore => {
                  if (currentStore.people.length === 0) return null;
                  return (
                    <React.Fragment key={currentStore.id}>
                      <tr>
                        <td className="border border-black bg-[#f4b084] text-slate-900 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-center">
                          {currentStore.name}
                        </td>
                        <td colSpan={8} className="border border-black bg-[#fce4d6]/40"></td>
                      </tr>

                      {currentStore.people.map(p => {
                        let totalHours = 0;
                        const nameTextColor = toCssContrastColor(p.color);
                        return (
                          <tr key={p.id}>
                            <td
                              className="border border-black px-3 py-2 text-xs font-black uppercase whitespace-nowrap"
                              style={{ backgroundColor: p.color, color: nameTextColor }}
                            >
                              {p.name}
                            </td>

                            {DAYS.map(day => {
                              const sched = schedule[currentStore.id]?.[p.id]?.[day] || DEFAULT_SHIFT;
                              totalHours += getShiftHours(sched);
                              const cellText = excelCellShiftText(sched);
                              const visual = getCellVisual(sched.type, p.color);

                              return (
                                <td
                                  key={day}
                                  style={visual.style}
                                  className={`border border-black px-2 py-2 text-center text-[11px] leading-snug whitespace-pre-line ${visual.className}`}
                                >
                                  {cellText}
                                </td>
                              );
                            })}

                            <td
                              style={{ backgroundColor: p.color, color: nameTextColor }}
                              className="border border-black px-2 py-2 text-center text-xs font-black"
                            >
                              {totalHours} h
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}