import { useState } from 'react';
import { Trash2, Plus, Users, TableProperties, Store as StoreIcon, Pencil } from 'lucide-react';
import { DAYS, DEFAULT_COLORS, getShiftHours } from '../utils/constants';
import { SHORT_DAYS, SHIFT_THEME, SHIFT_NAMES, rangeLabel, breakBadgeLabel } from '../utils/format';
import HourBar from './HourBar';
import ShiftModal from './ShiftModal';
import AddPersonModal from './AddPersonModal';
import PreviewExcel from './PreviewExcel';

const DEFAULT_SHIFT = { type: 'mañana', start: 0, end: 6 };
const WEEKLY_REFERENCE_HOURS = 48;

function ShiftCell({ sched, onClick }) {
  const theme = SHIFT_THEME[sched.type] || SHIFT_THEME['mañana'];
  const breakText = breakBadgeLabel(sched);
  return (
    <button
      onClick={onClick}
      className={`w-full min-h-[70px] px-2.5 py-2 rounded-xl border-2 flex flex-col justify-between gap-1.5 text-left transition-all active:scale-[0.97] ${theme.cell}`}
    >
      <div>
        <div className="text-[10px] font-black uppercase tracking-wider leading-none">{SHIFT_NAMES[sched.type] || 'Mañana'}</div>
        <div className="text-[10px] font-semibold opacity-85 mt-1 leading-tight">{rangeLabel(sched)}</div>
        {breakText && (
          <div className="text-[9px] font-black opacity-95 mt-0.5 leading-tight underline decoration-dotted">{breakText}</div>
        )}
      </div>
      <HourBar sched={sched} />
    </button>
  );
}

