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
 * Retorna label, color de fondo y color de texto según el estado de una actividad.
 * @param {'completada'|'omitida'|'pendiente'} estado
 * @returns {{ label: string, bg: string, text: string, dot: string }}
 */
function estadoActividad(estado) {
  switch (estado) {
    case 'completada': return { label: 'Realizada',  bg: '#dcfce7', text: '#15803d', dot: '#16a34a' };
    case 'omitida':    return { label: 'Omitida',    bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' };
    default:           return { label: 'Pendiente',  bg: '#fefce8', text: '#a16207', dot: '#ca8a04' };
  }
}

// ─── Paleta de colores ────────────────────────────────────────────────────────

const C = {
  red:       '#C62828',
  redLight:  '#FFEBEE',
  redMid:    '#EF9A9A',
  dark:      '#1A1A1A',
  gray900:   '#111827',
  gray700:   '#374151',
  gray500:   '#6b7280',
  gray300:   '#d1d5db',
  gray100:   '#f3f4f6',
  gray50:    '#f9fafb',
  white:     '#ffffff',
  blue50:    '#eff6ff',
  blue200:   '#bfdbfe',
  blue900:   '#1e3a5f',
};

// ─── Estilos inline ───────────────────────────────────────────────────────────

const S = {
  page: {
    fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
    fontSize: '10px',
    color: C.gray900,
    background: C.white,
    width: '794px',
    margin: '0',
    padding: '0',
  },

  // ── Cabecera ──
  header: {
    background: C.dark,
    display: 'flex',
    alignItems: 'stretch',
    minHeight: '72px',
  },
  headerAccent: {
    width: '6px',
    background: C.red,
    flexShrink: 0,
  },
  headerLogo: {
    padding: '14px 22px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    borderRight: `1px solid rgba(255,255,255,0.1)`,
    minWidth: '150px',
  },
  headerLogoTitle: {
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: C.white,
    margin: '0',
    lineHeight: '1',
  },
  headerLogoSub: {
    fontSize: '7.5px',
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.55)',
    marginTop: '5px',
    display: 'block',
  },
  headerCenter: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '14px 24px',
    borderRight: `1px solid rgba(255,255,255,0.1)`,
  },
  headerDocLabel: {
    fontSize: '7px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '3px',
  },
  headerDocTitle: {
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: C.white,
    margin: '0',
    lineHeight: '1.3',
  },
  headerMeta: {
    padding: '14px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '5px',
    minWidth: '145px',
  },
  headerMetaRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
  },
  headerMetaLabel: {
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    fontSize: '7px',
    letterSpacing: '0.8px',
    width: '42px',
    flexShrink: 0,
  },
  headerMetaValue: {
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '9px',
  },

  // ── Banda de título de sección ──
  sectionBand: {
    background: C.gray50,
    borderTop: `1px solid ${C.gray300}`,
    borderBottom: `1px solid ${C.gray300}`,
    padding: '7px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionBandDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: C.red,
    flexShrink: 0,
  },
  sectionBandText: {
    fontSize: '9px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: C.gray700,
    margin: '0',
  },

  // ── Resumen ──
  summarySection: {
    padding: '18px 28px',
    borderBottom: `1px solid ${C.gray300}`,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: '32px',
    rowGap: '0px',
  },
  summaryRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0',
    borderBottom: `1px solid ${C.gray100}`,
    padding: '5px 0',
  },
  summaryLabel: {
    color: C.gray500,
    fontWeight: '600',
    fontSize: '8.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    minWidth: '120px',
    flexShrink: 0,
  },
  summaryValue: {
    color: C.gray900,
    fontWeight: '600',
    fontSize: '10px',
  },
  summaryValueHighlight: {
    color: C.dark,
    fontWeight: '700',
    fontSize: '10.5px',
  },

  // ── Instrucciones ──
  instructionBox: {
    background: '#fffbeb',
    border: `1px solid #fde68a`,
    borderLeft: `3px solid #f59e0b`,
    borderRadius: '0 5px 5px 0',
    padding: '8px 12px',
    marginTop: '12px',
    fontSize: '9px',
    color: '#78350f',
    lineHeight: '1.6',
  },

  // ── Categoría ──
  categoryBand: {
    background: C.dark,
    padding: '9px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '2px',
  },
  categoryBandStripe: {
    width: '3px',
    height: '16px',
    background: C.red,
    borderRadius: '2px',
  },
  categoryBandText: {
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: C.white,
    margin: '0',
  },
  categoryBandCount: {
    marginLeft: 'auto',
    fontSize: '8px',
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },

  // ── Dispositivo ──
  deviceWrapper: {
    borderBottom: `1px solid ${C.gray300}`,
  },
  deviceHeader: {
    background: C.redLight,
    borderBottom: `1px solid ${C.redMid}`,
    padding: '8px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  deviceIndex: {
    width: '20px',
    height: '20px',
    background: C.red,
    color: C.white,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px',
    fontWeight: '800',
    flexShrink: 0,
  },
  deviceName: {
    fontSize: '11px',
    fontWeight: '800',
    color: C.dark,
    flex: 1,
  },
  deviceChip: {
    background: C.white,
    border: `1px solid ${C.redMid}`,
    borderRadius: '4px',
    padding: '2px 7px',
    fontSize: '8px',
    fontWeight: '700',
    color: C.red,
    letterSpacing: '0.3px',
  },
  deviceBody: {
    padding: '14px 28px',
  },

  // ── Info técnica del dispositivo ──
  deviceInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0',
    border: `1px solid ${C.gray300}`,
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '14px',
  },
  deviceInfoCell: {
    padding: '7px 10px',
    borderRight: `1px solid ${C.gray300}`,
    borderBottom: `1px solid ${C.gray300}`,
  },
  deviceInfoCellLast: {
    padding: '7px 10px',
    borderBottom: `1px solid ${C.gray300}`,
  },
  deviceInfoCellLabel: {
    fontSize: '7.5px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: C.gray500,
    marginBottom: '2px',
  },
  deviceInfoCellValue: {
    fontSize: '9.5px',
    fontWeight: '600',
    color: C.gray900,
  },

  // ── Paso ──
  pasoWrapper: {
    marginBottom: '10px',
    border: `1px solid ${C.gray300}`,
    borderRadius: '6px',
    overflow: 'hidden',
  },
  pasoHeader: {
    background: C.blue900,
    padding: '7px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pasoNumBadge: {
    width: '18px',
    height: '18px',
    background: C.red,
    color: C.white,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    fontWeight: '800',
    flexShrink: 0,
  },
  pasoTitle: {
    fontSize: '9px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: C.white,
    margin: '0',
    flex: 1,
  },
  pasoStatsText: {
    fontSize: '8px',
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
  },

  // ── Actividades (lista, no tabla) ──
  actividadesList: {
    padding: '4px 0',
    background: C.white,
  },
  actRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0',
    padding: '5px 14px',
    borderBottom: `1px solid ${C.gray100}`,
  },
  actRowLast: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0',
    padding: '5px 14px',
  },
  actDesc: {
    flex: 1,
    fontSize: '9px',
    color: C.gray700,
    lineHeight: '1.5',
    paddingRight: '8px',
  },
  actBadge: {
    borderRadius: '10px',
    padding: '2px 8px',
    fontSize: '7.5px',
    fontWeight: '700',
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    minWidth: '54px',
    textAlign: 'center',
  },
  actObs: {
    fontSize: '8.5px',
    color: C.gray500,
    fontStyle: 'italic',
    paddingLeft: '14px',
    paddingRight: '14px',
    paddingBottom: '5px',
    lineHeight: '1.4',
  },
  pasoComentario: {
    background: C.blue50,
    borderTop: `1px solid ${C.blue200}`,
    padding: '6px 14px',
    fontSize: '8.5px',
    color: '#1e40af',
    lineHeight: '1.5',
  },

  // ── Observación fuera de servicio ──
  obsBox: {
    background: '#fef2f2',
    border: `1px solid #fca5a5`,
    borderLeft: `3px solid ${C.red}`,
    borderRadius: '0 5px 5px 0',
    padding: '7px 12px',
    fontSize: '9px',
    color: '#7f1d1d',
    marginTop: '10px',
    lineHeight: '1.5',
  },

  // ── Fotos ──
  fotosSection: {
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: `1px dashed ${C.gray300}`,
  },
  fotosSectionLabel: {
    fontSize: '7.5px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: C.gray500,
    marginBottom: '8px',
  },
  fotosGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  fotoItem: {
    width: '160px',
    border: `1px solid ${C.gray300}`,
    borderRadius: '6px',
    overflow: 'hidden',
  },
  fotoImg: {
    width: '100%',
    height: '110px',
    objectFit: 'cover',
    display: 'block',
  },
  fotoLabel: {
    background: C.gray50,
    padding: '3px 6px',
    fontSize: '7.5px',
    color: C.gray500,
    textAlign: 'center',
    fontWeight: '600',
  },

  // ── Footer ──
  footer: {
    background: C.dark,
    padding: '10px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px',
  },
  footerLeft: {
    fontSize: '8px',
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    letterSpacing: '0.3px',
  },
  footerRight: {
    fontSize: '8px',
    color: 'rgba(255,255,255,0.35)',
  },
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

