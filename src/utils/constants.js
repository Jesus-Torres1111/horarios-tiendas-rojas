import { Sun, Sunset, Briefcase, BedDouble, Clock } from 'lucide-react';

export const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];

export const HOURS = [
  '8:00 a 9:00', '9:00 a 10:00', '10:00 a 11:00', '11:00 a 12:00', '12:00 a 1:00',
  '1:00 a 2:00', '2:00 a 3:00', '3:00 a 4:00', '4:00 a 5:00', '5:00 a 6:00',
  '6:00 a 7:00', '7:00 a 8:00', '8:00 a 9:00', '9:00 a 10:00'
];

export const DEFAULT_COLORS = [
  '#d50000', '#3b82f6', '#168428', '#aa6a11',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

export const INITIAL_STORES = [
  {
    id: 1, name: 'TIENDA 1 - NUEVA VILLA', title: 'HORARIO DEL PERSONAL DE TIENDAS ROJAS EIRL - NUEVA VILLA - TIENDA 1',
    people: [
      { id: 'p1', name: 'HILDA', color: '#d50000' },
      { id: 'p4', name: 'JACKIE', color: '#0c899f' },
      { id: 'p2', name: 'DEYSI', color: '#3b82f6' },
      { id: 'p5', name: 'MARCOS', color: '#b97e2b' },
      { id: 'p6', name: 'EMELI', color: '#a855f7' },
      { id: 'p3', name: 'JANET', color: '#168428' }
    ]
  },
  {
    id: 2, name: 'TIENDA 2 - NUEVA VILLA', title: 'HORARIO DEL PERSONAL DE TIENDAS ROJAS EIRL - NUEVA VILLA - TIENDA 2',
    people: [
      { id: 'p7', name: 'CARLA', color: '#ff84a1' },
      { id: 'p8', name: 'TANIA', color: '#faf20f' },
      { id: 'p9', name: 'YORLEY', color: '#348594' },
      { id: 'p10', name: 'MARTÍN', color: '#06b6d4' }
    ]
  }
];

export function getShiftDetails(type, currentStart, currentEnd) {
  switch (type) {
    case 'mañana': return { start: 0, end: 6 };
    case 'tarde': return { start: 6, end: 12 };
    case 'tarde2': return { start: 7, end: 13 };
    case 'completo': return { start: 0, end: 12 };
    case 'descansa': return { start: -1, end: -1 };
    case 'personalizado': return { start: parseInt(currentStart ?? 0, 10), end: parseInt(currentEnd ?? 6, 10) };
    default: return { start: 0, end: 6 };
  }
}

export function getShiftHours(sched) {
  if (!sched || sched.type === 'descansa') return 0;
  const { start, end } = sched.type === 'personalizado' ? sched : getShiftDetails(sched.type);
  return end - start + 1;
}

function hourEdge(index, edge) {
  const raw = HOURS[index];
  if (!raw) return '';
  const [from, to] = raw.split(' a ');
  return edge === 'start' ? from : to;
}

function shiftRangeLabel(type) {
  const { start, end } = getShiftDetails(type);
  return `${hourEdge(start, 'start')} - ${hourEdge(end, 'end')}`;
}

export const SHIFT_TYPES = [
  { id: 'mañana', label: 'Mañana', icon: Sun, getRange: () => shiftRangeLabel('mañana') },
  { id: 'tarde', label: 'Tarde 1', icon: Sunset, getRange: () => shiftRangeLabel('tarde') },
  { id: 'tarde2', label: 'Tarde 2', icon: Sunset, getRange: () => shiftRangeLabel('tarde2') },
  { id: 'completo', label: 'Día completo', icon: Briefcase, getRange: () => shiftRangeLabel('completo') },
  { id: 'descansa', label: 'Descanso', icon: BedDouble, getRange: () => 'Día libre' },
  { id: 'personalizado', label: 'Personalizado', icon: Clock, getRange: () => 'Elegir horas' }
];

export function getShiftMeta(type) {
  return SHIFT_TYPES.find(s => s.id === type) || SHIFT_TYPES[0];
}

export function shiftDisplayLabel(sched) {
  if (sched.type === 'personalizado') return `${hourEdge(sched.start, 'start')} - ${hourEdge(sched.end, 'end')}`;
  if (sched.type === 'descansa') return 'DESCANSO';
  if (sched.type === 'completo') return 'COMPLETO';
  if (sched.type === 'tarde2') return 'TARDE 2';
  if (sched.type === 'tarde') return 'TARDE';
  return 'MAÑANA';
}

export function getShiftStyleClasses(type) {
  switch (type) {
    case 'mañana': return { badge: 'bg-white text-slate-700 border-slate-200' };
    case 'tarde': return { badge: 'bg-red-50 text-red-700 border-red-100' };
    case 'tarde2': return { badge: 'bg-red-100 text-red-800 border-red-200' };
    case 'completo': return { badge: 'bg-[#d50000] text-white border-[#d50000] shadow-md' };
    case 'descansa': return { badge: 'bg-[#f8f9fa] text-slate-400 border-dashed border-slate-300' };
    case 'personalizado': return { badge: 'bg-white text-[#d50000] border-dashed border-red-300' };
    default: return { badge: 'bg-white text-slate-700 border-slate-200' };
  }
}

export function getContrastColorHex(hexColor) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'FF000000' : 'FFFFFFFF';
}

export function formatWeekLabel(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return '';
  try {
    const [, m1, d1] = startDateStr.split('-');
    const [, m2, d2] = endDateStr.split('-');
    const mNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    return `${parseInt(d1)} DE ${mNames[parseInt(m1) - 1]} - ${parseInt(d2)} DE ${mNames[parseInt(m2) - 1]}`;
  } catch {
    return 'SEMANA NUEVA';
  }
}

export function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getWeekRange(referenceDate = new Date()) {
  const dow = referenceDate.getDay(); 
  const diffToMonday = (dow + 6) % 7;
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toLocalDateString(monday), end: toLocalDateString(sunday) };
}