export default function StoreCard({
  store, schedule, startDate, onAddPerson, onRemovePerson, onUpdatePersonName, onUpdatePersonColor, onUpdateShift, onApplyPattern
}) {
  const [activeModal, setActiveModal] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const getSched = (personId, day) => schedule[store.id]?.[personId]?.[day] || DEFAULT_SHIFT;

  const calculateTotalHours = (personId) =>
    DAYS.reduce((total, day) => total + getShiftHours(schedule[store.id]?.[personId]?.[day]), 0);

  const countWorking = (day) =>
    store.people.filter(p => {
      const t = getSched(p.id, day).type;
      return t !== 'descansa' && t !== 'sin_turno';
    }).length;

  const storeHours = store.people.reduce((sum, p) => sum + calculateTotalHours(p.id), 0);

  const openModal = (person, day, isBulk = false) => {
    setActiveModal({ personId: person.id, day, name: person.name, color: person.color, isBulk });
  };

  const usedColors = new Set(store.people.map(p => p.color.toLowerCase()));
  const suggestedColor = DEFAULT_COLORS.find(c => !usedColors.has(c.toLowerCase())) || '#6366f1';
  const suggestedName = `NUEVO ${store.people.length + 1}`;

  const confirmRemovePerson = () => {
    onRemovePerson(store.id, pendingDelete.id);
    setPendingDelete(null);
  };

  const coverageStyle = (n) => {
    if (n === 0) return 'bg-red-100 text-red-700 border-red-200';
    if (n === 1) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  return (
    <section className="bg-white rounded-[24px] shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-200 overflow-hidden">
      <div className="p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#d50000] flex items-center justify-center shrink-0">
            <StoreIcon size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-slate-900 font-black text-base md:text-lg uppercase tracking-wide leading-tight">{store.name}</h2>
            <p className="text-xs font-bold text-slate-400 mt-1">
              {store.people.length} {store.people.length === 1 ? 'persona' : 'personas'} · {storeHours} horas programadas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowPreview(true)}
            className="hidden lg:flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-bold border border-slate-200 hover:bg-slate-50 px-5 py-2.5 rounded-xl transition-colors"
          >
            <TableProperties size={16} strokeWidth={2.5} /> Ver reporte
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#d50000] hover:bg-red-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-red-600/20 transition-all active:scale-95"
          >
            <Plus size={16} strokeWidth={3} /> Agregar personal
          </button>
        </div>
      </div>

      <div className="px-5 md:px-6 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leyenda</span>
        {Object.keys(SHIFT_NAMES).map(type => (
          <span key={type} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <span className={`w-2.5 h-2.5 rounded-full ${SHIFT_THEME[type].dot}`}></span>
            {SHIFT_NAMES[type]}
          </span>
        ))}
      </div>

      {store.people.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
            <Users size={26} strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm text-slate-700 font-black">Esta tienda aún no tiene personal</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">Agrega a la primera persona para empezar a armar el horario.</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#d50000] hover:bg-red-700 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md shadow-red-600/20 transition-all active:scale-95"
          >
            <Plus size={16} strokeWidth={3} /> Agregar personal
          </button>
        </div>
      ) : (
        <>
          <div className="hidden lg:block overflow-x-auto p-4">
            <div className="min-w-max flex flex-col w-full rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex bg-slate-50 border-b border-slate-200">
                <div className="w-[200px] shrink-0 p-4 sticky left-0 z-20 bg-slate-50 border-r border-slate-200 font-black text-slate-400 uppercase text-[10px] tracking-widest">Personal</div>
                {DAYS.map(day => (
                  <div key={day} className="flex-1 min-w-[136px] p-4 text-center font-black text-slate-500 uppercase text-[11px] tracking-widest border-r border-slate-200">{SHORT_DAYS[day]}</div>
                ))}
                <div className="w-[100px] shrink-0 p-4 text-center font-black text-slate-400 uppercase text-[10px] tracking-widest">Horas</div>
              </div>

              <div className="divide-y divide-slate-100 bg-white">
                {store.people.map(person => {
                  const totalHours = calculateTotalHours(person.id);
                  const ratio = Math.min(1, totalHours / WEEKLY_REFERENCE_HOURS);
                  const overLimit = totalHours > WEEKLY_REFERENCE_HOURS;
                  return (
                    <div key={person.id} className="flex w-full group">
                      <div
                        onClick={() => openModal(person, 'LUNES', true)}
                        className="w-[200px] shrink-0 p-3 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full shrink-0 shadow-sm ring-2 ring-white" style={{ backgroundColor: person.color }}></div>
                          <div className="min-w-0">
                            <div className="font-black text-slate-800 text-xs truncate uppercase">{person.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5 group-hover:text-[#d50000] transition-colors">
                              <Pencil size={10} strokeWidth={3} /> Editar
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPendingDelete({ id: person.id, name: person.name }); }}
                          className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 p-1.5"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>

                      {DAYS.map(day => (
                        <div key={day} className="flex-1 min-w-[136px] p-2 border-r border-slate-100 flex items-center">
                          <ShiftCell sched={getSched(person.id, day)} onClick={() => openModal(person, day)} />
                        </div>
                      ))}

                      <div className="w-[100px] shrink-0 p-2 flex flex-col items-center justify-center gap-1.5" title={`Referencia: ${WEEKLY_REFERENCE_HOURS} h semanales`}>
                        <div className="font-black text-slate-800 text-base leading-none">{totalHours}<span className="text-[10px] text-slate-400 ml-0.5">h</span></div>
                        <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${overLimit ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${ratio * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex bg-slate-50 border-t-2 border-slate-200">
                <div className="w-[200px] shrink-0 p-3 sticky left-0 z-10 bg-slate-50 border-r border-slate-200 flex items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Cobertura del día</span>
                </div>
                {DAYS.map(day => {
                  const n = countWorking(day);
                  return (
                    <div key={day} className="flex-1 min-w-[136px] p-2 border-r border-slate-200 flex items-center justify-center">
                      <span className={`px-3 py-1 rounded-full border text-[11px] font-black ${coverageStyle(n)}`}>
                        {n}/{store.people.length} trabajan
                      </span>
                    </div>
                  );
                })}
                <div className="w-[100px] shrink-0 p-2 flex items-center justify-center">
                  <span className="font-black text-slate-800 text-sm">{storeHours}<span className="text-[10px] text-slate-400 ml-0.5">h</span></span>
                </div>
              </div>
            </div>
          </div>

          <div className="block lg:hidden p-4 space-y-4 bg-slate-50/60">
            <button
              onClick={() => setShowPreview(true)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <TableProperties size={18} strokeWidth={2.5} /> Ver tabla completa
            </button>

            {store.people.map(person => (
              <div key={person.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div
                  onClick={() => openModal(person, 'LUNES', true)}
                  className="px-4 py-3.5 flex justify-between items-center border-b border-slate-100 cursor-pointer active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: person.color }}></div>
                    <div className="min-w-0">
                      <div className="font-black text-slate-800 text-sm truncate uppercase">{person.name}</div>
                      <div className="text-[11px] font-bold text-slate-400">{calculateTotalHours(person.id)} horas · toca para editar</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPendingDelete({ id: person.id, name: person.name }); }}
                    className="text-slate-300 hover:text-red-500 border border-slate-100 p-2 rounded-xl transition-colors shrink-0"
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  {DAYS.map(day => {
                    const sched = getSched(person.id, day);
                    const theme = SHIFT_THEME[sched.type] || SHIFT_THEME['mañana'];
                    const breakText = breakBadgeLabel(sched);
                    return (
                      <button
                        key={day}
                        onClick={() => openModal(person, day)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-transform active:scale-[0.98] ${theme.cell}`}
                      >
                        <span className="w-9 text-[11px] font-black opacity-70 text-left">{SHORT_DAYS[day]}</span>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-[11px] font-black uppercase tracking-wide leading-none">{SHIFT_NAMES[sched.type] || 'Mañana'}</div>
                          <div className="text-[10px] font-semibold opacity-80 mt-1">
                            {rangeLabel(sched)}{breakText ? ` · ${breakText}` : ''}
                          </div>
                        </div>
                        <HourBar sched={sched} className="w-20 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <PreviewExcel isOpen={showPreview} onClose={() => setShowPreview(false)} store={store} schedule={schedule} startDate={startDate} />

      {showAdd && (
        <AddPersonModal
          onClose={() => setShowAdd(false)}
          onCreate={(data) => onAddPerson(store.id, data)}
          storeName={store.name}
          suggestedName={suggestedName}
          suggestedColor={suggestedColor}
        />
      )}

      {activeModal && (
        <ShiftModal
          key={`${activeModal.personId}-${activeModal.day}-${activeModal.isBulk}`}
          isOpen={true}
          onClose={() => setActiveModal(null)}
          personName={activeModal.name}
          personColor={activeModal.color}
          day={activeModal.day}
          isBulk={activeModal.isBulk}
          currentShift={getSched(activeModal.personId, activeModal.day)}
          onSave={(type, start, end, selectedDays, breakHour) => onUpdateShift(store.id, activeModal.personId, selectedDays, type, start, end, breakHour)}
          onUpdateName={(newName) => onUpdatePersonName(store.id, activeModal.personId, newName)}
          onUpdateColor={(newColor) => onUpdatePersonColor(store.id, activeModal.personId, newColor)}
          onApplyPattern={(patternId) => onApplyPattern(store.id, activeModal.personId, patternId)}
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center pop-in">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <Trash2 size={26} strokeWidth={2.5} />
            </div>
            <h3 className="font-black text-slate-900 text-lg mb-2">Eliminar empleado</h3>
            <p className="text-sm text-slate-500 mb-8 font-medium">
              ¿Seguro que quieres eliminar a <strong className="text-slate-800">{pendingDelete.name}</strong> de {store.name}? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPendingDelete(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={confirmRemovePerson} className="flex-1 py-3 rounded-xl bg-[#d50000] hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-md shadow-red-600/20">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}