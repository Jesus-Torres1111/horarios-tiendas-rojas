import ExcelJS from 'exceljs';
import { DAYS, HOURS, getShiftHours } from './constants';

const PROGRAMMED_HOURS_ARGB = 'FF7030A0';
const ROW_GAP_BETWEEN_STORES = 3;

export async function generateExcel(batch, currentLabel, currentStores, currentSchedule) {
  const wb = new ExcelJS.Workbook();
  const batchToExport = batch.length > 0 ? batch : [{
    label: currentLabel || 'SEMANA',
    storesSnapshot: currentStores,
    scheduleSnapshot: currentSchedule
  }];

  batchToExport.forEach(week => {
    const ws = wb.addWorksheet(week.label.substring(0, 31));
    const borderStyle = { style: 'thin', color: { argb: 'FF000000' } };
    const thinBorder = { top: borderStyle, left: borderStyle, bottom: borderStyle, right: borderStyle };

    let cursorRow = 1;
    let globalMaxCol = 10;
    const separatorColumns = new Set();

    week.storesSnapshot.forEach(store => {
      const numPeople = store.people.length;
      if (numPeople === 0) return;

      const r0 = cursorRow;
      const lastCol = 1 + (7 * numPeople) + 7;
      if (lastCol > globalMaxCol) globalMaxCol = lastCol;

      DAYS.forEach((day, di) => {
        const startCol = 2 + (di * numPeople) + di;
        const endCol = startCol + numPeople - 1;
        separatorColumns.add(endCol + 1); 
      });

      ws.mergeCells(r0, 1, r0, lastCol);
      const titleCell = ws.getCell(r0, 1);
      titleCell.value = store.title;
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
      titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14, name: 'Calibri' };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.border = thinBorder;
      ws.getRow(r0).height = 25;

      const dayHeaderRow = r0 + 1;
      const hourStartRow = r0 + 2;
      const progRow = hourStartRow + HOURS.length;

      for (let r = dayHeaderRow; r <= progRow; r++) {
        for (let c = 1; c <= lastCol; c++) {
          ws.getCell(r, c).border = thinBorder;
        }
      }

      DAYS.forEach((day, di) => {
        const startCol = 2 + (di * numPeople) + di;
        const endCol = startCol + numPeople - 1;

        ws.mergeCells(dayHeaderRow, startCol, dayHeaderRow, endCol);
        const dayCell = ws.getCell(dayHeaderRow, startCol);
        dayCell.value = day;
        dayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
        dayCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Calibri' };
        dayCell.alignment = { horizontal: 'center', vertical: 'middle' };

        const sepCol = endCol + 1;
        for (let row = dayHeaderRow; row <= progRow; row++) {
          const sepCell = ws.getCell(row, sepCol);
          sepCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
        }

        store.people.forEach((person, pi) => {
          const col = startCol + pi;
          const sched = week.scheduleSnapshot[store.id][person.id][day];
          const hoursWorked = getShiftHours(sched);
          
          let range;
          let text;

          if (sched.type === 'descansa') {
            range = [hourStartRow, hourStartRow + HOURS.length - 1];
            text = `${person.name} DESCANSA`;
          } else if (sched.type === 'completo') {
            range = [hourStartRow, hourStartRow + 12]; 
            text = `${person.name} TODO EL DIA`;
          } else {
            range = [hourStartRow + sched.start, hourStartRow + sched.end];
            text = person.name;
          }

          if (range[0] !== range[1]) ws.mergeCells(range[0], col, range[1], col);
          
          const cell = ws.getCell(range[0], col);
          cell.value = text;
          
          const argbColor = 'FF' + person.color.replace('#', '').toUpperCase();
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbColor } };
          cell.font = { size: 10, name: 'Calibri', bold: true, color: { argb: 'FF000000' } }; 
          cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };

          const hp = ws.getCell(progRow, col);
          hp.value = hoursWorked;
          hp.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PROGRAMMED_HOURS_ARGB } };
          hp.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } }; 
          hp.alignment = { horizontal: 'center', vertical: 'middle' };
        });
      });

      ws.mergeCells(dayHeaderRow, 1, dayHeaderRow, 1);
      for (let i = 0; i < HOURS.length; i++) {
        const hc = ws.getCell(hourStartRow + i, 1);
        hc.value = HOURS[i];
        hc.alignment = { horizontal: 'center', vertical: 'middle' };
        hc.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
        ws.getRow(hourStartRow + i).height = 25;
      }

      const hpLabel = ws.getCell(progRow, 1);
      hpLabel.value = 'HORAS PROG';
      hpLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PROGRAMMED_HOURS_ARGB } };
      hpLabel.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      hpLabel.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(progRow).height = 20;

      const sumHeaderRow = progRow + 3;
      
      for (let r = sumHeaderRow; r <= sumHeaderRow + numPeople; r++) {
        for (let c = 1; c <= 10; c++) {
          ws.getCell(r, c).border = thinBorder;
        }
      }

      ws.getCell(sumHeaderRow, 1).value = 'PERSONAL';
      ws.getCell(sumHeaderRow, 1).font = { bold: true, color: { argb: 'FF000000' } };
      ws.getCell(sumHeaderRow, 1).alignment = { horizontal: 'center', vertical: 'middle' };

      ws.mergeCells(sumHeaderRow, 8, sumHeaderRow, 10);
      const headerHoras = ws.getCell(sumHeaderRow, 8);
      headerHoras.value = 'HORAS\nPROGRA';
      headerHoras.font = { bold: true, color: { argb: 'FF000000' } };
      headerHoras.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      ws.getRow(sumHeaderRow).height = 30;

      store.people.forEach((person, pi) => {
        const r = sumHeaderRow + 1 + pi;
        const argbColor = 'FF' + person.color.replace('#', '').toUpperCase();

        const nameCell = ws.getCell(r, 1);
        nameCell.value = person.name;
        nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbColor } };
        nameCell.font = { bold: true, color: { argb: 'FF000000' } };
        nameCell.alignment = { horizontal: 'center', vertical: 'middle' };

        for (let c = 2; c <= 7; c++) {
          const emptyCell = ws.getCell(r, c);
          emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbColor } };
        }

        let totalHours = 0;
        DAYS.forEach(day => {
          totalHours += getShiftHours(week.scheduleSnapshot[store.id][person.id][day]);
        });

        ws.mergeCells(r, 8, r, 10);
        const totalCell = ws.getCell(r, 8);
        totalCell.value = totalHours;
        totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbColor } };
        totalCell.font = { bold: true, color: { argb: 'FF000000' } };
        totalCell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      cursorRow = sumHeaderRow + numPeople + ROW_GAP_BETWEEN_STORES;
    });

    ws.getColumn(1).width = 15;
    for (let c = 2; c <= globalMaxCol; c++) {
      if (separatorColumns.has(c)) {
        ws.getColumn(c).width = 2.5; 
      } else {
        ws.getColumn(c).width = 4.8; 
      }
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