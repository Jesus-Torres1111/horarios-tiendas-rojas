import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { toLocalDateString, parseLocalDate, getWeekRange } from '../utils/constants';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

export default function DateRangePicker({ startDate, endDate, onDateChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => parseLocalDate(startDate || toLocalDateString(new Date())));
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false); }
    function handleEscape(event) { if (event.key === 'Escape') setIsOpen(false); }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEscape); };
  }, []);

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const goToPrevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const applyWeekFromDate = (referenceDate) => {
    const { start, end } = getWeekRange(referenceDate);
    onDateChange(start, end);
    setCurrentMonth(parseLocalDate(start));
    setIsOpen(false);
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    applyWeekFromDate(clickedDate);
  };

  const renderCalendar = () => {
    const totalDays = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="h-9" />);
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = toLocalDateString(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
      const isStart = dateStr === startDate;
      const isEnd = dateStr === endDate;
      const isBetween = startDate && endDate && dateStr > startDate && dateStr < endDate;
      let baseClass = 'h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ';

      if (isStart || isEnd) baseClass += 'bg-[#e60000] text-white shadow-sm';
      else if (isBetween) baseClass += 'bg-red-50 text-[#e60000]';
      else baseClass += 'text-slate-700 hover:bg-slate-100';

      cells.push(
        <div key={d} className="flex justify-center">
          <button type="button" onClick={() => handleDateClick(d)} className={baseClass}>{d}</button>
        </div>
      );
    }
    return cells;
  };

  const formatDisplay = (dateStr) => {
    if (!dateStr) return '__ / ___';
    const d = parseLocalDate(dateStr);
    return `${d.getDate().toString().padStart(2, '0')} ${MONTHS[d.getMonth()].substring(0, 3)}`;
  };

  return (
    <div className="relative w-full sm:w-auto" ref={wrapperRef}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-center bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 transition-colors shadow-sm w-full sm:w-auto">
        <CalendarIcon size={18} className="text-[#e60000] mr-3 shrink-0" strokeWidth={2.5} />
        <div className="flex items-center text-sm font-bold text-slate-700 tracking-wide">
          <span>{formatDisplay(startDate)}</span>
          <span className="mx-2 text-slate-300 opacity-50">→</span>
          <span>{formatDisplay(endDate)}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 md:left-auto md:right-0 bg-white border border-slate-100 shadow-2xl rounded-[20px] p-5 w-80 z-50">
          <div className="flex gap-2 mb-5">
            <button type="button" onClick={() => applyWeekFromDate(new Date())} className="flex-1 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-[#e60000] text-slate-600 transition-colors">
              Esta semana
            </button>
            <button type="button" onClick={() => { const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7); applyWeekFromDate(nextWeek); }} className="flex-1 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-[#e60000] text-slate-600 transition-colors">
              Próx. semana
            </button>
          </div>
          <div className="flex justify-between items-center mb-5">
            <button type="button" onClick={goToPrevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
              <ChevronLeft size={18} strokeWidth={3} />
            </button>
            <span className="font-black text-slate-800 text-sm tracking-wide uppercase">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button type="button" onClick={goToNextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
              <ChevronRight size={18} strokeWidth={3} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-3">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>
      )}
    </div>
  );
}