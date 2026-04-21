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
 * @param {{ act: object, isLast: boolean }} props
 */
function ActRow({ act, isLast }) {
  const { label, bg, color } = badgeEstado(act.estado);
  return (
    <React.Fragment>
      <tr>
        <td style={{
          padding: '8px 10px',
          borderBottom: isLast && !act.observacion ? 'none' : `1px solid ${LBORD}`,
          fontSize: '9.5px',
          color: DARK,
          lineHeight: '1.4',
        }}>
          {act.descripcion}
        </td>
        <td style={{
          padding: '8px 10px',
          borderBottom: isLast && !act.observacion ? 'none' : `1px solid ${LBORD}`,
          textAlign: 'center',
          width: '80px',
        }}>
          <span style={{ background: bg, color, padding: '2px 8px', borderRadius: '10px', fontSize: '7.5px', fontWeight: '700' }}>
            {label}
          </span>
        </td>
      </tr>
      {act.observacion && act.estado === 'omitida' && (
        <tr>
          <td colSpan={2} style={{
            padding: '4px 10px 8px',
            fontSize: '8.5px',
            color: '#991b1b',
            fontStyle: 'italic',
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
 * @param {{ paso: object, intervencionId: string, renderComentarioPaso: Function|null }} props
 */
function PasoBlock({ paso, intervencionId, renderComentarioPaso }) {
  const completadas = paso.actividades.filter(a => a.estado === 'completada').length;
  const total       = paso.actividades.length;

  const comentarioNode = renderComentarioPaso
    ? renderComentarioPaso(intervencionId, paso.id, paso.paso_protocolo_id, paso.comentarios)
    : null;

  return (
    <div style={{ marginBottom: '12px' }}>
      {/* Encabezado del paso */}
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

      {/* Tabla de actividades */}
      {paso.actividades.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: comentarioNode || paso.comentarios ? '0' : '0' }}>
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
              />
            ))}
          </tbody>
        </table>
      )}

      {/* Comentario técnico: editable (render prop) o estático */}
      {comentarioNode && (
        <div style={{ background: BLUE, padding: '8px 12px', borderRadius: '0 0 4px 4px', fontSize: '9px', color: BLUET, lineHeight: '1.5' }}>
          <strong>Obs. técnico:</strong> {comentarioNode}
        </div>
      )}
      {!comentarioNode && paso.comentarios && (
        <div style={{ background: BLUE, padding: '8px 12px', borderRadius: '0 0 4px 4px', fontSize: '9px', color: BLUET, lineHeight: '1.5' }}>
          <strong>Obs. técnico:</strong> {paso.comentarios}
        </div>
      )}
    </div>
  );
}

/**
 * Tarjeta de un dispositivo.
 * @param {{ dispositivo: object, index: number, renderComentarioPaso: Function|null }} props
 */
