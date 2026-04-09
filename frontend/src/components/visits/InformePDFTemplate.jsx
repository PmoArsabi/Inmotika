import React from 'react';

// ─── Helpers de formato ────────────────────────────────────────────────────────

/**
 * Formatea una fecha ISO a fecha legible en español.
 * @param {string|null} iso
 * @returns {string}
 */
function fmtFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

/**
 * Formatea una fecha ISO a fecha + hora legible en español.
 * @param {string|null} iso
 * @returns {string}
 */
function fmtFechaHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Etiqueta de estado de una actividad con color inline.
 * @param {'completada'|'omitida'|'pendiente'} estado
 * @returns {{ label: string, color: string }}
 */
function estadoActividad(estado) {
  switch (estado) {
    case 'completada': return { label: 'Realizada', color: '#16a34a' };
    case 'omitida':    return { label: 'Omitida',   color: '#dc2626' };
    default:           return { label: 'Pendiente', color: '#d97706' };
  }
}

// ─── Estilos inline (necesarios para html2canvas / jsPDF) ─────────────────────

const S = {
  page: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '11px',
    color: '#1a1a1a',
    background: '#ffffff',
    padding: '0',
    margin: '0',
    width: '794px', // A4 @ 96dpi
  },
  // Cabecera
  header: {
    display: 'flex',
    alignItems: 'stretch',
    borderBottom: '3px solid #b71c1c',
    marginBottom: '0',
  },
  headerLogo: {
    background: '#b71c1c',
    color: '#fff',
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: '160px',
  },
  headerLogoTitle: {
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    margin: '0',
  },
  headerLogoSub: {
    fontSize: '9px',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    opacity: 0.85,
    marginTop: '4px',
  },
  headerCenter: {
    flex: 1,
    borderLeft: '1px solid #e5e7eb',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    textAlign: 'center',
  },
  headerCenterTitle: {
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#1a1a1a',
    margin: '0',
  },
  headerMeta: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '12px 16px',
    fontSize: '10px',
    minWidth: '140px',
    gap: '4px',
  },
  headerMetaRow: {
    display: 'flex',
    gap: '6px',
  },
  headerMetaLabel: {
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    fontSize: '9px',
    width: '50px',
  },
  headerMetaValue: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  // Sección resumen
  section: {
    padding: '20px 28px',
    borderBottom: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#b71c1c',
    marginBottom: '12px',
    paddingBottom: '4px',
    borderBottom: '1px solid #fca5a5',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px 32px',
  },
  summaryRow: {
    display: 'flex',
    gap: '6px',
    padding: '3px 0',
  },
  summaryLabel: {
    color: '#6b7280',
    fontWeight: '700',
    fontSize: '9.5px',
    textTransform: 'uppercase',
    minWidth: '110px',
    flexShrink: 0,
  },
  summaryValue: {
    color: '#1a1a1a',
    fontWeight: '600',
    fontSize: '10.5px',
  },
  // Instrucciones
  instructionBox: {
    background: '#fef9c3',
    borderLeft: '3px solid #eab308',
    borderRadius: '0 4px 4px 0',
    padding: '8px 12px',
    marginTop: '8px',
    fontSize: '10px',
    color: '#78350f',
    lineHeight: '1.5',
  },
  // Categoría
  categoryHeader: {
    background: '#b71c1c',
    color: '#fff',
    padding: '8px 28px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '0',
  },
  // Dispositivo
  deviceSection: {
    padding: '16px 28px',
    borderBottom: '1px solid #e5e7eb',
  },
  deviceTitle: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  deviceTag: {
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '9px',
    fontWeight: '700',
    color: '#374151',
    letterSpacing: '0.5px',
  },
  deviceInfoTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '9.5px',
    marginBottom: '14px',
    tableLayout: 'fixed',
  },
  deviceInfoTh: {
    background: '#f9fafb',
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: '8px',
    letterSpacing: '0.5px',
    padding: '5px 8px',
    border: '1px solid #e5e7eb',
    textAlign: 'left',
  },
  deviceInfoTd: {
    padding: '5px 8px',
    border: '1px solid #e5e7eb',
    color: '#1a1a1a',
    fontWeight: '500',
  },
  // Pasos & actividades
  pasoBox: {
    marginBottom: '10px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  pasoHeader: {
    background: '#1e3a5f',
    color: '#fff',
    padding: '6px 12px',
    fontSize: '9.5px',
    fontWeight: '700',
  },
  actividadesTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '9px',
  },
  actTh: {
    background: '#f3f4f6',
    color: '#374151',
    fontWeight: '700',
    fontSize: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    padding: '4px 8px',
    border: '1px solid #e5e7eb',
    textAlign: 'left',
  },
  actTd: {
    padding: '4px 8px',
    border: '1px solid #e5e7eb',
    verticalAlign: 'top',
    lineHeight: '1.4',
  },
  pasoComentario: {
    background: '#f0f9ff',
    borderTop: '1px solid #bae6fd',
    padding: '5px 12px',
    fontSize: '9px',
    color: '#0c4a6e',
  },
  // Fotos
  fotosGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '12px',
  },
  fotoItem: {
    width: '170px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  fotoImg: {
    width: '100%',
    height: '120px',
    objectFit: 'cover',
    display: 'block',
  },
  fotoLabel: {
    background: '#f9fafb',
    padding: '3px 6px',
    fontSize: '8px',
    color: '#6b7280',
    textAlign: 'center',
  },
  // Observación final dispositivo
  obsBox: {
    background: '#f0fdf4',
    borderLeft: '3px solid #16a34a',
    borderRadius: '0 4px 4px 0',
    padding: '6px 10px',
    fontSize: '9.5px',
    color: '#14532d',
    marginTop: '10px',
  },
  // Footer
  footer: {
    borderTop: '2px solid #e5e7eb',
    padding: '12px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '8.5px',
    color: '#9ca3af',
  },
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

