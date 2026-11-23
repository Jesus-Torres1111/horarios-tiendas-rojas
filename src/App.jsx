import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Download, Plus, Trash2, RotateCcw, CheckCircle2, AlertCircle, LogOut, TableProperties,
  Cloud, CloudOff, Loader2, Upload, FileJson, Store, Users, Clock, CalendarCheck
} from 'lucide-react';
import StoreCard from './components/StoreCard';
import DateRangePicker from './components/DateRangePicker';
import Login from './components/Login';
import PreviewExcel from './components/PreviewExcel';
import { INITIAL_STORES, DAYS, formatWeekLabel, getShiftDetails, getShiftHours, toLocalDateString, getWeekRange, isFullDayShift } from './utils/constants';
import { buildPattern } from './utils/format';
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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] pop-in">
      <div className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold tracking-wide ${isError ? 'bg-white border-red-200 text-red-700' : 'bg-slate-900 border-slate-900 text-white'}`}>
        {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} className="text-emerald-400" />}
        {toast.message}
      </div>
    </div>
  );
}

function SyncBadge({ status }) {
  const config = {
    saving: { icon: <Loader2 size={12} strokeWidth={3} className="animate-spin" />, text: 'Guardando...', color: 'text-slate-500' },
    saved: { icon: <Cloud size={12} strokeWidth={3} />, text: 'Guardado en la nube', color: 'text-emerald-600' },
    error: { icon: <CloudOff size={12} strokeWidth={3} />, text: 'Error al guardar', color: 'text-red-600' },
    local: { icon: <CloudOff size={12} strokeWidth={3} />, text: 'Solo en este dispositivo', color: 'text-amber-600' },
    idle: { icon: <Cloud size={12} strokeWidth={3} />, text: 'Cargando...', color: 'text-slate-400' }
  }[status] || { icon: null, text: '', color: '' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${config.color}`}>
      {config.icon}{config.text}
    </span>
  );
}

