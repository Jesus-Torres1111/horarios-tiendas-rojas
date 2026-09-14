import React, { useEffect } from 'react';
import { X, TableProperties } from 'lucide-react';
import { DAYS, HOURS, getContrastColorHex } from '../utils/constants';

export default function PreviewExcel({ isOpen, onClose, store, stores, schedule }) {
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const targetStores = stores ? stores : (store ? [store] : []);
  if (!isOpen || targetStores.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm md:p-6 fade-in" onClick={onClose}>
      <div className="bg-slate-100 w-full h-full md:h-auto md:max-w-[95vw] md:max-h-[95vh] md:rounded-[24px] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-[#d50000] rounded-xl">
              <TableProperties size={20} strokeWidth={2.5}/>
            </div>
            <h3 className="font-black text-slate-900 text-sm md:text-base uppercase tracking-widest">
              {stores ? 'Reporte Global de Tiendas' : `Reporte - ${store?.name}`}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 border border-slate-200 rounded-full hover:bg-red-50 hover:text-[#d50000] transition-colors shadow-sm">
            <X size={20} strokeWidth={2.5}/>
          </button>
        </div>
        
        <div className="p-4 md:p-8 overflow-auto flex-1 bg-slate-100/50">
          <div className="flex flex-col gap-8 w-max mx-auto pb-12">
            {targetStores.map(currentStore => {
              const numPeople = currentStore.people.length;
              if (numPeople === 0) return null;

              const skipMap = {};

              return (
                <div key={currentStore.id} className="bg-white p-4 md:p-5 rounded-2xl shadow-xl border border-slate-200 shrink-0">
                  <table className="border-collapse border border-black bg-white w-max font-sans select-none">
                    <thead>
                      <tr>
                        <th className="border border-black bg-[#d50000] text-white p-3 text-sm md:text-base font-black uppercase tracking-wider" colSpan={1 + (numPeople + 1) * 7}>
                          {currentStore.title}
                        </th>
                      </tr>
                      <tr>
                        <th className="border border-black w-24"></th>
                        {DAYS.map(day => (
                          <React.Fragment key={`day-${day}`}>
                            <th className="border border-black bg-[#d50000] text-white p-1 text-[11px] font-black uppercase tracking-widest" colSpan={numPeople}>
                              {day}
                            </th>
                            <th className="border border-black bg-black w-3"></th>
                          </React.Fragment>
                        ))}
                      </tr>
                      <tr>
                        <th className="border border-black"></th>
                        {DAYS.map(day => (
                          <React.Fragment key={`people-${day}`}>
                            {currentStore.people.map(p => (
                              <th key={p.id} className="border border-black w-9 h-28 relative" style={{ backgroundColor: p.color, color: getContrastColorHex(p.color) }}>
                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                   <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="whitespace-nowrap font-black text-[10px] uppercase tracking-wide">
                                     {p.name}
                                   </span>
                                </div>
                              </th>
                            ))}
                            <th className="border border-black bg-black w-3"></th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    
                    <tbody>
                      {HOURS.map((hour, hIdx) => (
                        <tr key={`row-${hIdx}`}>
                          <td className="border border-black p-1 text-center font-bold text-[10px] h-7">{hour}</td>
                          {DAYS.map(day => (
                            <React.Fragment key={`cell-${day}-${hIdx}`}>
                              {currentStore.people.map(p => {
                                const key = `${day}-${p.id}`;
                                
                                if (skipMap[key] > 0) {
                                  skipMap[key]--;
                                  return null;
                                }
                                
                                const sched = schedule[currentStore.id]?.[p.id]?.[day] || { type: 'mañana', start: 0, end: 6 };
                                let isBlockStart = false;
                                let span = 1;
                                let text = '';
                                let bgColor = 'transparent';
                                
                                if (sched.type === 'descansa' && hIdx === 0) {
                                  isBlockStart = true; span = 14; text = `${p.name} DESCANSA`; bgColor = p.color;
                                } else if (sched.type === 'completo' && hIdx === 0) {
                                  isBlockStart = true; span = 13; text = `${p.name} TODO EL DIA`; bgColor = p.color;
                                } else if (sched.type !== 'descansa' && sched.type !== 'completo' && sched.start === hIdx) {
                                  isBlockStart = true; span = sched.end - sched.start + 1; text = p.name; bgColor = p.color;
                                }

                                if (isBlockStart) {
                                  skipMap[key] = span - 1;
                                  return (
                                    <td key={p.id} rowSpan={span} className="border border-black relative" style={{ backgroundColor: bgColor, color: '#000000' }}>
                                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                        <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="whitespace-nowrap font-black text-[10px] uppercase tracking-wide">
                                          {text}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                }
                                return <td key={p.id} className="border border-black"></td>;
                              })}
                              <td className="border border-black bg-black w-3"></td>
                            </React.Fragment>
                          ))}
                        </tr>
                      ))}
                      
                      <tr>
                        <td className="border border-black p-1 text-center font-black text-[10px] bg-[#7030A0] text-white tracking-widest h-7">HORAS PROG</td>
                        {DAYS.map(day => (
                          <React.Fragment key={`hp-${day}`}>
                            {currentStore.people.map(p => {
                              const sched = schedule[currentStore.id]?.[p.id]?.[day];
                              let hp = 0;
                              if (sched && sched.type !== 'descansa') {
                                if (sched.type === 'completo') hp = 13;
                                else hp = sched.end - sched.start + 1;
                              }
                              return <td key={p.id} className="border border-black p-1 text-center font-black text-[11px] bg-[#7030A0] text-white">{hp}</td>;
                            })}
                            <td className="border border-black bg-black w-3"></td>
                          </React.Fragment>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}