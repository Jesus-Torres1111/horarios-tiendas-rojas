import ExcelJS from 'exceljs';
import { DAYS, getShiftHours, getWeekDates } from './constants';
import { excelCellShiftText } from './format';

const BLACK = 'FF000000';
const WHITE = 'FFFFFFFF';
const HEADER_BLUE = 'FFB4C6E7';
const STORE_BANNER = 'FFF4B084';
const STORE_ROW_TINT = 'FFFCE4D6';
const PURPLE = 'FF7030A0';
const DEFAULT_SHIFT = { type: 'mañana', start: 0, end: 6 };

const solid = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const toArgb = (color) => 'FF' + color.replace('#', '').toUpperCase();
const edge = { style: 'thin', color: { argb: BLACK } };
const thinBorder = { top: edge, left: edge, bottom: edge, right: edge };

function uniqueSheetName(wb, label) {
  const base = (label || 'SEMANA').replace(/[\\/*?:[\]]/g, '-').substring(0, 28) || 'SEMANA';
  let name = base;
  let i = 2;
  while (wb.getWorksheet(name)) {
    name = `${base} (${i})`;
    i += 1;
  }
  return name;
}

function getCellStyleByType(type, personColor) {
  if (type === 'descansa') {
    return { fill: 'FFFF0000', fontColor: WHITE };
  }
  if (type === 'vacaciones') {
    return { fill: 'FFCCE5FF', fontColor: 'FF004085' };
  }
  if (type === 'sin_turno') {
    return { fill: 'FFF1F5F9', fontColor: 'FF94A3B8' };
  }
  return {
    fill: toArgb(personColor),
    fontColor: BLACK
  };
}

export async function generateExcel(batch, currentLabel, currentStores, currentSchedule, currentStartDate) {
  const wb = new ExcelJS.Workbook();
  const batchToExport = batch.length > 0 ? batch : [{
    label: currentLabel || 'SEMANA',
    startDateSnapshot: currentStartDate,
    storesSnapshot: currentStores,
    scheduleSnapshot: currentSchedule
  }];

  batchToExport.forEach(week => {
    const ws = wb.addWorksheet(uniqueSheetName(wb, week.label), {
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });

    const weekDates = getWeekDates(week.startDateSnapshot || currentStartDate);

    ws.mergeCells(1, 1, 2, 1);
    const nameHeader = ws.getCell(1, 1);
    nameHeader.value = 'Nombres';
    nameHeader.font = { name: 'Calibri', size: 13, bold: true, color: { argb: BLACK } };
    nameHeader.alignment = { horizontal: 'center', vertical: 'middle' };

    DAYS.forEach((day, idx) => {
      const col = 2 + idx;
      const dayCell = ws.getCell(1, col);
      dayCell.value = day;
      dayCell.fill = solid(HEADER_BLUE);
      dayCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BLACK } };
      dayCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const dateCell = ws.getCell(2, col);
      dateCell.value = weekDates[idx];
      dateCell.fill = solid(WHITE);
      dateCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: BLACK } };
      dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    ws.mergeCells(1, 9, 2, 9);
    const hoursHeader = ws.getCell(1, 9);
    hoursHeader.value = 'HORAS PROG.';
    hoursHeader.fill = solid(PURPLE);
    hoursHeader.font = { name: 'Calibri', size: 10, bold: true, color: { argb: WHITE } };
    hoursHeader.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    for (let r = 1; r <= 2; r++) {
      ws.getRow(r).height = 22;
      for (let c = 1; c <= 9; c++) {
        ws.getCell(r, c).border = thinBorder;
      }
    }

    let currentRow = 3;

    week.storesSnapshot.forEach(store => {
      if (!store.people || store.people.length === 0) return;

      const storeCell = ws.getCell(currentRow, 1);
      storeCell.value = store.name;
      storeCell.fill = solid(STORE_BANNER);
      storeCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: BLACK } };
      storeCell.alignment = { horizontal: 'center', vertical: 'middle' };
      storeCell.border = thinBorder;

      for (let c = 2; c <= 9; c++) {
        const blankCell = ws.getCell(currentRow, c);
        blankCell.fill = solid(STORE_ROW_TINT);
        blankCell.border = thinBorder;
      }
      ws.getRow(currentRow).height = 22;
      currentRow += 1;

      store.people.forEach(person => {
        const personFill = toArgb(person.color);

        const personCell = ws.getCell(currentRow, 1);
        personCell.value = person.name;
        personCell.fill = solid(personFill);
        personCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: BLACK } };
        personCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        personCell.border = thinBorder;

        let totalHours = 0;

        DAYS.forEach((day, idx) => {
          const col = 2 + idx;
          const sched = week.scheduleSnapshot?.[store.id]?.[person.id]?.[day] || DEFAULT_SHIFT;
          totalHours += getShiftHours(sched);

          const style = getCellStyleByType(sched.type, person.color);
          const cell = ws.getCell(currentRow, col);
          cell.value = excelCellShiftText(sched);
          cell.fill = solid(style.fill);
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: style.fontColor } };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = thinBorder;
        });

        const totalCell = ws.getCell(currentRow, 9);
        totalCell.value = totalHours;
        totalCell.fill = solid(personFill);
        totalCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BLACK } };
        totalCell.alignment = { horizontal: 'center', vertical: 'middle' };
        totalCell.border = thinBorder;

        ws.getRow(currentRow).height = 30;
        currentRow += 1;
      });
    });

    ws.getColumn(1).width = 28;
    for (let c = 2; c <= 8; c++) {
      ws.getColumn(c).width = 23;
    }
    ws.getColumn(9).width = 14;
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const fileNameLabel = (batchToExport[0]?.label || currentLabel || 'SEMANA').replace(/ /g, '_');
  const suggestedName = `Horario_${fileNameLabel}.xlsx`;

  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'Archivo de Excel (.xlsx)',
            accept: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
            }
          }
        ]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err) {
      if (err?.name === 'AbortError') return false;
      throw err;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}