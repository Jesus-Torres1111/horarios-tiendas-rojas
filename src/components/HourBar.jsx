import { HOURS } from '../utils/constants';
import { getShiftRange, SHIFT_THEME } from '../utils/format';

export default function HourBar({ sched, className = '' }) {
  const range = getShiftRange(sched);
  const theme = SHIFT_THEME[sched?.type] || SHIFT_THEME['mañana'];
  return (
    <div className={`flex gap-px w-full ${className}`}>
      {HOURS.map((_, i) => {
        const active = range && i >= range.start && i <= range.end;
        return (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-[2px] ${active ? theme.barOn : theme.barOff}`}
          />
        );
      })}
    </div>
  );
}