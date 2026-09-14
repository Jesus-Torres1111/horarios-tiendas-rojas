import { useState } from 'react';
import { Trash2, Plus, Users, TableProperties } from 'lucide-react';
import { DAYS, HOURS, getShiftHours, shiftDisplayLabel, getShiftStyleClasses } from '../utils/constants';
import ShiftModal from './ShiftModal';
import PreviewExcel from './PreviewExcel';

const MAX_REFERENCE_HOURS = HOURS.length * 7; 

export default function StoreCard({ 
  store, schedule, onAddPerson, onRemovePerson, onUpdatePersonName, onUpdatePersonColor, onUpdateShift 
}) {
  const [activeModal, setActiveModal] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleOpenModal = (personId, day, name, color, isBulk = false) => {
    setActiveModal({ personId, day, name, color, isBulk });
  };
  const handleCloseModal = () => setActiveModal(null);

  const getShortDay = (day) => {
    const map = { LUNES: 'LUN', MARTES: 'MAR', MIÉRCOLES: 'MIÉ', JUEVES: 'JUE', VIERNES: 'VIE', SÁBADO: 'SÁB', DOMINGO: 'DOM' };
    return map[day];
  };

  const calculateTotalHours = (personId) => {
    let total = 0;
    DAYS.forEach(day => {
      const sched = schedule[store.id]?.[personId]?.[day];
      total += getShiftHours(sched);
    });
    return total;
  };

  const confirmRemovePerson = (personId) => {
    onRemovePerson(store.id, personId);
    setPendingDelete(null);
  };

  return (
    <div className="bg-white rounded-[24px] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden transition-all duration-300">
      
      <div className="bg-white border-b border-slate-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-slate-900 font-black text-lg uppercase tracking-wide">{store.name}</h2>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowPreview(true)} 
            className="hidden lg:flex text-slate-600 hover:text-slate-900 text-sm font-bold items-center justify-center gap-2 transition-colors border border-slate-200 hover:bg-slate-50 px-5 py-2.5 rounded-xl shadow-sm"
          >
            <TableProperties size={16} strokeWidth={2.5}/> <span>Ver reporte</span>
          </button>
          <button 
            onClick={() => onAddPerson(store.id)} 
            className="flex-1 md:flex-none text-slate-700 hover:text-[#e60000] text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200 hover:border-red-200 px-5 py-2.5 rounded-xl shadow-sm"
          >
            <Plus size={16} strokeWidth={3}/> <span className="hidden sm:inline">Agregar personal</span>
          </button>
        </div>
      </div>

      {store.people.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center bg-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
            <Users size={24} strokeWidth={2}/>
          </div>
          <p className="text-sm text-slate-500 font-bold max-w-xs">
            Esta tienda no tiene personal asignado.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden lg:block overflow-x-auto p-4">
            <div className="min-w-max flex flex-col w-full rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="flex bg-slate-50/80 border-b border-slate-100">
                <div className="w-[180px] shrink-0 p-4 sticky left-0 z-20 bg-slate-50/80 border-r border-slate-100 font-black text-slate-400 uppercase text-[10px] tracking-widest">Personal</div>
                {DAYS.map(day => (
                  <div key={day} className="flex-1 min-w-[120px] p-4 text-center font-black text-slate-400 uppercase text-[10px] tracking-widest border-r border-slate-100">{getShortDay(day)}</div>
                ))}
                <div className="w-[100px] shrink-0 p-4 text-center font-black text-slate-400 uppercase text-[10px] tracking-widest bg-slate-50">Horas prog.</div>
              </div>

              <div className="divide-y divide-slate-100 flex-1 bg-white">
                {store.people.map(person => {
                  const totalHours = calculateTotalHours(person.id);
                  const hoursRatio = Math.min(1, totalHours / MAX_REFERENCE_HOURS);

                  return (
                    <div key={person.id} className="flex w-full hover:bg-slate-50/30 transition-colors group">
                      <div 
                        onClick={() => handleOpenModal(person.id, 'LUNES', person.name, person.color, true)}
                        className="w-[180px] shrink-0 p-3 sticky left-0 z-20 bg-white group-hover:bg-slate-50/80 border-r border-slate-100 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 w-full pl-2">
                          <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: person.color }}></div>
                          <span className="font-extrabold text-slate-800 text-xs truncate">{person.name}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setPendingDelete({ id: person.id, name: person.name }); }} className="text-slate-300 hover:text-red-500 transition-colors shrink-0 p-1">
                          <Trash2 size={16} strokeWidth={2.5}/>
                        </button>
                      </div>

                      {DAYS.map(day => {
                        const sched = schedule[store.id]?.[person.id]?.[day] || { type: 'mañana', start: 0, end: 6 };
                        const styles = getShiftStyleClasses(sched.type);
                        return (
                          <div key={day} className="flex-1 min-w-[120px] p-2 border-r border-slate-100 flex items-center justify-center">
                            <button 
                              onClick={() => handleOpenModal(person.id, day, person.name, person.color, false)}
                              className={`w-full h-10 px-2 flex items-center justify-center rounded-xl border-2 font-bold transition-all active:scale-[0.97] ${styles.badge}`}
                            >
                              <span className="text-[10px] uppercase tracking-wider">{shiftDisplayLabel(sched)}</span>
                            </button>
                          </div>
                        );
                      })}

                      <div className="w-[100px] shrink-0 p-2 flex flex-col items-center justify-center gap-2 bg-white">
                        <div className="font-black text-slate-800 text-sm">
                          {totalHours}
                        </div>
                        <div className="w-10 h-1 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-[#e60000]" style={{ width: `${hoursRatio * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="block lg:hidden p-4 space-y-4 bg-slate-50/50">
            <button 
              onClick={() => setShowPreview(true)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <TableProperties size={18} strokeWidth={2.5}/> Visualizar tabla completa
            </button>

            {store.people.map(person => (
              <div key={person.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div 
                  onClick={() => handleOpenModal(person.id, 'LUNES', person.name, person.color, true)}
                  className="bg-white px-5 py-4 flex justify-between items-center border-b border-slate-100 cursor-pointer active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: person.color }}></div>
                    <span className="font-black text-slate-800 text-sm truncate max-w-[150px] uppercase">{person.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Horas</span>
                      <span className="text-sm font-black text-slate-800 leading-none">{calculateTotalHours(person.id)}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setPendingDelete({ id: person.id, name: person.name }); }} className="text-slate-300 hover:text-red-500 bg-white border border-slate-100 p-2 rounded-xl shadow-sm transition-colors">
                      <Trash2 size={16} strokeWidth={2.5}/>
                    </button>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50">
                  {DAYS.map(day => {
                    const sched = schedule[store.id]?.[person.id]?.[day] || { type: 'mañana', start: 0, end: 6 };
                    const styles = getShiftStyleClasses(sched.type);
                    return (
                      <button 
                        key={day}
                        onClick={() => handleOpenModal(person.id, day, person.name, person.color, false)}
                        className={`flex flex-col items-start justify-center min-h-[56px] p-3 rounded-xl border-2 transition-transform active:scale-95 ${styles.badge} bg-white shadow-sm`}
                      >
                        <span className="text-[9px] font-black opacity-60 mb-1.5 uppercase tracking-widest">{getShortDay(day)}</span>
                        <span className="text-[10px] font-bold leading-tight uppercase text-left">{shiftDisplayLabel(sched)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <PreviewExcel isOpen={showPreview} onClose={() => setShowPreview(false)} store={store} schedule={schedule} />

      {activeModal && (
        <ShiftModal
          key={`${activeModal.personId}-${activeModal.day}-${activeModal.isBulk}`}
          isOpen={true} onClose={handleCloseModal} personName={activeModal.name} personColor={activeModal.color}
          day={activeModal.day} isBulk={activeModal.isBulk}
          currentShift={schedule[store.id][activeModal.personId][activeModal.day] || { type: 'mañana', start: 0, end: 6 }}
          onSave={(type, start, end, selectedDays) => onUpdateShift(store.id, activeModal.personId, selectedDays, type, start, end)}
          onUpdateName={(newName) => onUpdatePersonName(store.id, activeModal.personId, newName)}
          onUpdateColor={(newColor) => onUpdatePersonColor(store.id, activeModal.personId, newColor)}
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <Trash2 size={24} strokeWidth={2.5}/>
            </div>
            <h3 className="font-black text-slate-900 text-lg mb-2">Eliminar empleado</h3>
            <p className="text-sm text-slate-500 mb-8 font-medium">¿Estás seguro de eliminar a <strong>{pendingDelete.name}</strong>? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setPendingDelete(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={() => confirmRemovePerson(pendingDelete.id)} className="flex-1 py-3 rounded-xl bg-[#e60000] hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-md">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}