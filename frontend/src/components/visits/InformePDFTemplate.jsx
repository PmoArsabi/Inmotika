import React from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** @param {string|null} iso @returns {string} */
function fmtFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** @param {string|null} iso @returns {string} */
function fmtHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

/**
 * @param {'completada'|'omitida'|string} estado
 * @returns {{ label: string, bg: string, color: string }}
 */
function badgeEstado(estado) {
  switch (estado) {
    case 'completada': return { label: 'OK',       bg: '#dcfce7', color: '#166534' };
    case 'omitida':    return { label: 'Omitida',  bg: '#fee2e2', color: '#991b1b' };
    default:           return { label: 'N/A',      bg: '#f3f4f6', color: '#6b7280' };
  }
}

// ─── Paleta ───────────────────────────────────────────────────────────────────

const RED   = '#C62828';
const DARK  = '#111827';
const GRAY  = '#6b7280';
const LGRAY = '#9ca3af';
const BGRAY = '#f9fafb';
const BORD  = '#e5e7eb';
const LBORD = '#f3f4f6';
const WHITE = '#ffffff';
const BLUE  = '#eff6ff';
const BLUET = '#1e40af';

// ─── Sub-componentes ──────────────────────────────────────────────────────────

/**
 * Fila de la tabla de actividades.
 * @param {{ act: object, isLast: boolean, renderComentarioActividad: Function|null }} props
 */
