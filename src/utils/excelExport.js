import ExcelJS from 'exceljs';
import { DAYS, HOURS, getShiftHours, getShiftDetails } from './constants';

const RED = 'FFFF0000';
const PURPLE = 'FF7030A0';
const BLACK = 'FF000000';
const WHITE = 'FFFFFFFF';
const ROW_HEIGHT = 24;
const FIRST_COL_WIDTH = 16;
const COL_WIDTH = 5.2;
const GAP_ROWS = 3;
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

function getRange(sched) {
  const last = HOURS.length - 1;
  if (sched.type === 'descansa') return [0, last];
  const details = sched.type === 'personalizado' ? sched : getShiftDetails(sched.type);
  const start = Math.max(0, details.start);
  const end = Math.min(last, Math.max(start, details.end));
  return [start, end];
}

export async function generateExcel(batch, currentLabel, currentStores, currentSchedule) {
  const wb = new ExcelJS.Workbook();
  const batchToExport = batch.length > 0 ? batch : [{
    label: currentLabel || 'SEMANA',
    storesSnapshot: currentStores,
    scheduleSnapshot: currentSchedule
  }];

  batchToExport.forEach(week => {
    const ws = wb.addWorksheet(uniqueSheetName(wb, week.label), {
      properties: { defaultRowHeight: ROW_HEIGHT },
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });

    let cursorRow = 1;
    let globalMaxCol = 10;

    week.storesSnapshot.forEach(store => {
      const numPeople = store.people.length;
      if (numPeople === 0) return;

      const r0 = cursorRow;
      const lastCol = 1 + 7 * (numPeople + 1);
      if (lastCol > globalMaxCol) globalMaxCol = lastCol;

      const dayHeaderRow = r0 + 1;
      const hourStartRow = r0 + 2;
      const progRow = hourStartRow + HOURS.length;

      ws.mergeCells(r0, 1, r0, lastCol);
      const titleCell = ws.getCell(r0, 1);
      titleCell.value = store.title;
      titleCell.fill = solid(RED);
      titleCell.font = { bold: true, color: { argb: WHITE }, size: 14, name: 'Calibri' };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.border = thinBorder;

      for (let r = dayHeaderRow; r <= progRow; r++) {
        for (let c = 1; c <= lastCol; c++) {
          ws.getCell(r, c).border = thinBorder;
        }
      }

      const cornerCell = ws.getCell(dayHeaderRow, 1);
      cornerCell.fill = solid(RED);

      DAYS.forEach((day, di) => {
        const startCol = 2 + di * (numPeople + 1);
        const endCol = startCol + numPeople - 1;
        const sepCol = endCol + 1;

        if (numPeople > 1) ws.mergeCells(dayHeaderRow, startCol, dayHeaderRow, endCol);
        const dayCell = ws.getCell(dayHeaderRow, startCol);
        dayCell.value = day;
        dayCell.fill = solid(RED);
        dayCell.font = { bold: true, color: { argb: WHITE }, size: 12, name: 'Calibri' };
        dayCell.alignment = { horizontal: 'center', vertical: 'middle' };

        for (let row = dayHeaderRow; row <= progRow; row++) {
          ws.getCell(row, sepCol).fill = solid(BLACK);
        }

        store.people.forEach((person, pi) => {
          const col = startCol + pi;
          const sched = week.scheduleSnapshot?.[store.id]?.[person.id]?.[day] || DEFAULT_SHIFT;
          const hoursWorked = getShiftHours(sched);
          const [from, to] = getRange(sched);
          const range = [hourStartRow + from, hourStartRow + to];

          let text = person.name;
          if (sched.type === 'descansa') text = `${person.name} DESCANSA`;
          else if (sched.type === 'completo') text = `${person.name} TODO EL DIA`;

          if (range[0] !== range[1]) ws.mergeCells(range[0], col, range[1], col);

          const cell = ws.getCell(range[0], col);
          cell.value = text;
          cell.fill = solid(toArgb(person.color));
          cell.font = { size: 10, name: 'Calibri', bold: true, color: { argb: BLACK } };
          cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90, shrinkToFit: true };

          const hp = ws.getCell(progRow, col);
          hp.value = hoursWorked;
          hp.fill = solid(PURPLE);
          hp.font = { size: 10, bold: true, color: { argb: WHITE } };
          hp.alignment = { horizontal: 'center', vertical: 'middle' };
        });
      });

      for (let i = 0; i < HOURS.length; i++) {
        const hc = ws.getCell(hourStartRow + i, 1);
        hc.value = HOURS[i];
        hc.alignment = { horizontal: 'center', vertical: 'middle' };
        hc.font = { name: 'Calibri', size: 10, bold: true, color: { argb: BLACK } };
      }

      const hpLabel = ws.getCell(progRow, 1);
      hpLabel.value = 'HORAS PROG';
      hpLabel.fill = solid(PURPLE);
      hpLabel.font = { bold: true, size: 10, color: { argb: WHITE } };
      hpLabel.alignment = { horizontal: 'center', vertical: 'middle' };

      const sumHeaderRow = progRow + 3;

      for (let r = sumHeaderRow; r <= sumHeaderRow + numPeople; r++) {
        for (let c = 1; c <= 10; c++) {
          ws.getCell(r, c).border = thinBorder;
        }
      }

      const personalHeader = ws.getCell(sumHeaderRow, 1);
      personalHeader.value = 'PERSONAL';
      personalHeader.font = { bold: true, size: 10, color: { argb: BLACK } };
      personalHeader.alignment = { horizontal: 'center', vertical: 'middle' };

      ws.mergeCells(sumHeaderRow, 8, sumHeaderRow, 10);
      const headerHoras = ws.getCell(sumHeaderRow, 8);
      headerHoras.value = 'HORAS PROG.';
      headerHoras.font = { bold: true, size: 10, color: { argb: BLACK } };
      headerHoras.alignment = { horizontal: 'center', vertical: 'middle' };

      store.people.forEach((person, pi) => {
        const r = sumHeaderRow + 1 + pi;
        const argbColor = toArgb(person.color);

        const nameCell = ws.getCell(r, 1);
        nameCell.value = person.name;
        nameCell.fill = solid(argbColor);
        nameCell.font = { bold: true, size: 10, color: { argb: BLACK } };
        nameCell.alignment = { horizontal: 'center', vertical: 'middle', shrinkToFit: true };

        for (let c = 2; c <= 7; c++) {
          ws.getCell(r, c).fill = solid(argbColor);
        }

        let totalHours = 0;
        DAYS.forEach(day => {
          totalHours += getShiftHours(week.scheduleSnapshot?.[store.id]?.[person.id]?.[day] || DEFAULT_SHIFT);
        });

        ws.mergeCells(r, 8, r, 10);
        const totalCell = ws.getCell(r, 8);
        totalCell.value = totalHours;
        totalCell.fill = solid(argbColor);
        totalCell.font = { bold: true, size: 10, color: { argb: BLACK } };
        totalCell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      cursorRow = sumHeaderRow + numPeople + GAP_ROWS;
    });

    ws.getColumn(1).width = FIRST_COL_WIDTH;
    for (let c = 2; c <= globalMaxCol; c++) {
      ws.getColumn(c).width = COL_WIDTH;
    }

    for (let r = 1; r <= cursorRow; r++) {
      ws.getRow(r).height = ROW_HEIGHT;
    }
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Horario_${currentLabel.replace(/ /g, '_')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}