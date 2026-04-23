import { supabase } from './supabase';
import { fetchInformeData } from '../api/informeApi';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Duración de la signed URL del PDF en segundos (7 días). */
const SIGNED_URL_EXPIRES_IN = 60 * 60 * 24 * 7;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convierte un elemento HTML ya renderizado en el DOM en un PDF multi-página.
 * Usa html2canvas para capturar el elemento y jsPDF para construir el PDF.
 *
 * El elemento DEBE estar visible en el DOM (no hidden, no fuera del viewport
 * con position:fixed) para que html2canvas lo capture correctamente.
 *
 * @param {HTMLElement} element - Elemento ya renderizado y visible en el DOM
 * @returns {Promise<Blob>}
 */
/**
 * Convierte un elemento HTML ya renderizado en el DOM en un PDF multi-página.
 * Usa html-to-image (soporta oklch/Tailwind 4) + jsPDF.
 *
 * @param {HTMLElement} element
 * @returns {Promise<Blob>}
 */
async function elementToPdfBlob(element) {
  const { toCanvas } = await import('html-to-image');
  const { default: jsPDF } = await import('jspdf');

  const A4_WIDTH_MM  = 210;
  const A4_HEIGHT_MM = 297;

  // Capturar el elemento completo a su altura real (scrollHeight)
  const canvas = await toCanvas(element, {
    pixelRatio: 1.5,
    backgroundColor: '#ffffff',
    skipFonts: false,
    // Incluir imágenes cross-origin (Supabase Storage)
    fetchRequestInit: { mode: 'cors' },
  });

  const canvasWidth  = canvas.width;
  const canvasHeight = canvas.height;

  // Márgenes del PDF en mm — dan separación visual entre páginas
  const MARGIN_MM = 10;
  const CONTENT_WIDTH_MM  = A4_WIDTH_MM  - MARGIN_MM * 2;
  const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - MARGIN_MM * 2;

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  // Altura en px del área útil de cada página (descontando márgenes)
  const pageHeightPx = (CONTENT_HEIGHT_MM / CONTENT_WIDTH_MM) * canvasWidth;
  let offsetY = 0;

  while (offsetY < canvasHeight) {
    if (offsetY > 0) pdf.addPage();

    const sliceHeight = Math.min(pageHeightPx, canvasHeight - offsetY);

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width  = canvasWidth;
    pageCanvas.height = sliceHeight;

    const ctx = pageCanvas.getContext('2d');
    // Fondo blanco para evitar transparencias en jpeg
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, sliceHeight);
    ctx.drawImage(canvas, 0, -offsetY);

    const pageImgData  = pageCanvas.toDataURL('image/jpeg', 0.88);
    const pageHeightMM = (sliceHeight / canvasWidth) * CONTENT_WIDTH_MM;

    // Colocar imagen con márgenes: MARGIN_MM desde arriba y desde la izquierda
    pdf.addImage(pageImgData, 'JPEG', MARGIN_MM, MARGIN_MM, CONTENT_WIDTH_MM, pageHeightMM);

    offsetY += pageHeightPx;
  }

  return pdf.output('blob');
}

/**
 * Sube el PDF al bucket privado `inmotika` y retorna una signed URL de 7 días.
 *
 * @param {string} visitaId
 * @param {Blob}   pdfBlob
 * @returns {Promise<string>} Signed URL válida por 7 días
 * @throws {Error} Si el upload o la generación de signed URL fallan
 */
async function uploadInformePDF(visitaId, pdfBlob) {
  const storagePath = `informes/${visitaId}/informe.pdf`;

  const { error: uploadErr } = await supabase.storage
    .from('inmotika')
    .upload(storagePath, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadErr) throw new Error(`Error al subir informe PDF: ${uploadErr.message}`);

  const { data: signedData, error: signErr } = await supabase.storage
    .from('inmotika')
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRES_IN);

  if (signErr || !signedData?.signedUrl) {
    throw new Error(`Error al generar URL del informe: ${signErr?.message}`);
  }

  return signedData.signedUrl;
}

// ─── Función principal exportada ──────────────────────────────────────────────

/**
 * Captura el elemento HTML del template ya renderizado en el DOM,
 * lo convierte a PDF y lo sube a Storage.
 *
 * Recibe el elemento DOM directamente para evitar problemas de renderizado
 * offscreen (html2canvas no puede capturar elementos fuera del viewport).
 *
 * @param {string}      visitaId    - UUID de la visita
 * @param {HTMLElement} templateEl  - Elemento DOM del InformePDFTemplate ya renderizado
 * @returns {Promise<{ pdfUrl: string }>}
 * @throws {Error} Si la captura, conversión o upload fallan
 */
export async function generateInformeFromElement(visitaId, templateEl) {
  if (!templateEl) throw new Error('El elemento del template no está disponible');

  const pdfBlob = await elementToPdfBlob(templateEl);
  const pdfUrl  = await uploadInformePDF(visitaId, pdfBlob);

  return { pdfUrl };
}

/**
 * Versión legacy que obtiene datos y renderiza offscreen.
 * Mantener solo si se necesita generar PDF sin tener el DOM disponible.
 * Para el flujo normal de aprobación, usar `generateInformeFromElement`.
 *
 * @param {string}        visitaId
 * @param {string[]|null} aprobadosIds
 * @returns {Promise<{ pdfUrl: string, informe: object }>}
 */
export async function generateInformeVisita(visitaId, aprobadosIds = null) {
  const informe = await fetchInformeData(visitaId, aprobadosIds);
  return { pdfUrl: null, informe };
}
