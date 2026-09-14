import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, Plus, Trash2, RotateCcw, CheckCircle2, AlertCircle, LogOut, TableProperties } from 'lucide-react';
import StoreCard from './components/StoreCard';
import DateRangePicker from './components/DateRangePicker';
import Login from './components/Login';
import PreviewExcel from './components/PreviewExcel';
import { INITIAL_STORES, DAYS,  formatWeekLabel, getShiftDetails, toLocalDateString } from './utils/constants';
import { generateExcel } from './utils/excelExport';

const STORAGE_KEYS = { stores: 'rojas-stores', schedule: 'rojas-schedule', batch: 'rojas-batch', auth: 'rojas-auth' };

function buildInitialSchedule(stores) {
  const initial = {};
  stores.forEach(store => {
    initial[store.id] = {};
    store.people.forEach(person => {
      initial[store.id][person.id] = {};
      DAYS.forEach(day => {
        initial[store.id][person.id][day] = { type: 'mañana', start: 0, end: 6 };
      });
    });
  });
  return initial;
}

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-[fadeIn_0.15s_ease-out]">
      <div className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold tracking-wide ${isError ? 'bg-white border-red-200 text-red-700' : 'bg-slate-900 border-slate-900 text-white'}`}>
        {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} className="text-red-400" />}
        {toast.message}
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem(STORAGE_KEYS.auth) === 'true');
  const [stores, setStores] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.stores);
    return saved ? JSON.parse(saved) : INITIAL_STORES;
  });
  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.schedule);
    return saved ? JSON.parse(saved) : buildInitialSchedule(INITIAL_STORES);
  });
  const [weekBatch, setWeekBatch] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.batch);
    return saved ? JSON.parse(saved) : [];
  });
  const [startDate, setStartDate] = useState(() => toLocalDateString(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 6);
    return toLocalDateString(d);
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showGlobalPreview, setShowGlobalPreview] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.stores, JSON.stringify(stores)); }, [stores]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.schedule, JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.batch, JSON.stringify(weekBatch)); }, [weekBatch]);

  if (!isAuthenticated) return <Login onLogin={() => { sessionStorage.setItem(STORAGE_KEYS.auth, 'true'); setIsAuthenticated(true); }} />;

  const handleLogout = () => { sessionStorage.removeItem(STORAGE_KEYS.auth); setIsAuthenticated(false); };
  const handleDateChange = (start, end) => { setStartDate(start); setEndDate(end); };

  const addPerson = (storeId, name, color, daysArray, startVal, endVal) => {
    const newId = 'p' + Date.now();
    setStores(prev => prev.map(store => {
      if (store.id === storeId) {
        return { ...store, people: [...store.people, { id: newId, name: name.toUpperCase() || 'NUEVO', color: color || '#d50000' }] };
      }
      return store;
    }));
    setSchedule(prev => {
      const defaultDays = {};
      DAYS.forEach(day => {
        if (daysArray && daysArray.includes(day)) {
          defaultDays[day] = { type: 'personalizado', start: startVal, end: endVal };
        } else {
          defaultDays[day] = { type: 'descansa', start: -1, end: -1 };
        }
      });
      return { ...prev, [storeId]: { ...prev[storeId], [newId]: defaultDays } };
    });
  };

  const removePerson = (storeId, personId) => {
    setStores(prev => prev.map(store => {
      if (store.id === storeId) return { ...store, people: store.people.filter(p => p.id !== personId) };
      return store;
    }));
    setSchedule(prev => {
      const nextStoreSchedule = { ...prev[storeId] };
      delete nextStoreSchedule[personId];
      return { ...prev, [storeId]: nextStoreSchedule };
    });
  };

  const updatePersonName = (storeId, personId, name) => {
    setStores(prev => prev.map(store => {
      if (store.id === storeId) return { ...store, people: store.people.map(p => p.id === personId ? { ...p, name: name.toUpperCase() } : p) };
      return store;
    }));
  };

  const updatePersonColor = (storeId, personId, color) => {
    setStores(prev => prev.map(store => {
      if (store.id === storeId) return { ...store, people: store.people.map(p => p.id === personId ? { ...p, color } : p) };
      return store;
    }));
  };

  const updateShift = (storeId, personId, daysArray, type, startVal, endVal) => {
    setSchedule(prev => {
      const start = type === 'personalizado' ? startVal : getShiftDetails(type).start;
      const end = type === 'personalizado' ? endVal : getShiftDetails(type).end;
      const finalEnd = start > end ? start : end;
      const nextPersonSchedule = { ...prev[storeId][personId] };
      daysArray.forEach(d => { nextPersonSchedule[d] = { type, start, end: finalEnd }; });
      return { ...prev, [storeId]: { ...prev[storeId], [personId]: nextPersonSchedule } };
    });
  };

  const addWeekToBatch = () => {
    if (!startDate || !endDate) { showToast('Selecciona las fechas', 'error'); return; }
    const weekData = {
      label: formatWeekLabel(startDate, endDate),
      storesSnapshot: JSON.parse(JSON.stringify(stores)),
      scheduleSnapshot: JSON.parse(JSON.stringify(schedule))
    };
    setWeekBatch(prev => [...prev, weekData]);
    showToast(`Semana guardada con éxito`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generateExcel(weekBatch, formatWeekLabel(startDate, endDate), stores, schedule);
      showToast('Excel exportado correctamente');
    } catch (e) {
      console.error(e);
      showToast('Error al exportar', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRemoveFromBatch = (index) => setWeekBatch(prev => prev.filter((_, idx) => idx !== index));
  const handleClearBatch = () => setWeekBatch([]);
  const handleResetApp = () => {
    if (window.confirm('¿Restaurar la app por completo? Se perderán los datos.')) {
      localStorage.removeItem(STORAGE_KEYS.stores);
      localStorage.removeItem(STORAGE_KEYS.schedule);
      localStorage.removeItem(STORAGE_KEYS.batch);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <header className="bg-white rounded-[24px] shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="relative">
              <div className="flex flex-col mb-1 relative">
                <button onClick={handleLogout} className="absolute -top-5 left-0 text-slate-400 hover:text-slate-600 flex items-center gap-1.5 text-[11px] font-bold transition-colors">
                  <LogOut size={12} strokeWidth={3}/> Cerrar sesión
                </button>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-2">
                  Horarios <span className="text-[#d50000]">Tiendas Rojas</span>
                </h1>
              </div>
              <p className="text-slate-500 text-sm font-medium">Panel de gestión y reportes semanales</p>
            </div>

            <div className="flex flex-col items-stretch xl:items-end gap-3 w-full xl:w-auto">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                <DateRangePicker startDate={startDate} endDate={endDate} onDateChange={handleDateChange} />
                
                <button 
                  onClick={() => setShowGlobalPreview(true)}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <TableProperties size={18} strokeWidth={2.5} /> Ver reporte global
                </button>

                <button 
                  onClick={addWeekToBatch}
                  className="w-full sm:w-auto bg-[#d50000] hover:bg-red-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Plus size={18} strokeWidth={3} /> Agregar semana
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {stores.map(store => (
            <StoreCard key={store.id} store={store} schedule={schedule} onAddPerson={addPerson} onRemovePerson={removePerson} onUpdatePersonName={updatePersonName} onUpdatePersonColor={updatePersonColor} onUpdateShift={updateShift} />
          ))}
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Semanas listas para exportar</h3>
            <button onClick={handleResetApp} className="text-xs text-slate-400 hover:text-slate-700 font-bold transition-colors flex items-center gap-1.5">
              <RotateCcw size={14} strokeWidth={3} /> Reiniciar app
            </button>
          </div>
          
          <div className="space-y-3 mb-8">
            {weekBatch.length === 0 ? (
              <div className="text-slate-400 text-sm py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-bold">
                No hay semanas guardadas en la lista.
              </div>
            ) : (
              weekBatch.map((w, i) => (
                <div key={i} className="flex justify-between items-center bg-white border border-slate-200 px-5 py-4 rounded-2xl shadow-sm hover:border-slate-300 transition-colors">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d50000] shrink-0"></span>{w.label}
                  </span>
                  <button onClick={() => handleRemoveFromBatch(i)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-[#d50000] rounded-xl transition-colors">
                    <Trash2 size={18} strokeWidth={2.5}/>
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
            <button onClick={handleExport} disabled={isExporting || weekBatch.length === 0} className="bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95">
              <Download size={18} strokeWidth={3} /> {isExporting ? 'Procesando...' : 'Exportar a Excel'}
            </button>
            <button onClick={handleClearBatch} disabled={weekBatch.length === 0} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 disabled:opacity-50 px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95">
              Vaciar lista
            </button>
          </div>
        </div>
      </div>
      
      <PreviewExcel isOpen={showGlobalPreview} onClose={() => setShowGlobalPreview(false)} stores={stores} schedule={schedule} />
      <Toast toast={toast} />
    </div>
  );
}