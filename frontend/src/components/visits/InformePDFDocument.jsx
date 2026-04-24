import React from 'react';
import {
  Document, Page, View, Text, Image, StyleSheet,
} from '@react-pdf/renderer';

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

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: DARK,
    backgroundColor: WHITE,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 45,
  },

  // Cabecera
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { alignItems: 'flex-end' },
  headerBadge: { backgroundColor: DARK, color: WHITE, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 3, fontSize: 7.5, fontWeight: 'bold', marginBottom: 6 },
  headerDate: { fontSize: 8, color: GRAY },
  headerDateBold: { fontWeight: 'bold', color: DARK },

  // Datos cliente
  infoBox: { flexDirection: 'row', backgroundColor: BGRAY, borderRadius: 6, padding: 16, borderWidth: 1, borderColor: BORD, marginBottom: 20 },
  infoLeft: { flex: 2, paddingRight: 16 },
  infoRight: { flex: 1, paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: BORD },
  infoSectionTitle: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.8, color: LGRAY, marginBottom: 8, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', marginBottom: 5 },
  infoLabel: { width: 65, fontSize: 8.5, color: GRAY },
  infoValue: { flex: 1, fontSize: 8.5, fontWeight: 'bold', color: DARK },
  infoValueNormal: { flex: 1, fontSize: 8.5, color: DARK },

  // Instrucciones
  instrBox: { backgroundColor: '#fffbeb', borderLeftWidth: 3, borderLeftColor: '#f59e0b', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 3, marginBottom: 22 },
  instrText: { fontSize: 8.5, color: '#92400e', lineHeight: 1.5 },

  // Sección título
  sectionTitle: { fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 1, color: DARK, fontWeight: 'bold', borderBottomWidth: 1.5, borderBottomColor: LBORD, paddingBottom: 6, marginBottom: 12 },
  sectionTitleRed: { color: RED },

  // Categoría separador
  catLabel: { fontSize: 7.5, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.8, color: GRAY, marginBottom: 8, paddingLeft: 5, borderLeftWidth: 2, borderLeftColor: RED },

  // Dispositivo — el wrapper no tiene borde propio para que el partido entre páginas se vea limpio
  deviceWrap: { marginBottom: 16 },
  deviceWrapOOS: {},
  // El header lleva borde lateral+top para que se vea como tarjeta desde arriba
  deviceHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: DARK, paddingVertical: 8, paddingHorizontal: 12,
    borderTopLeftRadius: 5, borderTopRightRadius: 5,
    borderWidth: 1, borderColor: DARK,
  },
  deviceHeaderOOS: { backgroundColor: RED, borderColor: RED },
  deviceNumBadge: { backgroundColor: RED, width: 20, height: 20, borderRadius: 3, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  deviceNumBadgeOOS: { backgroundColor: WHITE, color: RED },
  deviceHeaderText: { color: WHITE, fontWeight: 'bold', fontSize: 10 },
  deviceHeaderSub: { color: LGRAY, fontSize: 7, marginTop: 1 },
  deviceOOSLabel: { color: '#ffcccc', fontSize: 7.5, fontWeight: 'bold' },
  // El body lleva borde lateral+bottom y el fondo, sin radius superior (ya lo tiene el header)
  deviceBody: {
    padding: 12, backgroundColor: WHITE,
    borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
    borderColor: BORD,
    borderBottomLeftRadius: 5, borderBottomRightRadius: 5,
  },
  deviceBodyOOS: { backgroundColor: '#fff1f2', borderColor: '#fee2e2' },

  // Info fields del dispositivo
  deviceFields: { flexDirection: 'row', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: BORD, borderBottomStyle: 'dashed' },
  deviceField: { flex: 1, marginRight: 8 },
  deviceFieldLabel: { fontSize: 6.5, color: LGRAY, textTransform: 'uppercase', marginBottom: 2 },
  deviceFieldValue: { fontSize: 8.5, fontWeight: 'bold', color: DARK },

  // Notas técnicas
  notaBox: { backgroundColor: BGRAY, borderWidth: 1, borderColor: BORD, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 3, marginBottom: 10 },
  notaText: { fontSize: 8, color: GRAY },

  // OOS diagnóstico
  oosDiag: { fontSize: 9, color: '#991b1b', lineHeight: 1.5 },

  // Paso
  pasoWrap: { marginBottom: 10 },
  pasoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  pasoNumCircle: { width: 16, height: 16, backgroundColor: DARK, borderRadius: 8, marginRight: 7, alignItems: 'center', justifyContent: 'center' },
  pasoNumText: { color: WHITE, fontSize: 7, fontWeight: 'bold' },
  pasoDesc: { flex: 1, fontSize: 8.5, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.3, color: DARK },
  pasoCount: { fontSize: 7, color: LGRAY },

  // Tabla actividades
  tableHeader: { flexDirection: 'row', backgroundColor: BGRAY, paddingVertical: 5, paddingHorizontal: 8 },
  tableHeaderCell: { fontSize: 7, color: GRAY, textTransform: 'uppercase', fontWeight: 'bold' },
  tableHeaderCellRight: { width: 70, textAlign: 'center', fontSize: 7, color: GRAY, textTransform: 'uppercase', fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: LBORD, paddingVertical: 5, paddingHorizontal: 8 },
  tableRowLast: { borderBottomWidth: 0 },
  tableCellDesc: { flex: 1, fontSize: 8.5, color: DARK, lineHeight: 1.4 },
  tableCellBadge: { width: 70, alignItems: 'center', justifyContent: 'center' },

  // Badge estado actividad
  badgeOK:      { backgroundColor: '#dcfce7', paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8 },
  badgeOmitida: { backgroundColor: '#fee2e2', paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8 },
  badgeNA:      { backgroundColor: '#f3f4f6', paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8 },
  badgeTextOK:      { fontSize: 6.5, fontWeight: 'bold', color: '#166534' },
  badgeTextOmitida: { fontSize: 6.5, fontWeight: 'bold', color: '#991b1b' },
  badgeTextNA:      { fontSize: 6.5, fontWeight: 'bold', color: '#6b7280' },

  // Observación actividad omitida
  obsActRow: { backgroundColor: '#f0fdf4', paddingVertical: 4, paddingHorizontal: 8, flexDirection: 'row', gap: 5 },
  obsActLabel: { fontSize: 6.5, fontWeight: 'bold', color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 },
  obsActText: { flex: 1, fontSize: 8, color: '#166534', lineHeight: 1.4 },

  // Obs. paso
  obsPasoBox: { backgroundColor: BLUE, paddingVertical: 5, paddingHorizontal: 10, flexDirection: 'row', gap: 5 },
  obsPasoLabel: { fontSize: 6.5, fontWeight: 'bold', color: BLUET, textTransform: 'uppercase', letterSpacing: 0.5 },
  obsPasoText: { flex: 1, fontSize: 8, color: BLUET, lineHeight: 1.4 },

  // Obs. intervención (técnico)
  obsIntBox: { marginTop: 6, backgroundColor: BLUE, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 3 },
  obsIntText: { fontSize: 8.5, color: BLUET, lineHeight: 1.5 },

  // Etiqueta
  etiquetaRow: { marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: BORD, borderTopStyle: 'dashed', flexDirection: 'row', alignItems: 'center', gap: 5 },
  etiquetaLabel: { fontSize: 7, color: LGRAY, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 'bold' },
  etiquetaValue: { fontSize: 8.5, fontWeight: 'bold', color: DARK },

  // Evidencias
  evidSection: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: BORD, borderTopStyle: 'dashed' },
  evidTitle: { fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.8, color: GRAY, marginBottom: 6 },
  evidRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  evidImg: { width: 120, height: 80, objectFit: 'cover', borderRadius: 4, borderWidth: 1, borderColor: BORD },
  evidCaption: { fontSize: 7, color: GRAY, textAlign: 'center', marginTop: 2 },

  // Observaciones coordinador / director
  obsSection: { marginTop: 22, marginBottom: 12 },
  obsSectionAccent: { borderLeftWidth: 3, borderLeftColor: RED, paddingLeft: 10, marginBottom: 7 },
  obsSectionAccentBlue: { borderLeftWidth: 3, borderLeftColor: '#1d4ed8', paddingLeft: 10, marginBottom: 7 },
  obsSectionLabel: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.8, color: GRAY, fontWeight: 'bold' },
  obsSectionBox: { borderWidth: 1, borderColor: BORD, borderRadius: 5, paddingVertical: 9, paddingHorizontal: 11, backgroundColor: BGRAY },
  obsSectionBoxBlue: { borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 5, paddingVertical: 9, paddingHorizontal: 11, backgroundColor: BLUE },
  obsSectionText: { fontSize: 8.5, color: DARK, lineHeight: 1.6 },

  // Firmas
  signaturesRow: { flexDirection: 'row', marginTop: 28, gap: 50 },
  signatureCol: { flex: 1, alignItems: 'center' },
  signatureImgBox: { height: 50, width: '100%', alignItems: 'center', justifyContent: 'flex-end', borderBottomWidth: 1, borderBottomColor: DARK, marginBottom: 8 },
  signatureImg: { maxHeight: 44, objectFit: 'contain' },
  signatureName: { fontSize: 8.5, fontWeight: 'bold', color: DARK, textAlign: 'center', marginBottom: 2 },
  signatureRole: { fontSize: 7, color: GRAY, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },

  // Footer
  footer: { marginTop: 30, paddingTop: 10, borderTopWidth: 1, borderTopColor: LBORD, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: LGRAY },
});

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
 * @returns {{ label: string, wrapStyle: object, textStyle: object }}
 */
