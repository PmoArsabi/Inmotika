import { supabase, invokeFunction } from './supabase';

/**
 * Obtiene una URL temporal del PDF del informe vía token (download-informe).
 * El Storage de informes/ es privado; los clientes no pueden createSignedUrl.
 *
 * @param {string} visitaId
 * @returns {Promise<string>}
 */
export async function getInformeDownloadUrl(visitaId) {
  if (!visitaId) throw new Error('Visita no disponible');

  const { data, error } = await invokeFunction('request-informe-download', {
    body: { visita_id: visitaId },
  });

  if (error || data?.error || !data?.url) {
    let detail = data?.error || error?.message || 'No se pudo obtener el informe';
    try {
      const ctx = error?.context;
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json();
        if (body?.error) detail = body.error;
      }
    } catch { /* ignore */ }
    throw new Error(detail);
  }

  return data.url;
}

/**
 * Abre o descarga el PDF del informe aprobado de una visita.
 *
 * @param {string} visitaId
 * @param {'view'|'download'} [mode='view']
 */
export async function openInformePdf(visitaId, mode = 'view') {
  const url = await getInformeDownloadUrl(visitaId);

  if (mode === 'download') {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'informe.pdf';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }

  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    // Fallback si el navegador bloquea popups
    window.location.assign(url);
  }
}

/**
 * Fallback legacy: signed URL directa (solo funciona para staff con policy de Storage).
 * @param {string} storagePath
 * @param {'view'|'download'} [mode='view']
 * @deprecated Preferir openInformePdf(visitaId)
 */
export async function openInformeByStoragePath(storagePath, mode = 'view') {
  if (!storagePath) throw new Error('Ruta de informe no disponible');
  const { data, error } = await supabase.storage.from('inmotika').createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'No se pudo generar el enlace del informe');
  }
  if (mode === 'download') {
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = 'informe.pdf';
    a.click();
  } else {
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }
}