function ActRow({ act, isLast, renderComentarioActividad }) {
  const [editingObs, setEditingObs] = React.useState(false);
  const { label, bg, color } = badgeEstado(act.estado);

  const hasObsGuardada = !!act.observacion;
  const hasStaticObs   = !renderComentarioActividad && act.observacion && act.estado === 'omitida';
  const showObsRow     = renderComentarioActividad ? (hasObsGuardada || editingObs) : hasStaticObs;
  const hasExtra       = showObsRow;

  return (
    <React.Fragment>
      <tr>
        <td style={{
          padding: '8px 10px',
          borderBottom: isLast && !hasExtra ? 'none' : `1px solid ${LBORD}`,
          fontSize: '9.5px', color: DARK, lineHeight: '1.4',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span>{act.descripcion}</span>
            {renderComentarioActividad && !hasObsGuardada && !editingObs && (
              <span style={{ flexShrink: 0 }}>
                {renderComentarioActividad(act, { editing: false, onStartEdit: () => setEditingObs(true), onCancelEdit: () => setEditingObs(false) })}
              </span>
            )}
          </div>
        </td>
        <td style={{
          padding: '8px 10px',
          borderBottom: isLast && !hasExtra ? 'none' : `1px solid ${LBORD}`,
          textAlign: 'center', width: '80px',
        }}>
          <span style={{ background: bg, color, padding: '2px 8px', borderRadius: '10px', fontSize: '7.5px', fontWeight: '700' }}>
            {label}
          </span>
        </td>
      </tr>

      {showObsRow && renderComentarioActividad && (
        <tr>
          <td colSpan={2} style={{
            padding: editingObs ? '0' : '2px 10px 6px',
            borderBottom: isLast ? 'none' : `1px solid ${LBORD}`,
            background: '#f0fdf4',
          }}>
            {editingObs ? (
              renderComentarioActividad(act, { editing: true, onStartEdit: () => setEditingObs(true), onCancelEdit: () => setEditingObs(false) })
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <span style={{ fontSize: '7px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', marginTop: '1px' }}>
                  Obs. actividad:
                </span>
                {renderComentarioActividad(act, { editing: false, onStartEdit: () => setEditingObs(true), onCancelEdit: () => setEditingObs(false) })}
              </div>
            )}
          </td>
        </tr>
      )}

      {hasStaticObs && (
        <tr>
          <td colSpan={2} style={{
            padding: '4px 10px 8px', fontSize: '8.5px',
            color: '#991b1b', fontStyle: 'italic',
            borderBottom: isLast ? 'none' : `1px solid ${LBORD}`,
          }}>
            ↳ {act.observacion}
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

/**
 * Bloque de paso dentro de un dispositivo.
 *
 * @param {{
 *   paso: object,
 *   intervencionId: string,
 *   renderComentarioPaso: Function|null,
 *   renderComentarioActividad: Function|null,
 * }} props
 */
function PasoBlock({ paso, intervencionId, renderComentarioPaso, renderComentarioActividad }) {
  const completadas = paso.actividades.filter(a => a.estado === 'completada').length;
  const total       = paso.actividades.length;

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <div style={{
          width: '18px', height: '18px',
          background: DARK, color: WHITE,
          borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '8px', fontWeight: '800',
        }}>
          {paso.orden}
        </div>
        <span style={{ fontSize: '9.5px', fontWeight: '700', color: DARK, textTransform: 'uppercase', letterSpacing: '0.3px', flex: 1 }}>
          {paso.descripcion}
        </span>
        <span style={{ fontSize: '8px', color: LGRAY, whiteSpace: 'nowrap' }}>
          {completadas}/{total} realizadas
        </span>
      </div>

      {paso.actividades.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: BGRAY }}>
              <th style={{ padding: '6px 10px', fontSize: '8px', color: GRAY, textTransform: 'uppercase', textAlign: 'left', fontWeight: '700' }}>
                Actividad Realizada
              </th>
              <th style={{ padding: '6px 10px', fontSize: '8px', color: GRAY, textTransform: 'uppercase', width: '80px', textAlign: 'center', fontWeight: '700' }}>
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {paso.actividades.map((act, idx) => (
              <ActRow
                key={act.id}
                act={act}
                isLast={idx === paso.actividades.length - 1}
                renderComentarioActividad={renderComentarioActividad}
              />
            ))}
          </tbody>
        </table>
      )}

      {renderComentarioPaso ? (
        paso.comentarios ? (
          <div style={{ background: BLUE, padding: '6px 12px', borderRadius: '0 0 4px 4px', fontSize: '9px', color: BLUET, lineHeight: '1.5', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '7px', fontWeight: '800', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
              Obs. paso:
            </span>
            {renderComentarioPaso(intervencionId, paso.id, paso.paso_protocolo_id, paso.comentarios)}
          </div>
        ) : (
          <div style={{ padding: '4px 12px 6px' }}>
            {renderComentarioPaso(intervencionId, paso.id, paso.paso_protocolo_id, paso.comentarios)}
          </div>
        )
      ) : paso.comentarios ? (
        <div style={{ background: BLUE, padding: '6px 12px', borderRadius: '0 0 4px 4px', fontSize: '9px', color: BLUET, lineHeight: '1.5', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '7px', fontWeight: '800', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
            Obs. paso:
          </span>
          <span>{paso.comentarios}</span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Tarjeta de un dispositivo.
 *
 * @param {{
 *   dispositivo: object,
 *   index: number,
 *   renderComentarioPaso: Function|null,
 *   renderComentarioActividad: Function|null,
 *   renderObservacionIntervencion: Function|null,
 *   renderEtiquetaValor: Function|null,
 *   renderEvidencias: Function|null,
 * }} props
 */
function DispositivoBlock({
  dispositivo: d,
  index,
  renderComentarioPaso,
  renderComentarioActividad,
  renderObservacionIntervencion,
  renderEtiquetaValor,
  renderEvidencias,
  isActive = false,
  onActivate = null,
}) {
  const fueraDeServicio = !!d.fuera_de_servicio;

  const headerBg    = fueraDeServicio ? RED   : DARK;
  const wrapperBord = isActive ? '#3b82f6' : fueraDeServicio ? '#fee2e2' : BORD;
  const bodyBg      = fueraDeServicio ? '#fff1f2' : WHITE;

  const dispositivoNombre = [d.modelo, d.marca_nombre].filter(Boolean).join(' · ')
    || d.codigo_unico
    || d.categoria_nombre
    || `Dispositivo ${index + 1}`;

  const infoFields = [
    { label: 'ID Inmotika',  value: d.id_inmotika },
    { label: 'Cód. Único',  value: d.codigo_unico },
    { label: 'Serial',      value: d.serial },
    { label: 'Línea',       value: d.linea },
    { label: 'MAC Address', value: d.mac_address },
    { label: 'Categoría',   value: d.categoria_nombre },
  ].filter(f => !!f.value);

  const obsIntervencionNode = renderObservacionIntervencion
    ? renderObservacionIntervencion(d.intervencion_id, d.observacion_final)
    : null;

  const evidenciasNode = renderEvidencias ? renderEvidencias(d) : null;

  const fotoEtiquetaUrl = d.foto_etiqueta?.signedUrl || (typeof d.foto_etiqueta === 'string' ? d.foto_etiqueta : null);
  const fotosUrls = (d.fotos || []).map(f => (typeof f === 'string' ? f : f?.signedUrl)).filter(Boolean);

  // Valor de la etiqueta: nodo editable o texto estático
  const etiquetaValorNode = renderEtiquetaValor
    ? renderEtiquetaValor(d.intervencion_id, d.codigo_etiqueta)
    : null;

  return (
    <div
      data-intervencion-id={d.intervencion_id}
      style={{
        border: `${isActive ? '2px' : '1px'} solid ${wrapperBord}`,
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '20px',
        boxShadow: isActive ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
    >
      {/* Header — click activa el resaltado bidireccional */}
      <div
        onClick={onActivate || undefined}
        style={{
          background: headerBg,
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: WHITE,
          cursor: onActivate ? 'pointer' : 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            background: fueraDeServicio ? WHITE : RED,
            color: fueraDeServicio ? RED : WHITE,
            width: '22px', height: '22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '4px', fontWeight: '800', fontSize: '10px', flexShrink: 0,
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <div>
            <span style={{ fontWeight: '700', fontSize: '11px', display: 'block' }}>
              {dispositivoNombre}
            </span>
            {d.categoria_nombre && (
              <span style={{ fontSize: '8px', color: fueraDeServicio ? '#ffcccc' : LGRAY, fontWeight: '400' }}>
                {d.categoria_nombre}
              </span>
            )}
          </div>
        </div>
        {fueraDeServicio && (
          <span style={{ fontSize: '8.5px', color: '#ffcccc', fontWeight: '700' }}>⚠ FUERA DE SERVICIO</span>
        )}
      </div>

      {/* Cuerpo */}
      <div style={{ padding: '16px', background: bodyBg }}>
        {infoFields.length > 0 && (
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', paddingBottom: '12px', borderBottom: `1px dashed ${BORD}` }}>
            {infoFields.map(f => (
              <div key={f.label} style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '7px', color: LGRAY, textTransform: 'uppercase', margin: '0 0 2px' }}>{f.label}</p>
                <strong style={{ fontSize: '9.5px', color: DARK }}>{f.value}</strong>
              </div>
            ))}
          </div>
        )}

        {d.notas_tecnicas && (
          <div style={{ background: BGRAY, border: `1px solid ${BORD}`, padding: '8px 12px', borderRadius: '4px', fontSize: '9px', color: GRAY, marginBottom: '12px' }}>
            <strong>Notas técnicas:</strong> {d.notas_tecnicas}
          </div>
        )}

        {fueraDeServicio ? (
          <p style={{ margin: '0', color: '#991b1b', fontSize: '10px', lineHeight: '1.5' }}>
            <strong>Diagnóstico de falla:</strong> {d.motivo_fuera_de_servicio || d.observacion_final || '—'}
          </p>
        ) : (
          <>
            {d.pasos.map(paso => (
              <PasoBlock
                key={paso.id}
                paso={paso}
                intervencionId={d.intervencion_id}
                renderComentarioPaso={renderComentarioPaso}
                renderComentarioActividad={renderComentarioActividad}
              />
            ))}

            {obsIntervencionNode ? (
              <div style={{ marginTop: '8px', background: BLUE, padding: '8px 12px', borderRadius: '4px', fontSize: '9px', color: BLUET, lineHeight: '1.5' }}>
                {obsIntervencionNode}
              </div>
            ) : d.observacion_final ? (
              <div style={{ marginTop: '8px', background: BLUE, padding: '8px 12px', borderRadius: '4px', fontSize: '9px', color: BLUET, lineHeight: '1.5' }}>
                <strong>Obs. del técnico:</strong> {d.observacion_final}
              </div>
            ) : null}
          </>
        )}

        {/* Valor de etiqueta — siempre visible si existe, independiente de las fotos */}
        {(etiquetaValorNode || d.codigo_etiqueta) && (
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: `1px dashed ${BORD}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '7.5px', color: LGRAY, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', fontWeight: '700' }}>Etiqueta:</span>
            {etiquetaValorNode || <span style={{ fontSize: '9.5px', fontWeight: '700', color: DARK }}>{d.codigo_etiqueta}</span>}
          </div>
        )}

        {/* Evidencias fotográficas */}
        {evidenciasNode ? (
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px dashed ${BORD}` }}>
            {evidenciasNode}
          </div>
        ) : (fotoEtiquetaUrl || fotosUrls.length > 0) ? (
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px dashed ${BORD}` }}>
            <p style={{ fontSize: '7.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: GRAY, margin: '0 0 6px' }}>
              Evidencia fotográfica
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {fotoEtiquetaUrl && (
                <div style={{ width: '150px', border: `1px solid ${BORD}`, borderRadius: '6px', overflow: 'hidden' }}>
                  <img src={fotoEtiquetaUrl} alt="Etiqueta" style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} crossOrigin="anonymous" />
                  <div style={{ background: BGRAY, padding: '3px 6px', fontSize: '7.5px', color: GRAY, textAlign: 'center' }}>Foto Etiqueta</div>
                </div>
              )}
              {fotosUrls.map((url, i) => (
                <div key={i} style={{ width: '150px', border: `1px solid ${BORD}`, borderRadius: '6px', overflow: 'hidden' }}>
                  <img src={url} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} crossOrigin="anonymous" />
                  <div style={{ background: BGRAY, padding: '3px 6px', fontSize: '7.5px', color: GRAY, textAlign: 'center' }}>Foto {i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Template HTML del informe de mantenimiento.
 *
 * @param {{
 *   informe: import('../../api/informeApi').InformeVisita & { observacion_coordinador?: string|null, observacion_director?: string|null, coordinador_nombre?: string|null, director_nombre?: string|null },
 *   renderComentarioPaso: Function|null,
 *   renderComentarioActividad: Function|null,
 *   renderObservacionIntervencion: Function|null,
 *   renderEtiquetaValor: Function|null,
 *   renderObsCoordinador: Function|null,
 *   renderObsDirector: Function|null,
 *   renderEvidencias: Function|null,
 *   firmaCoordinadorUrl: string|null,
 *   firmaDirectorUrl: string|null,
 * }} props
 */
export default function InformePDFTemplate({
  informe,
  renderComentarioPaso = null,
  renderComentarioActividad = null,
  renderObservacionIntervencion = null,
  renderEtiquetaValor = null,
  renderObsCoordinador = null,
  renderObsDirector = null,
  renderEvidencias = null,
  firmaCoordinadorUrl = null,
  firmaDirectorUrl = null,
  logoUrl = null,
  activeIntervencionId = null,
  onActivate = null,
}) {
  const hoy       = fmtFecha(new Date().toISOString());
  const totalDisp = informe.categorias.reduce((s, c) => s + c.dispositivos.length, 0);

  const obsCoordinador = informe.observacion_coordinador || null;
  const obsDirector    = informe.observacion_director    || null;

  return (
    <div id="informe-pdf-root" style={{
      fontFamily: "'Inter', 'Segoe UI', Helvetica, sans-serif",
      fontSize: '11px',
      color: DARK,
      background: WHITE,
      width: '100%',
      maxWidth: '900px',
      minHeight: '1123px',
      margin: '0 auto',
      padding: '56px 64px',
      boxSizing: 'border-box',
    }}>

      {/* ══ CABECERA ══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: DARK, borderRadius: '8px', padding: '16px 24px' }}>
        <div>
          {logoUrl ? (
            <img src={logoUrl} alt="INMOTIKA" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0', letterSpacing: '-1px', color: WHITE }}>INMOTIKA</h1>
              </div>
              <p style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '2px', color: '#9ca3af', margin: '0' }}>
                Acceso a un mundo diferente
              </p>
            </>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'inline-block', background: RED, color: WHITE, padding: '4px 12px', borderRadius: '4px', fontSize: '9px', fontWeight: '700', marginBottom: '8px' }}>
            INFORME TÉCNICO
          </span>
          <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0' }}>
            Fecha: <span style={{ color: WHITE, fontWeight: '700' }}>{hoy}</span>
          </p>
        </div>
      </div>

      {/* ══ DATOS CLIENTE + CRONOGRAMA ══ */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px',
        background: BGRAY, borderRadius: '8px', padding: '20px',
        border: `1px solid ${BORD}`, marginBottom: '25px',
      }}>
        <div>
          <h2 style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: LGRAY, margin: '0 0 10px' }}>
            Detalles del Cliente
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '7px', fontSize: '10px' }}>
            <span style={{ color: GRAY }}>Cliente:</span>
            <strong style={{ color: DARK }}>{informe.cliente_nombre}</strong>

            <span style={{ color: GRAY }}>Sede:</span>
            <span style={{ fontWeight: '600' }}>{informe.sucursal_nombre}</span>

            {informe.sucursal_ciudad && <>
              <span style={{ color: GRAY }}>Ciudad:</span>
              <span>{informe.sucursal_ciudad}{informe.sucursal_direccion ? ` — ${informe.sucursal_direccion}` : ''}</span>
            </>}

            {informe.cliente_nit && <>
              <span style={{ color: GRAY }}>NIT:</span>
              <span>{informe.cliente_nit}</span>
            </>}

            {informe.tecnicos && <>
              <span style={{ color: GRAY }}>Técnico(s):</span>
              <span>{informe.tecnicos}</span>
            </>}

            {informe.coordinador && <>
              <span style={{ color: GRAY }}>Coordinador:</span>
              <span>{informe.coordinador}</span>
            </>}
          </div>
        </div>

        <div style={{ borderLeft: `1px solid ${BORD}`, paddingLeft: '20px' }}>
          <h2 style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: LGRAY, margin: '0 0 10px' }}>
            Cronograma
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '65px 1fr', gap: '7px', fontSize: '10px' }}>
            <span style={{ color: GRAY }}>Programada:</span>
            <span style={{ fontWeight: '600' }}>{fmtFecha(informe.fecha_programada)}</span>

            <span style={{ color: GRAY }}>Inicio:</span>
            <span>{fmtHora(informe.fecha_inicio)}</span>

            <span style={{ color: GRAY }}>Fin:</span>
            <span>{fmtHora(informe.fecha_fin)}</span>

            <span style={{ color: GRAY }}>Tipo:</span>
            <span>{informe.tipo_visita}</span>
          </div>
        </div>
      </div>

      {/* ══ INSTRUCCIONES ══ */}
      {informe.instrucciones && (
        <div style={{
          background: '#fffbeb', borderLeft: `4px solid #f59e0b`,
          padding: '12px 16px', borderRadius: '4px', marginBottom: '30px',
        }}>
          <p style={{ margin: '0', fontSize: '9.5px', color: '#92400e', lineHeight: '1.5' }}>
            <strong>Instrucciones del Coordinador:</strong> {informe.instrucciones}
          </p>
        </div>
      )}

      {/* ══ TÍTULO SECCIÓN EQUIPOS ══ */}
      <h3 style={{
        fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px',
        color: DARK, borderBottom: `2px solid ${LBORD}`,
        paddingBottom: '8px', marginBottom: '15px',
      }}>
        Equipos Intervenidos <span style={{ color: RED }}>({totalDisp})</span>
      </h3>

      {/* ══ DISPOSITIVOS POR CATEGORÍA ══ */}
      {informe.categorias.map(cat => (
        <div key={cat.categoria_nombre}>
          {informe.categorias.length > 1 && (
            <p style={{
              fontSize: '8.5px', fontWeight: '700', textTransform: 'uppercase',
              letterSpacing: '1px', color: GRAY,
              margin: '0 0 10px', paddingLeft: '4px',
              borderLeft: `3px solid ${RED}`, paddingRight: '4px',
            }}>
              {cat.categoria_nombre}
            </p>
          )}
          {cat.dispositivos.map((disp, idx) => (
            <DispositivoBlock
              key={disp.id}
              dispositivo={disp}
              index={idx}
              renderComentarioPaso={renderComentarioPaso}
              renderComentarioActividad={renderComentarioActividad}
              renderObservacionIntervencion={renderObservacionIntervencion}
              renderEtiquetaValor={renderEtiquetaValor}
              renderEvidencias={renderEvidencias}
              isActive={activeIntervencionId === disp.intervencion_id}
              onActivate={onActivate ? () => onActivate(disp.intervencion_id) : null}
            />
          ))}
        </div>
      ))}

      {/* ══ OBSERVACIÓN DEL COORDINADOR (al final, antes de firmas) ══ */}
      {(renderObsCoordinador || obsCoordinador) && (
        <div style={{ marginTop: '30px', marginBottom: '16px' }}>
          <div style={{ borderLeft: `4px solid ${RED}`, paddingLeft: '14px', marginBottom: '8px' }}>
            <p style={{ margin: '0', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px', color: GRAY, fontWeight: '700' }}>
              Observación del Coordinador
            </p>
          </div>
          {renderObsCoordinador ? (
            <div style={{ border: `1px solid ${BORD}`, borderRadius: '6px', padding: '12px 14px', background: BGRAY, fontSize: '9.5px', color: DARK, lineHeight: '1.6', minHeight: '50px' }}>
              {renderObsCoordinador()}
            </div>
          ) : (
            <div style={{ border: `1px solid ${BORD}`, borderRadius: '6px', padding: '12px 14px', background: BGRAY, fontSize: '9.5px', color: DARK, lineHeight: '1.6' }}>
              {obsCoordinador}
            </div>
          )}
        </div>
      )}

      {/* ══ OBSERVACIÓN DEL DIRECTOR ══ */}
      {(renderObsDirector || obsDirector) && (
        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
          <div style={{ borderLeft: `4px solid #1d4ed8`, paddingLeft: '14px', marginBottom: '8px' }}>
            <p style={{ margin: '0', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px', color: GRAY, fontWeight: '700' }}>
              Observación del Director
            </p>
          </div>
          {renderObsDirector ? (
            <div style={{ border: `1px solid #bfdbfe`, borderRadius: '6px', padding: '12px 14px', background: '#eff6ff', fontSize: '9.5px', color: DARK, lineHeight: '1.6', minHeight: '50px' }}>
              {renderObsDirector()}
            </div>
          ) : (
            <div style={{ border: `1px solid #bfdbfe`, borderRadius: '6px', padding: '12px 14px', background: '#eff6ff', fontSize: '9.5px', color: DARK, lineHeight: '1.6' }}>
              {obsDirector}
            </div>
          )}
        </div>
      )}

      {/* ══ FIRMAS ══ */}
      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px' }}>
        {/* Coordinador que revisó */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderBottom: `1px solid ${DARK}`, height: '48px', marginBottom: '10px', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            {firmaCoordinadorUrl && (
              <img
                src={firmaCoordinadorUrl}
                alt="Firma coordinador"
                style={{ maxHeight: '44px', maxWidth: '140px', objectFit: 'contain', marginBottom: '4px' }}
              />
            )}
          </div>
          <p style={{ fontSize: '9.5px', fontWeight: '700', margin: '0 0 2px', color: DARK }}>{informe.coordinador_nombre || informe.coordinador || 'Coordinador'}</p>
          <p style={{ fontSize: '8px', color: GRAY, margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coordinador Revisor</p>
        </div>

        {/* Director que aprobó */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderBottom: `1px solid ${DARK}`, height: '48px', marginBottom: '10px', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            {firmaDirectorUrl && (
              <img
                src={firmaDirectorUrl}
                alt="Firma director"
                style={{ maxHeight: '44px', maxWidth: '140px', objectFit: 'contain', marginBottom: '4px' }}
              />
            )}
          </div>
          <p style={{ fontSize: '9.5px', fontWeight: '700', margin: '0 0 2px', color: DARK }}>{informe.director_nombre || 'Director'}</p>
          <p style={{ fontSize: '8px', color: GRAY, margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Director Aprobador</p>
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <div style={{
        marginTop: '40px', borderTop: `1px solid ${LBORD}`,
        paddingTop: '15px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '8px', color: LGRAY }}>INMOTIKA S.A.S — Acceso a un mundo diferente</span>
        <span style={{ fontSize: '8px', color: LGRAY }}>Generado el {hoy} · Documento de uso interno</span>
      </div>

    </div>
  );
}
