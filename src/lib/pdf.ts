import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from 'pdf-lib';

import type { Compra, ItemTransaccional, Transaccion, Venta } from './schemas';

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const PAGE_WIDTH = 595.28; // A4 in points
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 40;
const LINE_HEIGHT = 18;

interface PdfWriter {
  doc: PDFDocument;
  page: PDFPage;
  regularFont: PDFFont;
  boldFont: PDFFont;
  cursorY: number;
}

interface TextOptions {
  font?: PDFFont;
  size?: number;
  color?: ReturnType<typeof rgb>;
}

function formatCurrency(value: number) {
  return CURRENCY_FORMATTER.format(value);
}

function normalizeDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
    try {
      const maybeDate = (value as { toDate: () => Date }).toDate();
      return maybeDate instanceof Date ? maybeDate : null;
    } catch (error) {
      console.error('No se pudo convertir el Timestamp de Firestore:', error);
      return null;
    }
  }

  return null;
}

function formatDateTime(value: unknown) {
  const date = normalizeDate(value);
  return date ? format(date, "dd 'de' MMMM yyyy - HH:mm", { locale: es }) : 'Sin fecha registrada';
}

async function createWriter(): Promise<PdfWriter> {
  const doc = await PDFDocument.create();
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  return {
    doc,
    page,
    regularFont,
    boldFont,
    cursorY: PAGE_HEIGHT - 60,
  };
}

function ensureSpace(writer: PdfWriter, needed = LINE_HEIGHT) {
  if (writer.cursorY - needed <= 40) {
    writer.page = writer.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    writer.cursorY = PAGE_HEIGHT - 60;
  }
}

function writeLine(writer: PdfWriter, text: string, options?: TextOptions) {
  ensureSpace(writer);
  writer.page.drawText(text, {
    x: PAGE_MARGIN,
    y: writer.cursorY,
    font: options?.font ?? writer.regularFont,
    size: options?.size ?? 12,
    color: options?.color ?? rgb(0.1, 0.1, 0.1),
  });
  writer.cursorY -= LINE_HEIGHT;
}

function writeSpacer(writer: PdfWriter, size = LINE_HEIGHT / 2) {
  ensureSpace(writer, size);
  writer.cursorY -= size;
}

function writeItemsList(writer: PdfWriter, items: ItemTransaccional[]) {
  if (!items.length) {
    writeLine(writer, 'Sin ítems registrados.');
    return;
  }

  items.forEach((item) => {
    const line = `${item.nombre} · ${item.cantidad} x ${formatCurrency(item.precioUnitario)} = ${formatCurrency(item.subtotal)}`;
    writeLine(writer, line, { size: 11 });
  });
}

async function exportPdf(doc: PDFDocument) {
  const bytes = await doc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

interface KeyValueRow {
  label: string;
  value: string | number | null | undefined;
}

interface MovimientoPdfConfig {
  titulo: string;
  subtitulo: string;
  transaccion: Transaccion;
  metadatos?: KeyValueRow[];
  contraparte?: {
    titulo: string;
    campos: KeyValueRow[];
  };
  items?: ItemTransaccional[];
  itemsTitulo?: string;
  resumen?: KeyValueRow[];
  notas?: string[];
}

function writeKeyValueRows(writer: PdfWriter, rows: KeyValueRow[]) {
  rows.forEach(({ label, value }) => {
    const printableValue = value === undefined || value === null || value === '' ? '—' : String(value);
    writeLine(writer, `${label}: ${printableValue}`);
  });
}

function writeSection(writer: PdfWriter, titulo: string, content: () => void) {
  writeLine(writer, titulo, { font: writer.boldFont, size: 13 });
  content();
  writeSpacer(writer);
}

async function generarMovimientoPdf(config: MovimientoPdfConfig) {
  const writer = await createWriter();
  writeLine(writer, config.titulo, { font: writer.boldFont, size: 18 });
  writeLine(writer, `${config.subtitulo} #${config.transaccion.id}`, { font: writer.boldFont, size: 12 });
  writeLine(writer, `Fecha: ${formatDateTime(config.transaccion.fecha)}`);
  if (config.transaccion.concepto) {
    writeLine(writer, `Concepto: ${config.transaccion.concepto}`);
  }
  writeSpacer(writer);

  if (config.metadatos?.length) {
    writeSection(writer, 'Resumen del movimiento', () => {
      writeKeyValueRows(writer, config.metadatos ?? []);
    });
  }

  if (config.contraparte) {
    writeSection(writer, config.contraparte.titulo, () => {
      writeKeyValueRows(writer, config.contraparte?.campos ?? []);
    });
  }

  if (config.items) {
    writeSection(writer, config.itemsTitulo ?? 'Detalle de ítems', () => {
      writeItemsList(writer, config.items ?? []);
    });
  }

  if (config.resumen?.length) {
    writeSection(writer, 'Totales y valores', () => {
      writeKeyValueRows(writer, config.resumen ?? []);
    });
  }

  (config.notas ?? ['Comprobante generado automáticamente por SCM Huevos Kikes.']).forEach((nota) => {
    writeLine(writer, nota, { size: 11 });
  });

  return exportPdf(writer.doc);
}

export function generarFacturaVentaPdf({
  transaccion,
  venta,
}: {
  transaccion: Transaccion;
  venta: Venta;
}) {
  return generarMovimientoPdf({
    titulo: 'Huevos Kikes - Movimiento de Ingreso',
    subtitulo: 'Factura de venta',
    transaccion,
    metadatos: [
      { label: 'Tipo', value: 'Ingreso' },
      { label: 'Total registrado', value: formatCurrency(transaccion.monto) },
    ],
    contraparte: {
      titulo: 'Datos del cliente',
      campos: [
        { label: 'Cliente', value: venta.clienteNombre },
        { label: 'Cédula', value: venta.clienteCedula },
        { label: 'Vendedor', value: venta.vendedorEmail ?? 'No registrado' },
      ],
    },
    itemsTitulo: 'Detalle de la venta',
    items: venta.items,
    resumen: [
      { label: 'Total facturado', value: formatCurrency(venta.total) },
      { label: 'Saldo registrado', value: formatCurrency(transaccion.monto) },
    ],
    notas: ['Gracias por su compra.', 'Comprobante generado automáticamente por SCM Huevos Kikes.'],
  });
}

export function generarComprobanteCompraPdf({
  transaccion,
  compra,
}: {
  transaccion: Transaccion;
  compra: Compra;
}) {
  return generarMovimientoPdf({
    titulo: 'Huevos Kikes - Movimiento de Egreso',
    subtitulo: 'Comprobante de egreso',
    transaccion,
    metadatos: [
      { label: 'Tipo', value: 'Egreso' },
      { label: 'Medio de pago', value: compra.medioDePago },
    ],
    contraparte: {
      titulo: 'Datos del proveedor',
      campos: [
        { label: 'Proveedor', value: compra.proveedorNombre },
        { label: 'NIT', value: compra.proveedorNit },
      ],
    },
    itemsTitulo: 'Detalle de la compra',
    items: compra.items,
    resumen: [
      { label: 'Total egresado', value: formatCurrency(compra.total) },
      { label: 'Saldo registrado', value: formatCurrency(transaccion.monto) },
    ],
  });
}
