import { Sun, Sunset, Repeat, BedDouble } from 'lucide-react';
import { DAYS, getShiftDetails } from './constants';

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
    cell: 'bg-slate-50 border-dashed border-slate-300 text-slate-400 hover:border-slate-400',
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

export function getShiftRange(sched) {
  if (!sched || sched.type === 'descansa') return null;
  if (sched.type === 'personalizado' && sched.start < 0) return null;
  const details = sched.type === 'personalizado' ? sched : getShiftDetails(sched.type);
  const start = Math.max(0, details.start);
  const end = Math.max(start, details.end);
  return { start, end };
}

export function rangeLabel(sched) {
  const range = getShiftRange(sched);
  if (!range) return 'Día libre';
  return `${hourLabel(range.start, 'start')} – ${hourLabel(range.end, 'end')}`;
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
    id: 'descanso',
    label: 'Empezar vacío',
    description: 'Todos los días en descanso, lo armas tú'
  }
];

export const PATTERN_ICONS = {
  manana: Sun,
  tarde: Sunset,
  'alt-completo': Repeat,
  'alt-descanso': Repeat,
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
    const details = getShiftDetails(type);
    result[day] = { type, start: details.start, end: details.end };
  });
  return result;
}