/**
 * Fila de info del dispositivo (celda del grid).
 */
function DeviceInfoCell({ label, value, last }) {
  if (!value) return null;
  return (
    <div style={last ? S.deviceInfoCellLast : S.deviceInfoCell}>
      <div style={S.deviceInfoCellLabel}>{label}</div>
      <div style={S.deviceInfoCellValue}>{value}</div>
    </div>
  );
}

/**
 * Bloque de un paso con lista de actividades sin tabla.
 * @param {{ paso: import('../api/informeApi').PasoEjecucion }} props
 */
function PasoBlock({ paso }) {
  const total       = paso.actividades.length;
  const completadas = paso.actividades.filter(a => a.estado === 'completada').length;
  const omitidas    = paso.actividades.filter(a => a.estado === 'omitida').length;

  return (
    <div style={S.pasoWrapper}>
      {/* Header del paso */}
      <div style={S.pasoHeader}>
        <div style={S.pasoNumBadge}>{paso.orden}</div>
        <p style={S.pasoTitle}>{paso.descripcion}</p>
        <span style={S.pasoStatsText}>
          {completadas}/{total} realizadas
          {omitidas > 0 ? ` · ${omitidas} omitida${omitidas !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      {/* Actividades */}
      {paso.actividades.length > 0 && (
        <div style={S.actividadesList}>
          {paso.actividades.map((act, idx) => {
            const { label, bg, text, dot } = estadoActividad(act.estado);
            const isLast = idx === paso.actividades.length - 1 && !paso.comentarios;
            return (
              <React.Fragment key={act.id}>
                <div style={isLast ? S.actRowLast : S.actRow}>
                  {/* Indicador de estado */}
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: dot,
                    flexShrink: 0,
                    marginTop: '3px',
                    marginRight: '8px',
                  }} />
                  <span style={S.actDesc}>{act.descripcion}</span>
                  <span style={{ ...S.actBadge, background: bg, color: text }}>{label}</span>
                </div>
                {act.observacion && act.estado === 'omitida' && (
                  <div style={S.actObs}>
                    ↳ {act.observacion}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Comentario técnico del paso */}
      {paso.comentarios && (
        <div style={S.pasoComentario}>
          <strong>Obs. técnico:</strong> {paso.comentarios}
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
  // Campos de info técnica a mostrar (solo los no-nulos)
  const infoFields = [
    { label: 'Serial',      value: d.serial },
    { label: 'Marca',       value: d.marca_nombre },
    { label: 'Modelo',      value: d.modelo },
    { label: 'Línea',       value: d.linea },
    { label: 'MAC Address', value: d.mac_address },
    { label: 'Cód. Único',  value: d.codigo_unico },
  ].filter(f => !!f.value);

  return (
    <div style={S.deviceWrapper}>
      {/* Header del dispositivo */}
      <div style={S.deviceHeader}>
        <div style={S.deviceIndex}>{index + 1}</div>
        <span style={S.deviceName}>{d.nombre || `Dispositivo ${index + 1}`}</span>
        {d.id_inmotika   && <span style={S.deviceChip}>ID {d.id_inmotika}</span>}
        {d.codigo_etiqueta && <span style={S.deviceChip}>Etq. {d.codigo_etiqueta}</span>}
      </div>

      <div style={S.deviceBody}>
        {/* Grid de info técnica */}
        {infoFields.length > 0 && (
          <div style={S.deviceInfoGrid}>
            {infoFields.map((f, i) => (
              <DeviceInfoCell
                key={f.label}
                label={f.label}
                value={f.value}
                last={(i + 1) % 3 === 0}
              />
            ))}
          </div>
        )}

        {/* Notas técnicas */}
        {d.notas_tecnicas && (
          <div style={{ ...S.instructionBox, marginBottom: '12px', marginTop: '0', background: C.gray50, borderLeftColor: C.gray500, color: C.gray700, border: `1px solid ${C.gray300}`, borderLeft: `3px solid ${C.gray500}` }}>
            <strong>Notas técnicas:</strong> {d.notas_tecnicas}
          </div>
        )}

        {/* Pasos */}
        {d.pasos.map(paso => (
          <PasoBlock key={paso.id} paso={paso} />
        ))}

        {/* Observación final (fuera de servicio) */}
        {d.observacion_final && (
          <div style={S.obsBox}>
            <strong>⚠ Dispositivo fuera de servicio:</strong> {d.observacion_final}
          </div>
        )}

        {/* Evidencias fotográficas */}
        {(d.fotos.length > 0 || d.foto_etiqueta) && (
          <div style={S.fotosSection}>
            <div style={S.fotosSectionLabel}>Evidencia fotográfica</div>
            <div style={S.fotosGrid}>
              {d.foto_etiqueta && (
                <div style={S.fotoItem}>
                  <img src={d.foto_etiqueta} alt="Etiqueta" style={S.fotoImg} crossOrigin="anonymous" />
                  <div style={{ ...S.fotoLabel, color: '#1d4ed8', background: '#eff6ff' }}>Foto Etiqueta</div>
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
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Template HTML del informe de mantenimiento.
 * Se renderiza offscreen y luego html2canvas + jsPDF lo convierte a PDF.
 *
 * @param {{ informe: import('../api/informeApi').InformeVisita }} props
 */
export default function InformePDFTemplate({ informe }) {
  const hoy = fmtFecha(new Date().toISOString());

  return (
    <div style={S.page} id="informe-pdf-root">

      {/* ══ CABECERA ══ */}
      <div style={S.header}>
        <div style={S.headerAccent} />
        <div style={S.headerLogo}>
          <p style={S.headerLogoTitle}>INMOTIKA</p>
          <span style={S.headerLogoSub}>Sistema de Gestión</span>
        </div>
        <div style={S.headerCenter}>
          <p style={S.headerDocLabel}>Documento de mantenimiento</p>
          <p style={S.headerDocTitle}>
            Informe de Mantenimiento<br />{informe.tipo_visita}
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

      {/* ══ RESUMEN ══ */}
      <div style={S.sectionBand}>
        <div style={S.sectionBandDot} />
        <p style={S.sectionBandText}>Resumen de la visita</p>
      </div>

      <div style={S.summarySection}>
        <div style={S.summaryGrid}>
          <div style={S.summaryRow}>
            <span style={S.summaryLabel}>Cliente</span>
            <span style={S.summaryValueHighlight}>{informe.cliente_nombre}</span>
          </div>
          {informe.cliente_nit && (
            <div style={S.summaryRow}>
              <span style={S.summaryLabel}>NIT</span>
              <span style={S.summaryValue}>{informe.cliente_nit}</span>
            </div>
          )}
          <div style={S.summaryRow}>
            <span style={S.summaryLabel}>Sucursal</span>
            <span style={S.summaryValueHighlight}>{informe.sucursal_nombre}</span>
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
            <span style={{ ...S.summaryValue, color: C.red, fontWeight: '800', fontSize: '11px' }}>
              {informe.total_dispositivos}
            </span>
          </div>
        </div>

        {informe.instrucciones && (
          <div style={S.instructionBox}>
            <strong>Instrucciones del coordinador:</strong> {informe.instrucciones}
          </div>
        )}
      </div>

      {/* ══ DISPOSITIVOS POR CATEGORÍA ══ */}
      {informe.categorias.map(cat => (
        <div key={cat.categoria_nombre}>
          {/* Banda de categoría */}
          <div style={S.categoryBand}>
            <div style={S.categoryBandStripe} />
            <p style={S.categoryBandText}>{cat.categoria_nombre}</p>
            <span style={S.categoryBandCount}>
              {cat.dispositivos.length} dispositivo{cat.dispositivos.length !== 1 ? 's' : ''}
            </span>
          </div>

          {cat.dispositivos.map((disp, idx) => (
            <DispositivoBlock key={disp.id} dispositivo={disp} index={idx} />
          ))}
        </div>
      ))}

      {/* ══ FOOTER ══ */}
      <div style={S.footer}>
        <span style={S.footerLeft}>Inmotika S.A.S — Sistema de Gestión de Calidad</span>
        <span style={S.footerRight}>Generado el {hoy} · Documento de uso interno</span>
      </div>

    </div>
  );
}
