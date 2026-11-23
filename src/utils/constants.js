import { Sun, Sunset, Briefcase, BedDouble, Clock, CalendarOff } from 'lucide-react';

export const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];

export const HOURS = [
  '8:00 a 9:00', '9:00 a 10:00', '10:00 a 11:00', '11:00 a 12:00', '12:00 a 1:00',
  '1:00 a 2:00', '2:00 a 3:00', '3:00 a 4:00', '4:00 a 5:00', '5:00 a 6:00',
  '6:00 a 7:00', '7:00 a 8:00', '8:00 a 9:00', '9:00 a 10:00'
];

export const BREAK_OPTIONS = [
  { index: 4, label: '12:00 pm – 1:00 pm', short: '12:00PM-1:00PM' },
  { index: 5, label: '1:00 pm – 2:00 pm', short: '1:00PM-2:00PM' },
  { index: 6, label: '2:00 pm – 3:00 pm', short: '2:00PM-3:00PM' },
  { index: 7, label: '3:00 pm – 4:00 pm', short: '3:00PM-4:00PM' }
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

export function isFullDayShift(type, start, end) {
  if (type === 'completo') return true;
  if (type === 'personalizado' && start === 0 && end >= 12) return true;
  return false;
}

export function getBreakMeta(breakHour) {
  const idx = Number.isInteger(breakHour) ? breakHour : 5;
  return BREAK_OPTIONS.find(b => b.index === idx) || BREAK_OPTIONS[1];
}

export function getShiftDetails(type, currentStart, currentEnd, currentBreak) {
  switch (type) {
    case 'mañana': return { start: 0, end: 6 };
    case 'tarde': return { start: 6, end: 12 };
    case 'tarde2': return { start: 7, end: 13 };
    case 'completo': return { start: 0, end: 12, breakHour: Number.isInteger(currentBreak) ? currentBreak : 5 };
    case 'descansa': return { start: -1, end: -1 };
    case 'sin_turno': return { start: -1, end: -1 };
    case 'personalizado': {
      const start = parseInt(currentStart ?? 0, 10);
      const end = parseInt(currentEnd ?? 6, 10);
      const full = isFullDayShift('personalizado', start, end);
      return {
        start,
        end,
        ...(full ? { breakHour: Number.isInteger(currentBreak) ? currentBreak : 5 } : {})
      };
    }
    default: return { start: 0, end: 6 };
  }
}

export function getShiftHours(sched) {
  if (!sched || sched.type === 'descansa' || sched.type === 'sin_turno') return 0;
  const { start, end } = sched.type === 'personalizado' ? sched : getShiftDetails(sched.type);
  if (start < 0 || end < start) return 0;
  const rawHours = end - start + 1;
  return isFullDayShift(sched.type, start, end) ? Math.max(0, rawHours - 1) : rawHours;
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
  { id: 'sin_turno', label: 'Sin turno', icon: CalendarOff, getRange: () => 'No labora (Auxiliar)' },
  { id: 'personalizado', label: 'Personalizado', icon: Clock, getRange: () => 'Elegir horas' }
];

export function getShiftMeta(type) {
  return SHIFT_TYPES.find(s => s.id === type) || SHIFT_TYPES[0];
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

export function getWeekDates(startDateStr) {
  const base = startDateStr ? parseLocalDate(startDateStr) : parseLocalDate(getWeekRange(new Date()).start);
  return DAYS.map((_, idx) => {
    const d = new Date(base);
    d.setDate(base.getDate() + idx);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });
}