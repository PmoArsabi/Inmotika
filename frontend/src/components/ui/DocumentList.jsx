import { useState } from 'react';
import { FileText, ExternalLink, Loader2 } from 'lucide-react';
import { openDocumentoSignedUrl } from '../../api/usuarioDocumentoApi';
import { useCatalog } from '../../hooks/useCatalog';

/**
 * Lista de documentos de solo lectura con acción de visualización via signed URL.
 * Usable tanto en el perfil del usuario como en la vista de solicitud de visita.
 *
 * @param {Object}  props
 * @param {Array}   props.documentos  - Array de { id, nombre, tipo, url }
 * @param {boolean} props.loading     - Muestra skeleton mientras carga
 * @param {string}  [props.emptyText] - Texto cuando no hay documentos
 * @param {boolean} [props.groupByUser] - Agrupa por tecnico_nombres + tecnico_apellidos (vista contacto)
 */
const DocumentList = ({ documentos = [], loading = false, emptyText = 'Sin documentos disponibles.', groupByUser = false }) => {
  const [opening, setOpening] = useState(null); // docId que se está abriendo
  const { options: tipoOptions } = useCatalog('TIPO_DOCUMENTO_USUARIO');

  const handleOpen = async (doc) => {
    if (!doc.url) return;
    setOpening(doc.id || doc.doc_id);
    try {
      const url = await openDocumentoSignedUrl(doc.url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('[DocumentList] signed URL error', e);
    } finally {
      setOpening(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (documentos.length === 0) {
    return <p className="text-xs italic text-gray-400">{emptyText}</p>;
  }

  // Agrupación por técnico (usado en vista de contacto)
  const groups = groupByUser
    ? documentos.reduce((acc, doc) => {
        const key = `${doc.tecnico_nombres || ''} ${doc.tecnico_apellidos || ''}`.trim() || 'Técnico';
        if (!acc[key]) acc[key] = [];
        acc[key].push(doc);
        return acc;
      }, {})
    : { '': documentos };

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([person, docs]) => (
        <div key={person}>
          {groupByUser && person && (
            <p className="text-2xs font-bold uppercase tracking-widest text-gray-400 mb-2">{person}</p>
          )}
          <ul className="space-y-1.5">
            {docs.map(doc => {
              const docId   = doc.id || doc.doc_id;
              const isOpen  = opening === docId;
              const hasFile = !!doc.url;
              return (
                <li
                  key={docId}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors group"
                >
                  <FileText size={14} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{doc.nombre}</p>
                    <p className="text-2xs text-gray-400">{tipoOptions.find(t => t.codigo === doc.tipo)?.label || doc.tipo}</p>
                  </div>
                  {hasFile && (
                    <button
                      type="button"
                      onClick={() => handleOpen(doc)}
                      disabled={isOpen}
                      title="Ver documento"
                      className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-brand hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {isOpen
                        ? <Loader2 size={14} className="animate-spin" />
                        : <ExternalLink size={14} />
                      }
                    </button>
                  )}
                  {!hasFile && (
                    <span className="text-2xs text-gray-300 italic shrink-0">Sin archivo</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default DocumentList;