function badgeEstado(estado) {
  switch (estado) {
    case 'completada': return { label: 'OK',      wrapStyle: s.badgeOK,      textStyle: s.badgeTextOK };
    case 'omitida':    return { label: 'Omitida', wrapStyle: s.badgeOmitida, textStyle: s.badgeTextOmitida };
    default:           return { label: 'N/A',     wrapStyle: s.badgeNA,      textStyle: s.badgeTextNA };
  }
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

/** @param {{ act: import('../../api/informeApi').ActividadEjecucion, isLast: boolean }} props */
function ActRow({ act, isLast }) {
  const { label, wrapStyle, textStyle } = badgeEstado(act.estado);
  return (
    <View wrap={false}>
      <View style={[s.tableRow, isLast ? s.tableRowLast : null]}>
        <Text style={s.tableCellDesc}>{act.descripcion}</Text>
        <View style={s.tableCellBadge}>
          <View style={wrapStyle}><Text style={textStyle}>{label}</Text></View>
        </View>
      </View>
      {act.estado === 'omitida' && act.observacion ? (
        <View style={s.obsActRow}>
          <Text style={s.obsActLabel}>Obs. actividad:</Text>
          <Text style={s.obsActText}>{act.observacion}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** @param {{ paso: import('../../api/informeApi').PasoEjecucion }} props */
function PasoBlock({ paso }) {
  const completadas = paso.actividades.filter(a => a.estado === 'completada').length;
  return (
    <View style={s.pasoWrap}>
      {/* Header del paso + encabezado de tabla juntos — nunca separar */}
      <View wrap={false}>
        <View style={s.pasoHeader}>
          <View style={s.pasoNumCircle}>
            <Text style={s.pasoNumText}>{paso.orden}</Text>
          </View>
          <Text style={s.pasoDesc}>{paso.descripcion}</Text>
          <Text style={s.pasoCount}>{completadas}/{paso.actividades.length} realizadas</Text>
        </View>
        {paso.actividades.length > 0 && (
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>Actividad Realizada</Text>
            <Text style={s.tableHeaderCellRight}>Estado</Text>
          </View>
        )}
      </View>

      {paso.actividades.map((act, idx) => (
        <ActRow key={act.id} act={act} isLast={idx === paso.actividades.length - 1} />
      ))}

      {paso.comentarios ? (
        <View style={s.obsPasoBox} wrap={false}>
          <Text style={s.obsPasoLabel}>Obs. paso:</Text>
          <Text style={s.obsPasoText}>{paso.comentarios}</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * @param {{
 *   dispositivo: import('../../api/informeApi').DispositivoInforme,
 *   index: number,
 * }} props
 */
function DispositivoBlock({ dispositivo: d, index }) {
  const fueraDeServicio = !!d.fuera_de_servicio;

  const dispositivoNombre = [d.modelo, d.marca_nombre].filter(Boolean).join(' · ')
    || d.codigo_unico
    || d.categoria_nombre
    || `Dispositivo ${index + 1}`;

  const infoFields = [
    { label: 'ID Inmotika', value: d.id_inmotika },
    { label: 'Cód. Único',  value: d.codigo_unico },
    { label: 'Serial',      value: d.serial },
    { label: 'Línea',       value: d.linea },
    { label: 'MAC Address', value: d.mac_address },
    { label: 'Categoría',   value: d.categoria_nombre },
  ].filter(f => !!f.value);

  const fotoEtiquetaUrl = d.foto_etiqueta?.signedUrl || (typeof d.foto_etiqueta === 'string' ? d.foto_etiqueta : null);
  const fotosUrls = (d.fotos || []).map(f => (typeof f === 'string' ? f : f?.signedUrl)).filter(Boolean);

  return (
    <View style={[s.deviceWrap, fueraDeServicio ? s.deviceWrapOOS : null]}>
      {/* Header + info fields juntos — nunca separar el encabezado del dispositivo */}
      <View wrap={false}>
      <View style={[s.deviceHeader, fueraDeServicio ? s.deviceHeaderOOS : null]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[s.deviceNumBadge, fueraDeServicio ? s.deviceNumBadgeOOS : null]}>
            <Text style={{ color: fueraDeServicio ? RED : WHITE, fontSize: 8, fontWeight: 'bold', textAlign: 'center' }}>
              {String(index + 1).padStart(2, '0')}
            </Text>
          </View>
          <View>
            <Text style={s.deviceHeaderText}>{dispositivoNombre}</Text>
            {d.categoria_nombre && (
              <Text style={s.deviceHeaderSub}>{d.categoria_nombre}</Text>
            )}
          </View>
        </View>
        {fueraDeServicio && <Text style={s.deviceOOSLabel}>⚠ FUERA DE SERVICIO</Text>}
      </View>
      </View>{/* fin wrap={false} del header */}

      {/* Body */}
      <View style={[s.deviceBody, fueraDeServicio ? s.deviceBodyOOS : null]}>
        {infoFields.length > 0 && (
          <View style={s.deviceFields}>
            {infoFields.map(f => (
              <View key={f.label} style={s.deviceField}>
                <Text style={s.deviceFieldLabel}>{f.label}</Text>
                <Text style={s.deviceFieldValue}>{f.value}</Text>
              </View>
            ))}
          </View>
        )}

        {d.notas_tecnicas ? (
          <View style={s.notaBox}>
            <Text style={s.notaText}><Text style={{ fontWeight: 'bold' }}>Notas técnicas: </Text>{d.notas_tecnicas}</Text>
          </View>
        ) : null}

        {fueraDeServicio ? (
          <Text style={s.oosDiag}>
            <Text style={{ fontWeight: 'bold' }}>Diagnóstico de falla: </Text>
            {d.motivo_fuera_de_servicio || d.observacion_final || '—'}
          </Text>
        ) : (
          <>
            {d.pasos.map(paso => <PasoBlock key={paso.id} paso={paso} />)}

            {d.observacion_final ? (
              <View style={s.obsIntBox}>
                <Text style={s.obsIntText}>
                  <Text style={{ fontWeight: 'bold' }}>Obs. del técnico: </Text>
                  {d.observacion_final}
                </Text>
              </View>
            ) : null}
          </>
        )}

        {/* Etiqueta */}
        {d.codigo_etiqueta ? (
          <View style={s.etiquetaRow}>
            <Text style={s.etiquetaLabel}>Etiqueta:</Text>
            <Text style={s.etiquetaValue}>{d.codigo_etiqueta}</Text>
          </View>
        ) : null}

        {/* Evidencias */}
        {(fotoEtiquetaUrl || fotosUrls.length > 0) ? (
          <View style={s.evidSection}>
            <Text style={s.evidTitle}>Evidencia fotográfica</Text>
            <View style={s.evidRow}>
              {fotoEtiquetaUrl ? (
                <View>
                  <Image src={fotoEtiquetaUrl} style={s.evidImg} />
                  <Text style={s.evidCaption}>Foto Etiqueta</Text>
                </View>
              ) : null}
              {fotosUrls.map((url, i) => (
                <View key={i}>
                  <Image src={url} style={s.evidImg} />
                  <Text style={s.evidCaption}>Foto {i + 1}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── Documento principal ──────────────────────────────────────────────────────

/**
 * Documento react-pdf del informe técnico.
 * Solo para generación de PDF — sin interactividad.
 *
 * @param {{
 *   informe: import('../../api/informeApi').InformeVisita & {
 *     observacion_coordinador?: string|null,
 *     observacion_director?: string|null,
 *     coordinador_nombre?: string|null,
 *     director_nombre?: string|null,
 *   },
 *   firmaCoordinadorUrl?: string|null,
 *   firmaDirectorUrl?: string|null,
 * }} props
 */
export default function InformePDFDocument({ informe, firmaCoordinadorUrl = null, firmaDirectorUrl = null }) {
  const hoy       = fmtFecha(new Date().toISOString());
  const totalDisp = informe.categorias.reduce((s, c) => s + c.dispositivos.length, 0);

  return (
    <Document title={`Informe Técnico — ${informe.cliente_nombre}`} author="Inmotika">
      <Page size="A4" style={s.page}>

        {/* ══ CABECERA ══ */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Image
              src={import.meta.env.VITE_LOGO_URL}
              style={{ width: 130, height: 40, objectFit: 'contain' }}
            />
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerBadge}>INFORME TÉCNICO</Text>
            <Text style={s.headerDate}>
              Fecha: <Text style={s.headerDateBold}>{hoy}</Text>
            </Text>
          </View>
        </View>

        {/* ══ DATOS CLIENTE + CRONOGRAMA ══ */}
        <View style={s.infoBox}>
          {/* Izquierda: cliente */}
          <View style={s.infoLeft}>
            <Text style={s.infoSectionTitle}>Detalles del Cliente</Text>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Cliente:</Text>
              <Text style={s.infoValue}>{informe.cliente_nombre}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Sede:</Text>
              <Text style={s.infoValueNormal}>{informe.sucursal_nombre}</Text>
            </View>
            {informe.sucursal_ciudad ? (
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Ciudad:</Text>
                <Text style={s.infoValueNormal}>
                  {informe.sucursal_ciudad}{informe.sucursal_direccion ? ` — ${informe.sucursal_direccion}` : ''}
                </Text>
              </View>
            ) : null}
            {informe.cliente_nit ? (
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>NIT:</Text>
                <Text style={s.infoValueNormal}>{informe.cliente_nit}</Text>
              </View>
            ) : null}
            {informe.tecnicos ? (
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Técnico(s):</Text>
                <Text style={s.infoValueNormal}>{informe.tecnicos}</Text>
              </View>
            ) : null}
            {(informe.coordinador_nombre || informe.coordinador) ? (
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Coordinador:</Text>
                <Text style={s.infoValueNormal}>{informe.coordinador_nombre || informe.coordinador}</Text>
              </View>
            ) : null}
          </View>

          {/* Derecha: cronograma */}
          <View style={s.infoRight}>
            <Text style={s.infoSectionTitle}>Cronograma</Text>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Programada:</Text>
              <Text style={s.infoValueNormal}>{fmtFecha(informe.fecha_programada)}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Inicio:</Text>
              <Text style={s.infoValueNormal}>{fmtHora(informe.fecha_inicio)}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Fin:</Text>
              <Text style={s.infoValueNormal}>{fmtHora(informe.fecha_fin)}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Tipo:</Text>
              <Text style={s.infoValueNormal}>{informe.tipo_visita}</Text>
            </View>
          </View>
        </View>

        {/* ══ INSTRUCCIONES ══ */}
        {informe.instrucciones ? (
          <View style={s.instrBox}>
            <Text style={s.instrText}>
              <Text style={{ fontWeight: 'bold' }}>Instrucciones del Coordinador: </Text>
              {informe.instrucciones}
            </Text>
          </View>
        ) : null}

        {/* ══ TÍTULO EQUIPOS ══ */}
        <Text style={s.sectionTitle}>
          Equipos Intervenidos <Text style={s.sectionTitleRed}>({totalDisp})</Text>
        </Text>

        {/* ══ DISPOSITIVOS POR CATEGORÍA ══ */}
        {informe.categorias.map(cat => (
          <View key={cat.categoria_nombre}>
            {informe.categorias.length > 1 ? (
              <Text style={s.catLabel}>{cat.categoria_nombre}</Text>
            ) : null}
            {cat.dispositivos.map((disp, idx) => (
              <DispositivoBlock key={disp.id} dispositivo={disp} index={idx} />
            ))}
          </View>
        ))}

        {/* ══ OBSERVACIÓN COORDINADOR ══ */}
        {informe.observacion_coordinador ? (
          <View style={s.obsSection}>
            <View style={s.obsSectionAccent}>
              <Text style={s.obsSectionLabel}>Observación del Coordinador</Text>
            </View>
            <View style={s.obsSectionBox}>
              <Text style={s.obsSectionText}>{informe.observacion_coordinador}</Text>
            </View>
          </View>
        ) : null}

        {/* ══ OBSERVACIÓN DIRECTOR ══ */}
        {informe.observacion_director ? (
          <View style={[s.obsSection, { marginTop: 12 }]}>
            <View style={s.obsSectionAccentBlue}>
              <Text style={s.obsSectionLabel}>Observación del Director</Text>
            </View>
            <View style={s.obsSectionBoxBlue}>
              <Text style={s.obsSectionText}>{informe.observacion_director}</Text>
            </View>
          </View>
        ) : null}

        {/* ══ FIRMAS ══ */}
        <View style={s.signaturesRow} wrap={false}>
          <View style={s.signatureCol} wrap={false}>
            <View style={s.signatureImgBox}>
              {firmaCoordinadorUrl ? (
                <Image src={firmaCoordinadorUrl} style={s.signatureImg} />
              ) : null}
            </View>
            <Text style={s.signatureName}>
              {informe.coordinador_nombre || informe.coordinador || 'Coordinador'}
            </Text>
            <Text style={s.signatureRole}>Coordinador Revisor</Text>
          </View>

          <View style={s.signatureCol} wrap={false}>
            <View style={s.signatureImgBox}>
              {firmaDirectorUrl ? (
                <Image src={firmaDirectorUrl} style={s.signatureImg} />
              ) : null}
            </View>
            <Text style={s.signatureName}>{informe.director_nombre || 'Director'}</Text>
            <Text style={s.signatureRole}>Director Aprobador</Text>
          </View>
        </View>

        {/* ══ FOOTER ══ */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>INMOTIKA S.A.S — Acceso a un mundo diferente</Text>
          <Text style={s.footerText}>Generado el {hoy} · Documento de uso interno</Text>
        </View>

      </Page>
    </Document>
  );
}
