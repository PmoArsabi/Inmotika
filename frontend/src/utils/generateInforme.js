import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from './supabase';
import { fetchInformeData } from '../api/informeApi';
import InformePDFTemplate from '../components/visits/InformePDFTemplate';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Tiempo de espera para que las imágenes carguen antes de capturar el canvas. */
const IMG_LOAD_TIMEOUT_MS = 8000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Renderiza un componente React en un div offscreen, espera a que carguen las
 * imágenes y devuelve el elemento montado.
 *
 * @param {import('../hooks/useInformeVisita').InformeVisita} informe
 * @returns {Promise<{ container: HTMLElement, cleanup: () => void }>}
 */
async function renderOffscreen(informe) {
  const container = document.createElement('div');
  // visibility:hidden mantiene el elemento en el flujo de render (necesario en mobile)
  // overflow:hidden evita scrollbars o desplazamientos visuales
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 794px;
    background: #ffffff;
    visibility: hidden;
    overflow: hidden;
    pointer-events: none;
    z-index: -9999;
  `;
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(createElement(InformePDFTemplate, { informe }));

  // Esperar suficiente para que React y fuentes terminen el render
  await new Promise(r => setTimeout(r, 600));

  // Esperar a que carguen todas las imágenes (con timeout de seguridad)
  const imgs = Array.from(container.querySelectorAll('img'));
  if (imgs.length > 0) {
    const imagePromises = imgs.map(img =>
      new Promise(resolve => {
        if (img.complete) return resolve();
        img.onload = resolve;
        img.onerror = resolve; // no bloquear si falla una imagen
        setTimeout(resolve, IMG_LOAD_TIMEOUT_MS);
      })
    );
    await Promise.all(imagePromises);
  }

  const cleanup = () => {
    root.unmount();
    document.body.removeChild(container);
  };

  return { container, cleanup };
}

/**
 * Convierte un elemento HTML en un PDF multi-página y devuelve el Blob.
 * Usa html2canvas para capturar el HTML como imagen y jsPDF para construir el PDF.
 *
 * @param {HTMLElement} element
 * @returns {Promise<Blob>}
 */
async function elementToPdfBlob(element) {
  const canvas = await html2canvas(element, {
    scale: 2,             // 2x para mayor calidad de texto
    useCORS: true,        // necesario para imágenes de Supabase Storage
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 10000,
  });

  const A4_WIDTH_MM  = 210;
  const A4_HEIGHT_MM = 297;

  const canvasWidth  = canvas.width;
  const canvasHeight = canvas.height;

  const imgWidthMM = A4_WIDTH_MM;

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const pageHeightPx = (A4_HEIGHT_MM / A4_WIDTH_MM) * canvasWidth;
  let offsetY = 0;

  while (offsetY < canvasHeight) {
    if (offsetY > 0) pdf.addPage();

    // Crear un canvas temporal con solo el trozo de esta página
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width  = canvasWidth;
    pageCanvas.height = Math.min(pageHeightPx, canvasHeight - offsetY);

    const ctx = pageCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, -offsetY);

    const pageImgData = pageCanvas.toDataURL('image/png', 0.92);
    const pageHeightMM = (pageCanvas.height / canvasWidth) * imgWidthMM;

    pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidthMM, pageHeightMM);

    offsetY += pageHeightPx;
  }

  return pdf.output('blob');
}

/**
 * Sube el PDF al bucket privado `inmotika` y crea un token de descarga en BD.
 * Devuelve la URL del proxy (`download-informe` Edge Function) con el token.
 *
 * Modelo de seguridad — proxy con token de descarga:
 *   - El PDF se guarda en Storage completamente privado (sin URL pública).
 *   - Se crea un registro en `informe_descarga_token` con un UUID aleatorio.
 *   - El link del email apunta a la Edge Function `download-informe?token={uuid}`.
 *   - La Edge Function valida el token en BD (server-side con service_role)
 *     y sirve el PDF como stream. El cliente nunca ve el path real en Storage.
 *   - Para revocar: `UPDATE informe_descarga_token SET revocado = true WHERE id = {token}`.
 *   - Re-generaciones del informe crean un nuevo token; el anterior queda válido
 *     hasta que se revoque manualmente (para no romper links ya enviados por email).
 *
 * @param {string} visitaId
 * @param {Blob}   pdfBlob
 * @returns {Promise<string>} URL del proxy con token de descarga
 * @throws {Error} Si el upload o la inserción del token fallan
 */
async function uploadInformePDF(visitaId, pdfBlob) {
  const storagePath = `informes/${visitaId}/informe.pdf`;

  // 1. Subir PDF a Storage (bucket privado, sin URL pública)
  const { error: uploadErr } = await supabase.storage
    .from('inmotika')
    .upload(storagePath, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true, // sobrescribe en re-generaciones
    });

  if (uploadErr) throw new Error(`Error al subir informe PDF: ${uploadErr.message}`);

  // 2. Crear token de descarga en BD
  // El token (UUID v4) es generado por PostgreSQL (gen_random_uuid()).
  // La Edge Function lo valida server-side; nunca hay acceso directo al Storage.
  const { data: tokenRow, error: tokenErr } = await supabase
    .from('informe_descarga_token')
    .insert({ visita_id: visitaId, storage_path: storagePath })
    .select('id')
    .single();

  if (tokenErr || !tokenRow) {
    throw new Error(`Error al crear token de descarga: ${tokenErr?.message}`);
  }

  // 3. Construir URL del proxy
  // La Edge Function está en el mismo proyecto de Supabase que el cliente usa.
  const supabaseUrl = supabase.supabaseUrl;
  return `${supabaseUrl}/functions/v1/download-informe?token=${tokenRow.id}`;
}

// ─── Función principal exportada ──────────────────────────────────────────────

/**
 * Orquesta la generación del informe PDF de una visita:
 * 1. Consulta todos los datos de la visita con `fetchInformeData`.
 * 2. Renderiza el template HTML offscreen.
 * 3. Convierte a PDF con html2canvas + jsPDF.
 * 4. Sube el PDF a Storage (privado) y crea un token de descarga en BD.
 * 5. Devuelve la URL del proxy (Edge Function download-informe) y los datos.
 *
 * Diseño extensible: `elementToPdfBlob` puede reemplazarse por una llamada
 * a un Edge Function para generación server-side sin cambiar el resto del pipeline.
 *
 * @param {string} visitaId - UUID de la visita finalizada
 * @returns {Promise<{ pdfUrl: string, informe: import('../hooks/useInformeVisita').InformeVisita }>}
 * @throws {Error} Si cualquier paso del pipeline falla
 */
export async function generateInformeVisita(visitaId) {
  // 1. Datos
  const informe = await fetchInformeData(visitaId);

  // 2. Render offscreen
  const { container, cleanup } = await renderOffscreen(informe);

  let pdfBlob;
  try {
    // 3. Captura + PDF
    pdfBlob = await elementToPdfBlob(container);
  } finally {
    cleanup(); // siempre limpiar el DOM, incluso si hay error
  }

  // 4. Storage
  const pdfUrl = await uploadInformePDF(visitaId, pdfBlob);

  return { pdfUrl, informe };
}
