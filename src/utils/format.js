import { Sun, Sunset, Repeat, BedDouble, UserCheck, Plane } from 'lucide-react';
import { DAYS, getShiftDetails, isFullDayShift, getBreakMeta } from './constants';

export const SHORT_DAYS = {
  LUNES: 'LUN',
  MARTES: 'MAR',
  MIÉRCOLES: 'MIÉ',
  JUEVES: 'JUE',
  VIERNES: 'VIE',
  SÁBADO: 'SÁB',
  DOMINGO: 'DOM'
};

export const SHIFT_NAMES = {
  mañana: 'Mañana',
  tarde: 'Tarde 1',
  tarde2: 'Tarde 2',
  completo: 'Día completo',
  descansa: 'Descanso',
  vacaciones: 'Vacaciones',
  sin_turno: 'Sin turno',
  personalizado: 'Personalizado'
};

export const SHIFT_THEME = {
  mañana: {
    cell: 'bg-amber-50 border-amber-200 text-amber-900 hover:border-amber-400',
    barOn: 'bg-amber-400',
    barOff: 'bg-amber-100',
    dot: 'bg-amber-400'
  },
  tarde: {
    cell: 'bg-orange-50 border-orange-200 text-orange-900 hover:border-orange-400',
    barOn: 'bg-orange-400',
    barOff: 'bg-orange-100',
    dot: 'bg-orange-400'
  },
  tarde2: {
    cell: 'bg-rose-50 border-rose-200 text-rose-900 hover:border-rose-400',
    barOn: 'bg-rose-400',
    barOff: 'bg-rose-100',
    dot: 'bg-rose-400'
  },
  completo: {
    cell: 'bg-[#d50000] border-[#d50000] text-white hover:bg-red-700 hover:border-red-700',
    barOn: 'bg-white',
    barOff: 'bg-white/25',
    dot: 'bg-[#d50000]'
  },
  descansa: {
    cell: 'bg-red-50/50 border-dashed border-red-200 text-red-400 hover:border-red-300',
    barOn: 'bg-red-200',
    barOff: 'bg-red-100',
    dot: 'bg-red-400'
  },
  vacaciones: {
    cell: 'bg-sky-50 border-sky-200 text-sky-900 hover:border-sky-400',
    barOn: 'bg-sky-400',
    barOff: 'bg-sky-100',
    dot: 'bg-sky-400'
  },
  sin_turno: {
    cell: 'bg-slate-50 border-dashed border-slate-200 text-slate-400 hover:border-slate-300',
    barOn: 'bg-slate-300',
    barOff: 'bg-slate-200',
    dot: 'bg-slate-300'
  },
  personalizado: {
    cell: 'bg-violet-50 border-violet-200 text-violet-900 hover:border-violet-400',
    barOn: 'bg-violet-500',
    barOff: 'bg-violet-100',
    dot: 'bg-violet-500'
  }
};

export function hourLabel(index, edge = 'start') {
  const h = 8 + index + (edge === 'end' ? 1 : 0);
  const suffix = h >= 12 && h < 24 ? 'pm' : 'am';
  const h12 = h > 12 ? h - 12 : h;
  return `${h12}:00 ${suffix}`;
}

export function hourLabelCompact(index, edge = 'start') {
  const h = 8 + index + (edge === 'end' ? 1 : 0);
  const suffix = h >= 12 && h < 24 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h;
  return `${h12}:00${suffix}`;
}

export function getShiftRange(sched) {
  if (!sched || sched.type === 'descansa' || sched.type === 'sin_turno' || sched.type === 'vacaciones') return null;
  if (sched.type === 'personalizado' && sched.start < 0) return null;
  const details = sched.type === 'personalizado' ? sched : getShiftDetails(sched.type);
  const start = Math.max(0, details.start);
  const end = Math.max(start, details.end);
  return { start, end };
}

export function rangeLabel(sched) {
  if (sched?.type === 'sin_turno') return 'No labora';
  if (sched?.type === 'vacaciones') return 'De vacaciones';
  const range = getShiftRange(sched);
  if (!range) return 'Día libre';
  return `${hourLabel(range.start, 'start')} – ${hourLabel(range.end, 'end')}`;
}

export function breakBadgeLabel(sched) {
  if (!sched) return '';
  const details = sched.type === 'personalizado' ? sched : getShiftDetails(sched.type, undefined, undefined, sched.breakHour);
  if (!isFullDayShift(sched.type, details.start, details.end)) return '';
  const meta = getBreakMeta(sched.breakHour);
  return `Refrig: ${meta.short}`;
}

export function excelCellShiftText(sched) {
  if (!sched || sched.type === 'sin_turno') return '—';
  if (sched.type === 'descansa') return 'DESCANSO';
  if (sched.type === 'vacaciones') return 'VACACIONES';
  const range = getShiftRange(sched);
  if (!range) return '—';
  const timeText = `${hourLabelCompact(range.start, 'start')} - ${hourLabelCompact(range.end, 'end')}`;
  if (isFullDayShift(sched.type, range.start, range.end)) {
    const meta = getBreakMeta(sched.breakHour);
    return `${timeText}\n(REFRIG. ${meta.short})`;
  }
  return timeText;
}

export const PATTERNS = [
  {
    id: 'manana',
    label: 'Mañana todos los días',
    description: `${rangeLabel({ type: 'mañana' })}, de lunes a domingo`
  },
  {
    id: 'tarde',
    label: 'Tarde todos los días',
    description: `${rangeLabel({ type: 'tarde' })}, de lunes a domingo`
  },
  {
    id: 'alt-completo',
    label: 'Alterna: completo y descanso',
    description: 'Lun completo, mar descansa, mié completo…'
  },
  {
    id: 'alt-descanso',
    label: 'Alterna: descanso y completo',
    description: 'Lun descansa, mar completo, mié descansa…'
  },
  {
    id: 'vacaciones',
    label: 'Vacaciones toda la semana',
    description: 'De lunes a domingo en vacaciones'
  },
  {
    id: 'auxiliar',
    label: 'Auxiliar / Apoyo puntual',
    description: 'Todos los días sin turno, marcas solo los días que apoya'
  },
  {
    id: 'descanso',
    label: 'Empezar en descanso',
    description: 'Todos los días en descanso, lo armas tú'
  }
];

export const PATTERN_ICONS = {
  manana: Sun,
  tarde: Sunset,
  'alt-completo': Repeat,
  'alt-descanso': Repeat,
  vacaciones: Plane,
  auxiliar: UserCheck,
  descanso: BedDouble
};

export function buildPattern(patternId) {
  const result = {};
  DAYS.forEach((day, i) => {
    let type = 'descansa';
    if (patternId === 'manana') type = 'mañana';
    else if (patternId === 'tarde') type = 'tarde';
    else if (patternId === 'alt-completo') type = i % 2 === 0 ? 'completo' : 'descansa';
    else if (patternId === 'alt-descanso') type = i % 2 === 0 ? 'descansa' : 'completo';
    else if (patternId === 'vacaciones') type = 'vacaciones';
    else if (patternId === 'auxiliar') type = 'sin_turno';
    const details = getShiftDetails(type);
    result[day] = { ...details, type };
  });
  return result;
}