function StepCard({ number, title, children }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-full bg-[#d50000] text-white text-xs font-black flex items-center justify-center shrink-0">{number}</span>
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-red-50 text-[#d50000] flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-xl md:text-2xl font-black text-slate-900 leading-none">{value}</div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate">{label}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getKey() !== '');
  const [stores, setStores] = useState(INITIAL_STORES);
  const [schedule, setSchedule] = useState(() => buildInitialSchedule(INITIAL_STORES));
  const [weekBatch, setWeekBatch] = useState([]);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');

  const [startDate, setStartDate] = useState(() => getWeekRange(new Date()).start);
  const [endDate, setEndDate] = useState(() => getWeekRange(new Date()).end);

  const [isExporting, setIsExporting] = useState(false);
  const [showGlobalPreview, setShowGlobalPreview] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const canSyncRef = useRef(false);
  const isFirstSyncRef = useRef(true);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    isFirstSyncRef.current = true;
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
    if (isFirstSyncRef.current) {
      isFirstSyncRef.current = false;
      return;
    }
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
      <div translate="no" className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
          <Loader2 size={20} strokeWidth={3} className="animate-spin text-[#d50000]" /> Cargando horarios...
        </div>
      </div>
    );
  }

  const totalPeople = stores.reduce((sum, s) => sum + s.people.length, 0);
  const totalHours = stores.reduce((sum, s) => sum + s.people.reduce((acc, p) =>
    acc + DAYS.reduce((a, d) => a + getShiftHours(schedule[s.id]?.[p.id]?.[d]), 0), 0), 0);

  const handleLogout = () => {
    clearKey();
    setReady(false);
    setIsAuthenticated(false);
  };

  const handleDateChange = (start, end) => { setStartDate(start); setEndDate(end); };

  const addPerson = (storeId, { name, color, pattern } = {}) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    const newId = 'p' + Date.now();
    const finalName = (name || '').trim().toUpperCase() || `NUEVO ${store.people.length + 1}`;
    const finalColor = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#d50000';
    setStores(prev => prev.map(s => s.id === storeId ? { ...s, people: [...s.people, { id: newId, name: finalName, color: finalColor }] } : s));
    setSchedule(prev => ({ ...prev, [storeId]: { ...prev[storeId], [newId]: buildPattern(pattern || 'auxiliar') } }));
    showToast(`${finalName} agregado a la tienda`);
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

  const updateShift = (storeId, personId, daysArray, type, startVal, endVal, breakHourVal) => {
    setSchedule(prev => {
      let start;
      let end;
      let breakHour;
      if (type === 'personalizado') {
        const fromRest = startVal < 0;
        start = fromRest ? 0 : startVal;
        end = fromRest ? 6 : (endVal >= start ? endVal : start);
        if (isFullDayShift('personalizado', start, end)) {
          breakHour = Number.isInteger(breakHourVal) ? breakHourVal : 5;
        }
      } else {
        const details = getShiftDetails(type, undefined, undefined, breakHourVal);
        start = details.start;
        end = details.end;
        breakHour = details.breakHour;
      }
      const nextPersonSchedule = { ...prev[storeId][personId] };
      daysArray.forEach(d => {
        nextPersonSchedule[d] = {
          type,
          start,
          end,
          ...(Number.isInteger(breakHour) ? { breakHour } : {})
        };
      });
      return { ...prev, [storeId]: { ...prev[storeId], [personId]: nextPersonSchedule } };
    });
  };

  const applyPattern = (storeId, personId, patternId) => {
    setSchedule(prev => ({ ...prev, [storeId]: { ...prev[storeId], [personId]: buildPattern(patternId) } }));
    showToast('Plantilla aplicada');
  };

  const addWeekToBatch = () => {
    if (!startDate || !endDate) { showToast('Selecciona las fechas', 'error'); return; }
    const label = formatWeekLabel(startDate, endDate);
    const weekData = {
      label,
      startDateSnapshot: startDate,
      storesSnapshot: JSON.parse(JSON.stringify(stores)),
      scheduleSnapshot: JSON.parse(JSON.stringify(schedule))
    };

    const exists = weekBatch.some(w => w.label === label);
    setWeekBatch(prev => {
      if (exists) {
        return prev.map(w => w.label === label ? weekData : w);
      }
      return [...prev, weekData];
    });
    showToast(exists ? 'Semana actualizada en la lista' : 'Semana guardada en la lista');
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generateExcel(weekBatch, formatWeekLabel(startDate, endDate), stores, schedule, startDate);
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
    if (window.confirm('¿Restaurar la app por completo? Se perderán todos los datos.')) {
      setStores(INITIAL_STORES);
      setSchedule(buildInitialSchedule(INITIAL_STORES));
      setWeekBatch([]);
      showToast('App restaurada');
    }
  };

  return (
    <div translate="no" className="min-h-screen bg-[#f0f4f8] text-slate-900 font-sans">
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-[68px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#d50000] to-red-800 flex items-center justify-center shadow-md shadow-red-900/20 shrink-0">
              <Store size={21} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-slate-900 leading-tight truncate text-base md:text-lg">
                Horarios <span className="text-[#d50000]">Tiendas Rojas</span>
              </h1>
              <SyncBadge status={syncStatus} />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowGlobalPreview(true)}
              className="bg-slate-900 hover:bg-black text-white px-4 md:px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <TableProperties size={17} strokeWidth={2.5} />
              <span className="hidden sm:inline">Reporte global</span>
            </button>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <LogOut size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
        <section className="bg-white rounded-[24px] shadow-sm border border-slate-200 p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StepCard number={1} title="Elige la semana">
              <DateRangePicker startDate={startDate} endDate={endDate} onDateChange={handleDateChange} />
            </StepCard>
            <StepCard number={2} title="Arma los horarios">
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Toca cualquier día de la tabla para cambiar el turno. Toca el nombre de una persona para editarla o usar una plantilla.
              </p>
            </StepCard>
            <StepCard number={3} title="Guarda la semana">
              <button
                onClick={addWeekToBatch}
                className="w-full bg-[#d50000] hover:bg-red-700 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-red-600/20 active:scale-95"
              >
                <Plus size={18} strokeWidth={3} /> Guardar en la lista
              </button>
            </StepCard>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<Users size={20} strokeWidth={2.5} />} label="Personal" value={totalPeople} />
          <StatCard icon={<Clock size={20} strokeWidth={2.5} />} label="Horas programadas" value={totalHours} />
          <StatCard icon={<CalendarCheck size={20} strokeWidth={2.5} />} label="Semanas guardadas" value={weekBatch.length} />
        </div>

        <div className="space-y-6">
          {stores.map(store => (
            <StoreCard
              key={store.id}
              store={store}
              schedule={schedule}
              startDate={startDate}
              onAddPerson={addPerson}
              onRemovePerson={removePerson}
              onUpdatePersonName={updatePersonName}
              onUpdatePersonColor={updatePersonColor}
              onUpdateShift={updateShift}
              onApplyPattern={applyPattern}
            />
          ))}
        </div>

        <section className="bg-white rounded-[24px] shadow-sm border border-slate-200 p-5 md:p-8">
          <div className="flex justify-between items-center mb-6 gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Semanas listas para exportar</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">Cada semana se exporta como una hoja distinta en el Excel.</p>
            </div>
            <button onClick={handleResetApp} className="text-xs text-slate-400 hover:text-red-600 font-bold transition-colors flex items-center gap-1.5 shrink-0">
              <RotateCcw size={14} strokeWidth={3} /> Reiniciar app
            </button>
          </div>

          <div className="space-y-3 mb-8">
            {weekBatch.length === 0 ? (
              <div className="text-slate-400 text-sm py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-bold">
                Aún no hay semanas guardadas. Usa el paso 3 de arriba.
              </div>
            ) : (
              weekBatch.map((w, i) => (
                <div key={i} className="flex justify-between items-center bg-white border border-slate-200 px-5 py-4 rounded-2xl shadow-sm hover:border-slate-300 transition-colors">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-red-50 text-[#d50000] text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                    {w.label}
                  </span>
                  <button onClick={() => handleRemoveFromBatch(i)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-[#d50000] rounded-xl transition-colors">
                    <Trash2 size={18} strokeWidth={2.5} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-6 border-t border-slate-100">
            <button
              onClick={handleExport}
              disabled={isExporting || weekBatch.length === 0}
              className="bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Download size={18} strokeWidth={3} /> {isExporting ? 'Procesando...' : 'Exportar a Excel'}
            </button>
            <button
              onClick={handleClearBatch}
              disabled={weekBatch.length === 0}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 disabled:opacity-50 px-6 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95"
            >
              Vaciar lista
            </button>
            <div className="flex gap-3 sm:ml-auto">
              <button onClick={handleExportJson} className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-5 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
                <FileJson size={18} strokeWidth={2.5} /> Respaldo JSON
              </button>
              <label className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-5 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer">
                <Upload size={18} strokeWidth={2.5} /> Importar JSON
                <input type="file" accept="application/json,.json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
          </div>
        </section>
      </main>

      <PreviewExcel isOpen={showGlobalPreview} onClose={() => setShowGlobalPreview(false)} stores={stores} schedule={schedule} startDate={startDate} />
      <Toast toast={toast} />
    </div>
  );
}