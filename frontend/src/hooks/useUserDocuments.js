import { useState, useEffect, useCallback } from 'react';
import {
  listDocumentos,
  createDocumento,
  updateDocumento,
  deleteDocumento,
  getDocumentosTecnicosVisita,
} from '../api/usuarioDocumentoApi';

/**
 * Hook para gestionar documentos de un usuario autenticado o de gestión.
 * Carga, crea, actualiza y elimina documentos de `usuario_documento`.
 *
 * @param {string|null} usuarioId
 * @returns {{ documentos, loading, saving, reload, create, update, remove }}
 */
export function useUserDocuments(usuarioId) {
  const [documentos, setDocumentos] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    if (!usuarioId) { setDocumentos([]); return; }
    setLoading(true);
    try {
      setDocumentos(await listDocumentos(usuarioId));
    } catch (e) {
      console.error('[useUserDocuments] load', e);
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  useEffect(() => { load(); }, [load]);

  /** Crea un documento. Actualiza el estado local sin recargar. */
  const create = useCallback(async (payload) => {
    setSaving(true);
    try {
      const doc = await createDocumento(usuarioId, payload);
      setDocumentos(prev => [...prev, doc]);
      return doc;
    } finally {
      setSaving(false);
    }
  }, [usuarioId]);

  /** Actualiza un documento existente. */
  const update = useCallback(async (docId, patch) => {
    setSaving(true);
    try {
      const updated = await updateDocumento(docId, usuarioId, patch);
      setDocumentos(prev => prev.map(d => d.id === docId ? updated : d));
      return updated;
    } finally {
      setSaving(false);
    }
  }, [usuarioId]);

  /** Elimina (soft-delete) un documento. */
  const remove = useCallback(async (docId, storageUrl) => {
    setSaving(true);
    try {
      await deleteDocumento(docId, storageUrl);
      setDocumentos(prev => prev.filter(d => d.id !== docId));
    } finally {
      setSaving(false);
    }
  }, []);

  return { documentos, loading, saving, reload: load, create, update, remove };
}

/**
 * Hook de solo lectura para que un contacto vea los documentos de los técnicos
 * asignados a una visita concreta. Usa RPC con SECURITY DEFINER.
 *
 * @param {string|null} visitaId
 * @returns {{ documentos, loading }}
 */
export function useDocumentosTecnicosVisita(visitaId) {
  const [documentos, setDocumentos] = useState([]);
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!visitaId) {
        setDocumentos([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getDocumentosTecnicosVisita(visitaId);
        if (!cancelled) setDocumentos(data);
      } catch (e) {
        console.error('[useDocumentosTecnicosVisita]', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [visitaId]);

  return { documentos, loading };
}