/**
 * Fila de la tabla de info del dispositivo.
 */
function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <tr>
      <td style={S.deviceInfoTh}>{label}</td>
      <td style={S.deviceInfoTd}>{value}</td>
    </tr>
  );
}

/**
 * Bloque de un paso con su tabla de actividades.
 * @param {{ paso: import('../api/informeApi').PasoEjecucion }} props
 */
function PasoBlock({ paso }) {
  return (
    <div style={S.pasoBox}>
      <div style={S.pasoHeader}>
        Paso {paso.orden} — {paso.descripcion}
      </div>

      {paso.actividades.length > 0 && (
        <table style={S.actividadesTable}>
          <thead>
            <tr>
              <th style={{ ...S.actTh, width: '50%' }}>Actividad</th>
              <th style={{ ...S.actTh, width: '12%' }}>Estado</th>
              <th style={{ ...S.actTh, width: '38%' }}>Observación</th>
            </tr>
          </thead>
          <tbody>
            {paso.actividades.map(act => {
              const { label, color } = estadoActividad(act.estado);
              return (
                <tr key={act.id}>
                  <td style={S.actTd}>{act.descripcion}</td>
                  <td style={{ ...S.actTd, color, fontWeight: '700', whiteSpace: 'nowrap' }}>
                    {label}
                  </td>
                  <td style={{ ...S.actTd, color: '#4b5563' }}>
                    {act.observacion || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {paso.comentarios && (
        <div style={S.pasoComentario}>
          <strong>Comentario del técnico:</strong> {paso.comentarios}
        </div>
      )}
    </div>
  );
}

/**
 * Sección completa de un dispositivo.
 * @param {{ dispositivo: import('../api/informeApi').DispositivoInforme, index: number }} props
 */
function DispositivoBlock({ dispositivo: d, index }) {
  return (
    <div style={S.deviceSection}>
      {/* Título del dispositivo */}
      <div style={S.deviceTitle}>
        <span>Dispositivo {index + 1}</span>
        {d.id_inmotika && <span style={S.deviceTag}>ID: {d.id_inmotika}</span>}
        {d.codigo_etiqueta && <span style={S.deviceTag}>Etiqueta: {d.codigo_etiqueta}</span>}
      </div>

      {/* Tabla de info general */}
      <table style={S.deviceInfoTable}>
        <tbody>
          <tr>
            <InfoRow label="Código Único" value={d.codigo_unico} />
            <InfoRow label="Serial" value={d.serial} />
          </tr>
          <tr>
            <InfoRow label="Marca" value={d.marca_nombre} />
            <InfoRow label="Modelo" value={d.modelo} />
          </tr>
          <tr>
            <InfoRow label="Línea" value={d.linea} />
            <InfoRow label="MAC Address" value={d.mac_address} />
          </tr>
          {d.notas_tecnicas && (
            <tr>
              <td colSpan={2} style={S.deviceInfoTh}>Notas Técnicas</td>
            </tr>
          )}
          {d.notas_tecnicas && (
            <tr>
              <td colSpan={2} style={S.deviceInfoTd}>{d.notas_tecnicas}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Paso a paso */}
      {d.pasos.map(paso => (
        <PasoBlock key={paso.id} paso={paso} />
      ))}

      {/* Observación final del técnico para este dispositivo */}
      {d.observacion_final && (
        <div style={S.obsBox}>
          <strong>Observación final:</strong> {d.observacion_final}
        </div>
      )}

      {/* Fotos de evidencia */}
      {(d.fotos.length > 0 || d.foto_etiqueta) && (
        <div>
          <div style={{ ...S.sectionTitle, marginTop: '12px', fontSize: '9px' }}>
            Evidencia fotográfica
          </div>
          <div style={S.fotosGrid}>
            {d.foto_etiqueta && (
              <div style={S.fotoItem}>
                <img src={d.foto_etiqueta} alt="Etiqueta" style={S.fotoImg} crossOrigin="anonymous" />
                <div style={S.fotoLabel}>Etiqueta</div>
              </div>
            )}
            {d.fotos.map((url, i) => (
              <div key={i} style={S.fotoItem}>
                <img src={url} alt={`Foto ${i + 1}`} style={S.fotoImg} crossOrigin="anonymous" />
                <div style={S.fotoLabel}>Foto {i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Template HTML del informe de mantenimiento preventivo.
 * Se renderiza en un div offscreen y luego html2canvas + jsPDF lo convierte a PDF.
 *
 * @param {{ informe: import('../api/informeApi').InformeVisita }} props
 */
export default function InformePDFTemplate({ informe }) {
  const hoy = fmtFecha(new Date().toISOString());

  return (
    <div style={S.page} id="informe-pdf-root">

      {/* ── CABECERA ── */}
      <div style={S.header}>
        <div style={S.headerLogo}>
          <p style={S.headerLogoTitle}>INMOTIKA</p>
          <p style={S.headerLogoSub}>Sistema de Gestión</p>
        </div>
        <div style={S.headerCenter}>
          <p style={S.headerCenterTitle}>
            Formato Mantenimiento {informe.tipo_visita}
          </p>
        </div>
        <div style={S.headerMeta}>
          <div style={S.headerMetaRow}>
            <span style={S.headerMetaLabel}>Fecha</span>
            <span style={S.headerMetaValue}>{hoy}</span>
          </div>
          <div style={S.headerMetaRow}>
            <span style={S.headerMetaLabel}>Sede</span>
            <span style={S.headerMetaValue}>{informe.sucursal_nombre}</span>
          </div>
          <div style={S.headerMetaRow}>
            <span style={S.headerMetaLabel}>Ciudad</span>
            <span style={S.headerMetaValue}>{informe.sucursal_ciudad || '—'}</span>
          </div>
        </div>
      </div>

      {/* ── RESUMEN DE LA VISITA ── */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Resumen de la visita</div>
        <div style={S.summaryGrid}>
          <div style={S.summaryRow}>
            <span style={S.summaryLabel}>Cliente</span>
            <span style={S.summaryValue}>{informe.cliente_nombre}</span>
          </div>
          {informe.cliente_nit && (
            <div style={S.summaryRow}>
              <span style={S.summaryLabel}>NIT</span>
              <span style={S.summaryValue}>{informe.cliente_nit}</span>
            </div>
          )}
          <div style={S.summaryRow}>
            <span style={S.summaryLabel}>Sucursal</span>
            <span style={S.summaryValue}>{informe.sucursal_nombre}</span>
          </div>
          {informe.sucursal_direccion && (
            <div style={S.summaryRow}>
              <span style={S.summaryLabel}>Dirección</span>
              <span style={S.summaryValue}>{informe.sucursal_direccion}</span>
            </div>
          )}
          <div style={S.summaryRow}>
            <span style={S.summaryLabel}>Tipo de mantenimiento</span>
            <span style={S.summaryValue}>{informe.tipo_visita}</span>
          </div>
          <div style={S.summaryRow}>
            <span style={S.summaryLabel}>Fecha programada</span>
            <span style={S.summaryValue}>{fmtFecha(informe.fecha_programada)}</span>
          </div>
          <div style={S.summaryRow}>
            <span style={S.summaryLabel}>Fecha inicio</span>
            <span style={S.summaryValue}>{fmtFechaHora(informe.fecha_inicio)}</span>
          </div>
          <div style={S.summaryRow}>
            <span style={S.summaryLabel}>Fecha fin</span>
            <span style={S.summaryValue}>{fmtFechaHora(informe.fecha_fin)}</span>
          </div>
          <div style={S.summaryRow}>
            <span style={S.summaryLabel}>Técnico(s)</span>
            <span style={S.summaryValue}>{informe.tecnicos || '—'}</span>
          </div>
          {informe.coordinador && (
            <div style={S.summaryRow}>
              <span style={S.summaryLabel}>Coordinador</span>
              <span style={S.summaryValue}>{informe.coordinador}</span>
            </div>
          )}
          <div style={S.summaryRow}>
            <span style={S.summaryLabel}>Dispositivos revisados</span>
            <span style={S.summaryValue}>{informe.total_dispositivos}</span>
          </div>
        </div>

        {informe.instrucciones && (
          <div style={S.instructionBox}>
            <strong>Instrucciones del coordinador:</strong> {informe.instrucciones}
          </div>
        )}
      </div>

      {/* ── DISPOSITIVOS POR CATEGORÍA ── */}
      {informe.categorias.map(cat => (
        <div key={cat.categoria_nombre}>
          <div style={S.categoryHeader}>
            Categoría: {cat.categoria_nombre} ({cat.dispositivos.length} dispositivo{cat.dispositivos.length !== 1 ? 's' : ''})
          </div>
          {cat.dispositivos.map((disp, idx) => (
            <DispositivoBlock key={disp.id} dispositivo={disp} index={idx} />
          ))}
        </div>
      ))}

      {/* ── FOOTER ── */}
      <div style={S.footer}>
        <span>Inmotika S.A.S — Sistema de Gestión de Calidad</span>
        <span>Generado el {hoy} · Documento de uso interno</span>
      </div>
    </div>
  );
}
