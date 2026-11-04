import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, Plus, Trash2, RotateCcw, CheckCircle2, AlertCircle, LogOut, TableProperties, Cloud, CloudOff, Loader2, Upload, FileJson } from 'lucide-react';
import StoreCard from './components/StoreCard';
import DateRangePicker from './components/DateRangePicker';
import Login from './components/Login';
import PreviewExcel from './components/PreviewExcel';
import { INITIAL_STORES, DEFAULT_COLORS, DAYS, formatWeekLabel, getShiftDetails, toLocalDateString } from './utils/constants';
import { generateExcel } from './utils/excelExport';
import { loadState, saveState, getKey, clearKey } from './utils/storage';

const DEFAULT_SHIFT = { type: 'mañana', start: 0, end: 6 };

function buildInitialSchedule(stores) {
  const initial = {};
  stores.forEach(store => {
    initial[store.id] = {};
    store.people.forEach(person => {
      initial[store.id][person.id] = {};
      DAYS.forEach(day => {
        initial[store.id][person.id][day] = { ...DEFAULT_SHIFT };
      });
    });
  });
  return initial;
}

function normalizeSchedule(stores, schedule) {
  const next = {};
  stores.forEach(store => {
    next[store.id] = {};
    store.people.forEach(person => {
      next[store.id][person.id] = {};
      DAYS.forEach(day => {
        next[store.id][person.id][day] = schedule?.[store.id]?.[person.id]?.[day] || { ...DEFAULT_SHIFT };
      });
    });
  });
  return next;
}