function DispositivoBlock({ dispositivo: d, index, renderComentarioPaso }) {
  const fueraDeServicio = !!d.fuera_de_servicio;

  const headerBg    = fueraDeServicio ? RED   : DARK;
  const wrapperBord = fueraDeServicio ? '#fee2e2' : BORD;
  const bodyBg      = fueraDeServicio ? '#fff1f2' : WHITE;

  const infoFields = [
    { label: 'Modelo',      value: d.modelo },
    { label: 'Serial',      value: d.serial },
    { label: 'Línea',       value: d.linea },
    { label: 'Marca',       value: d.marca_nombre },
    { label: 'MAC Address', value: d.mac_address },
    { label: 'Cód. Único',  value: d.codigo_unico },
  ].filter(f => !!f.value);

  return (
    <div style={{
      border: `1px solid ${wrapperBord}`,
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '20px',
    }}>
      {/* Header */}
      <div style={{
        background: headerBg,
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: WHITE,
      }}>
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
          <span style={{ fontWeight: '700', fontSize: '11px' }}>
            {d.nombre || `Dispositivo ${index + 1}`}
          </span>
        </div>
        {fueraDeServicio
          ? <span style={{ fontSize: '8.5px', color: '#ffcccc', fontWeight: '700' }}>⚠ FUERA DE SERVICIO</span>
          : <span style={{ fontSize: '8.5px', color: LGRAY, fontFamily: 'monospace' }}>
              {[d.id_inmotika && `ID: ${d.id_inmotika}`, d.marca_nombre].filter(Boolean).join(' / ')}
            </span>
        }
      </div>

      {/* Cuerpo */}
      <div style={{ padding: '16px', background: bodyBg }}>
        {/* Info técnica */}
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

        {/* Notas técnicas */}
        {d.notas_tecnicas && (
          <div style={{ background: BGRAY, border: `1px solid ${BORD}`, padding: '8px 12px', borderRadius: '4px', fontSize: '9px', color: GRAY, marginBottom: '12px' }}>
            <strong>Notas técnicas:</strong> {d.notas_tecnicas}
          </div>
        )}

        {/* Fuera de servicio */}
        {fueraDeServicio ? (
          <p style={{ margin: '0', color: '#991b1b', fontSize: '10px', lineHeight: '1.5' }}>
            <strong>Diagnóstico de falla:</strong> {d.motivo_fuera_de_servicio || d.observacion_final || '—'}
          </p>
        ) : (
          /* Pasos */
          d.pasos.map(paso => (
            <PasoBlock
              key={paso.id}
              paso={paso}
              intervencionId={d.intervencion_id}
              renderComentarioPaso={renderComentarioPaso}
            />
          ))
        )}

        {/* Evidencias */}
        {(d.fotos.length > 0 || d.foto_etiqueta) && (
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px dashed ${BORD}` }}>
            <p style={{ fontSize: '7.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: GRAY, margin: '0 0 8px' }}>
              Evidencia fotográfica
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {d.foto_etiqueta && (
                <div style={{ width: '150px', border: `1px solid ${BORD}`, borderRadius: '6px', overflow: 'hidden' }}>
                  <img src={d.foto_etiqueta} alt="Etiqueta" style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} crossOrigin="anonymous" />
                  <div style={{ background: BGRAY, padding: '3px 6px', fontSize: '7.5px', color: GRAY, textAlign: 'center' }}>Foto Etiqueta</div>
                </div>
              )}
              {d.fotos.map((url, i) => (
                <div key={i} style={{ width: '150px', border: `1px solid ${BORD}`, borderRadius: '6px', overflow: 'hidden' }}>
                  <img src={url} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} crossOrigin="anonymous" />
                  <div style={{ background: BGRAY, padding: '3px 6px', fontSize: '7.5px', color: GRAY, textAlign: 'center' }}>Foto {i + 1}</div>
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
 * Se renderiza offscreen y html2canvas + jsPDF lo convierte a PDF.
 *
 * @param {{ informe: import('../../api/informeApi').InformeVisita, renderComentarioPaso: Function|null }} props
 */
export default function InformePDFTemplate({ informe, renderComentarioPaso }) {
  const hoy         = fmtFecha(new Date().toISOString());
  const totalDisp   = informe.categorias.reduce((s, c) => s + c.dispositivos.length, 0);

  return (
    <div id="informe-pdf-root" style={{
      fontFamily: "'Inter', 'Segoe UI', Helvetica, sans-serif",
      fontSize: '11px',
      color: DARK,
      background: WHITE,
      width: '794px',
      minHeight: '1123px',
      margin: '0 auto',
      padding: '40px',
    }}>

      {/* ══ CABECERA ══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            <div style={{ width: '4px', height: '32px', background: RED, flexShrink: 0 }} />
            <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0', letterSpacing: '-1px', color: DARK }}>INMOTIKA</h1>
          </div>
          <p style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '2px', color: GRAY, margin: '0 0 0 14px' }}>
            Acceso a un mundo diferente
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'inline-block', background: DARK, color: WHITE, padding: '4px 12px', borderRadius: '4px', fontSize: '9px', fontWeight: '700', marginBottom: '8px' }}>
            INFORME TÉCNICO
          </span>
          <p style={{ fontSize: '10px', color: GRAY, margin: '0' }}>
            Fecha: <span style={{ color: DARK, fontWeight: '700' }}>{hoy}</span>
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

      {/* ══ INSTRUCCIONES / OBSERVACIÓN COORDINADOR ══ */}
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
            />
          ))}
        </div>
      ))}

      {/* ══ FIRMAS ══ */}
      <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ borderBottom: `1px solid ${DARK}`, height: '40px', marginBottom: '10px' }} />
          <p style={{ fontSize: '9px', fontWeight: '700', margin: '0' }}>{informe.tecnicos || 'Técnico Responsable'}</p>
          <p style={{ fontSize: '8px', color: GRAY, margin: '0' }}>Técnico(s) Responsable(s)</p>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ borderBottom: `1px solid ${DARK}`, height: '40px', marginBottom: '10px' }} />
          <p style={{ fontSize: '9px', fontWeight: '700', margin: '0' }}>Firma de Aceptación Cliente</p>
          <p style={{ fontSize: '8px', color: GRAY, margin: '0' }}>Recibido a conformidad</p>
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
