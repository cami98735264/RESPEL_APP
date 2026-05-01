import ExcelJS from 'exceljs';
import type {
  EntryDetailReportRow,
  ExitDetailReportRow,
  ReportPeriod,
} from '@shared/types';

const ENTRY_COLUMNS = [
  { header: 'ID', key: 'entry_id', width: 8 },
  { header: 'Fecha', key: 'recorded_at', width: 22 },
  { header: 'Dia', key: 'report_day', width: 12 },
  { header: 'Mes', key: 'report_month', width: 10 },
  { header: 'Trimestre', key: 'report_quarter', width: 10 },
  { header: 'Anio', key: 'report_year', width: 8 },
  { header: 'NIT', key: 'generator_nit', width: 14 },
  { header: 'Generador', key: 'generator_name', width: 30 },
  { header: 'Categoria', key: 'category_code', width: 10 },
  { header: 'Residuo', key: 'waste_name', width: 30 },
  { header: 'Hazard', key: 'hazard_code', width: 8 },
  { header: 'Caracteristica', key: 'hazard_name', width: 16 },
  { header: 'Peso (kg)', key: 'weight_kg', width: 12 },
  { header: 'Sensor', key: 'sensor_reading_ref', width: 18 },
  { header: 'Origen', key: 'source_description', width: 24 },
];

const EXIT_COLUMNS = [
  { header: 'ID', key: 'exit_id', width: 8 },
  { header: 'Fecha despacho', key: 'dispatched_at', width: 22 },
  { header: 'Dia', key: 'report_day', width: 12 },
  { header: 'Mes', key: 'report_month', width: 10 },
  { header: 'Trimestre', key: 'report_quarter', width: 10 },
  { header: 'Anio', key: 'report_year', width: 8 },
  { header: 'NIT', key: 'generator_nit', width: 14 },
  { header: 'Generador', key: 'generator_name', width: 30 },
  { header: 'Residuo', key: 'waste_name', width: 30 },
  { header: 'Hazard', key: 'hazard_code', width: 8 },
  { header: 'Caracteristica', key: 'hazard_name', width: 16 },
  { header: 'Peso (kg)', key: 'weight_kg', width: 12 },
  { header: 'Gestor', key: 'receptor_name', width: 30 },
  { header: 'Licencia', key: 'receptor_license', width: 18 },
  { header: 'Manifiesto', key: 'manifesto_number', width: 18 },
  { header: 'Metodo', key: 'disposal_method', width: 22 },
  { header: 'Certificado', key: 'receptor_certificate_ref', width: 18 },
];

function styleHeader(sheet: ExcelJS.Worksheet) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF134E4A' },
  };
  header.alignment = { vertical: 'middle', horizontal: 'left' };
}

function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildFilename(args: {
  type: 'entries' | 'exits';
  period: ReportPeriod;
  year: number;
  month?: number;
  day?: number;
  quarter?: number;
  half?: number;
}): string {
  const base = `respel-${args.type}-${args.period}-${args.year}`;
  switch (args.period) {
    case 'daily': {
      const m = String(args.month ?? 1).padStart(2, '0');
      const d = String(args.day ?? 1).padStart(2, '0');
      return `${base}-${m}-${d}.xlsx`;
    }
    case 'quarterly':
      return `${base}-q${args.quarter}.xlsx`;
    case 'semiannual':
      return `${base}-h${args.half}.xlsx`;
    case 'annual':
      return `${base}.xlsx`;
  }
}

export async function exportEntriesXlsx(
  rows: EntryDetailReportRow[],
  filename: string,
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'RESPEL';
  const sheet = wb.addWorksheet('Entradas');
  sheet.columns = ENTRY_COLUMNS;
  rows.forEach((row) => sheet.addRow(row));
  styleHeader(sheet);
  const buffer = await wb.xlsx.writeBuffer();
  downloadBuffer(buffer as ArrayBuffer, filename);
}

export async function exportExitsXlsx(
  rows: ExitDetailReportRow[],
  filename: string,
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'RESPEL';
  const sheet = wb.addWorksheet('Salidas');
  sheet.columns = EXIT_COLUMNS;
  rows.forEach((row) => sheet.addRow(row));
  styleHeader(sheet);
  const buffer = await wb.xlsx.writeBuffer();
  downloadBuffer(buffer as ArrayBuffer, filename);
}