function isValidDoc(doc) {
  return Boolean(doc) && Array.isArray(doc.stores) && Boolean(doc.schedule) && typeof doc.schedule === 'object';
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

function SyncBadge({ status }) {
  const config = {
    saving: { icon: <Loader2 size={13} strokeWidth={3} className="animate-spin" />, text: 'Guardando...', color: 'text-slate-500' },
    saved: { icon: <Cloud size={13} strokeWidth={3} />, text: 'Guardado en la nube', color: 'text-emerald-600' },
    error: { icon: <CloudOff size={13} strokeWidth={3} />, text: 'Error al guardar en la nube', color: 'text-red-600' },
    local: { icon: <CloudOff size={13} strokeWidth={3} />, text: 'Solo en este dispositivo', color: 'text-amber-600' },
    idle: { icon: <Cloud size={13} strokeWidth={3} />, text: 'Cargando...', color: 'text-slate-400' }
  }[status] || { icon: null, text: '', color: '' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest ${config.color}`}>
      {config.icon}{config.text}
    </span>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getKey() !== '');
  const [stores, setStores] = useState(INITIAL_STORES);
  const [schedule, setSchedule] = useState(() => buildInitialSchedule(INITIAL_STORES));
  const [weekBatch, setWeekBatch] = useState([]);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [startDate, setStartDate] = useState(() => toLocalDateString(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 6);
    return toLocalDateString(d);
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showGlobalPreview, setShowGlobalPreview] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const canSyncRef = useRef(false);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    loadState().then(({ data, remote }) => {
      if (cancelled) return;
      if (isValidDoc(data)) {
        setStores(data.stores);
        setSchedule(normalizeSchedule(data.stores, data.schedule));
        setWeekBatch(Array.isArray(data.batch) ? data.batch : []);
      }
      canSyncRef.current = remote;
      setSyncStatus(remote ? 'saved' : 'local');
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!ready) return;
    setSyncStatus(canSyncRef.current ? 'saving' : 'local');
    const timer = setTimeout(async () => {
      const ok = await saveState({ stores, schedule, batch: weekBatch }, canSyncRef.current);
      setSyncStatus(canSyncRef.current ? (ok ? 'saved' : 'error') : 'local');
    }, 700);
    return () => clearTimeout(timer);
  }, [ready, stores, schedule, weekBatch]);

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
          <Loader2 size={20} strokeWidth={3} className="animate-spin text-[#d50000]" /> Cargando horarios...
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearKey();
    setReady(false);
    setIsAuthenticated(false);
  };

  const handleDateChange = (start, end) => { setStartDate(start); setEndDate(end); };

  const addPerson = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    const newId = 'p' + Date.now();
    const usedColors = new Set(store.people.map(p => p.color.toLowerCase()));
    const color = DEFAULT_COLORS.find(c => !usedColors.has(c.toLowerCase()))
      || '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    const name = `NUEVO ${store.people.length + 1}`;

    setStores(prev => prev.map(s => s.id === storeId ? { ...s, people: [...s.people, { id: newId, name, color }] } : s));
    setSchedule(prev => {
      const days = {};
      DAYS.forEach(day => { days[day] = { type: 'descansa', start: -1, end: -1 }; });
      return { ...prev, [storeId]: { ...prev[storeId], [newId]: days } };
    });
  };

  const removePerson = (storeId, personId) => {
    setStores(prev => prev.map(store => store.id === storeId ? { ...store, people: store.people.filter(p => p.id !== personId) } : store));
    setSchedule(prev => {
      const nextStoreSchedule = { ...prev[storeId] };
      delete nextStoreSchedule[personId];
      return { ...prev, [storeId]: nextStoreSchedule };
    });
  };

  const updatePersonName = (storeId, personId, name) => {
    setStores(prev => prev.map(store => store.id === storeId ? { ...store, people: store.people.map(p => p.id === personId ? { ...p, name: name.toUpperCase() } : p) } : store));
  };

  const updatePersonColor = (storeId, personId, color) => {
    setStores(prev => prev.map(store => store.id === storeId ? { ...store, people: store.people.map(p => p.id === personId ? { ...p, color } : p) } : store));
  };

  const updateShift = (storeId, personId, daysArray, type, startVal, endVal) => {
    setSchedule(prev => {
      let start;
      let end;
      if (type === 'personalizado') {
        const fromRest = startVal < 0;
        start = fromRest ? 0 : startVal;
        end = fromRest ? 6 : (endVal >= start ? endVal : start);
      } else {
        const details = getShiftDetails(type);
        start = details.start;
        end = details.end;
      }
      const nextPersonSchedule = { ...prev[storeId][personId] };
      daysArray.forEach(d => { nextPersonSchedule[d] = { type, start, end }; });
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
    showToast('Semana guardada con éxito');
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

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify({ stores, schedule, batch: weekBatch }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo_horarios_${toLocalDateString(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Respaldo JSON descargado');
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!isValidDoc(data)) throw new Error('invalid');
        setStores(data.stores);
        setSchedule(normalizeSchedule(data.stores, data.schedule));
        setWeekBatch(Array.isArray(data.batch) ? data.batch : []);
        showToast('Respaldo importado');
      } catch {
        showToast('Archivo JSON inválido', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRemoveFromBatch = (index) => setWeekBatch(prev => prev.filter((_, idx) => idx !== index));
  const handleClearBatch = () => setWeekBatch([]);

  const handleResetApp = () => {
    if (window.confirm('¿Restaurar la app por completo? Se perderán los datos.')) {
      setStores(INITIAL_STORES);
      setSchedule(buildInitialSchedule(INITIAL_STORES));
      setWeekBatch([]);
      showToast('App restaurada');
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
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <p className="text-slate-500 text-sm font-medium">Panel de gestión y reportes semanales</p>
                <SyncBadge status={syncStatus} />
              </div>
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

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-6 border-t border-slate-100">
            <button onClick={handleExport} disabled={isExporting || weekBatch.length === 0} className="bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95">
              <Download size={18} strokeWidth={3} /> {isExporting ? 'Procesando...' : 'Exportar a Excel'}
            </button>
            <button onClick={handleClearBatch} disabled={weekBatch.length === 0} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 disabled:opacity-50 px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95">
              Vaciar lista
            </button>
            <div className="flex gap-4 sm:ml-auto">
              <button onClick={handleExportJson} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-5 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95">
                <FileJson size={18} strokeWidth={2.5} /> Respaldo JSON
              </button>
              <label className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-5 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer">
                <Upload size={18} strokeWidth={2.5} /> Importar JSON
                <input type="file" accept="application/json,.json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <PreviewExcel isOpen={showGlobalPreview} onClose={() => setShowGlobalPreview(false)} stores={stores} schedule={schedule} />
      <Toast toast={toast} />
    </div>
  );
}