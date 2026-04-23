import { supabase } from './supabase';
import { fetchInformeData } from '../api/informeApi';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Duración de la signed URL del PDF en segundos (7 días). */
const SIGNED_URL_EXPIRES_IN = 60 * 60 * 24 * 7;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Renderiza el documento react-pdf a Blob.
 * Las firmas se reciben como signed URLs ya resueltas.
 *
 * @param {import('../api/informeApi').InformeVisita} informe
 * @param {{ firmaCoordinadorUrl?: string|null, firmaDirectorUrl?: string|null }} firmas
 * @returns {Promise<Blob>}
 */
async function informeToPdfBlob(informe, firmas = {}) {
  const { pdf } = await import('@react-pdf/renderer');
  const { default: InformePDFDocument } = await import('../components/visits/InformePDFDocument');
  const { createElement } = await import('react');

  const element = createElement(InformePDFDocument, {
    informe,
    firmaCoordinadorUrl: firmas.firmaCoordinadorUrl ?? null,
    firmaDirectorUrl:    firmas.firmaDirectorUrl    ?? null,
  });

  return pdf(element).toBlob();
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
 * Genera el PDF del informe con react-pdf (texto real, saltos de página correctos)
 * y lo sube a Storage.
 *
 * @param {string} visitaId
 * @param {import('../api/informeApi').InformeVisita} informe  - Datos ya cargados (con obs coordinador/director)
 * @param {{ firmaCoordinadorUrl?: string|null, firmaDirectorUrl?: string|null }} firmas
 * @returns {Promise<{ pdfUrl: string }>}
 */
export async function generateInformeFromData(visitaId, informe, firmas = {}) {
  const pdfBlob = await informeToPdfBlob(informe, firmas);
  const pdfUrl  = await uploadInformePDF(visitaId, pdfBlob);
  return { pdfUrl };
}

/**
 * Legacy: captura DOM del template ya renderizado.
 * Mantenida por compatibilidad — no usar en flujos nuevos.
 *
 * @deprecated Usar generateInformeFromData
 * @param {string}      visitaId
 * @param {HTMLElement} templateEl
 * @returns {Promise<{ pdfUrl: string }>}
 */
export async function generateInformeFromElement(visitaId, templateEl) {
  if (!templateEl) throw new Error('El elemento del template no está disponible');

  const { toCanvas } = await import('html-to-image');
  const { default: jsPDF } = await import('jspdf');

  const A4_WIDTH_MM  = 210;
  const A4_HEIGHT_MM = 297;
  const MARGIN_MM    = 10;
  const CONTENT_WIDTH_MM  = A4_WIDTH_MM  - MARGIN_MM * 2;
  const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - MARGIN_MM * 2;

  const canvas = await toCanvas(templateEl, {
    pixelRatio: 1.5,
    backgroundColor: '#ffffff',
    skipFonts: false,
    fetchRequestInit: { mode: 'cors' },
  });

  const canvasWidth  = canvas.width;
  const canvasHeight = canvas.height;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageHeightPx = (CONTENT_HEIGHT_MM / CONTENT_WIDTH_MM) * canvasWidth;
  let offsetY = 0;

  while (offsetY < canvasHeight) {
    if (offsetY > 0) pdf.addPage();
    const sliceHeight = Math.min(pageHeightPx, canvasHeight - offsetY);
    const pageCanvas  = document.createElement('canvas');
    pageCanvas.width  = canvasWidth;
    pageCanvas.height = sliceHeight;
    const ctx = pageCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, sliceHeight);
    ctx.drawImage(canvas, 0, -offsetY);
    const pageImgData  = pageCanvas.toDataURL('image/jpeg', 0.88);
    const pageHeightMM = (sliceHeight / canvasWidth) * CONTENT_WIDTH_MM;
    pdf.addImage(pageImgData, 'JPEG', MARGIN_MM, MARGIN_MM, CONTENT_WIDTH_MM, pageHeightMM);
    offsetY += pageHeightPx;
  }

  const pdfBlob = pdf.output('blob');
  const pdfUrl  = await uploadInformePDF(visitaId, pdfBlob);
  return { pdfUrl };
}

/**
 * @deprecated
 * @param {string} visitaId
 * @returns {Promise<{ pdfUrl: null, informe: import('../api/informeApi').InformeVisita }>}
 */
export async function generateInformeVisita(visitaId) {
  const informe = await fetchInformeData(visitaId);
  return { pdfUrl: null, informe };
}
