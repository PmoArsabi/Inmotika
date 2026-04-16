import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClipboardCheck, CheckCircle2, XCircle, AlertCircle, Send,
  ChevronLeft, Building2, Calendar, Tag,
} from 'lucide-react';
import GenericListView from '../../components/shared/GenericListView';
import FilterBar from '../../components/shared/FilterBar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ActionResultModal from '../../components/ui/ActionResultModal';
import { TextSmall, TextTiny, H3 } from '../../components/ui/Typography';
import { useAuth } from '../../context/AuthContext';
import {
  getInformesEnRevision,
  getRevisionesCoordinador,
  upsertRevisionCoordinador,
  enviarInformeADirector,
} from '../../api/informeApi';
import { supabase } from '../../utils/supabase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ─── Estado badge ─────────────────────────────────────────────────────────────

const EstadoBadge = ({ estado }) => {
  const cfg = {
    EN_REVISION: { label: 'En revisión',            cls: 'bg-yellow-100 text-yellow-800' },
    RECHAZADO:   { label: 'Rechazado por director',  cls: 'bg-red-100 text-red-800'      },
  }[estado] || { label: estado, cls: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ─── Panel de revisión por dispositivo ───────────────────────────────────────

const RevisionPanel = ({
  informe,
  intervenciones,
  revisiones,
  onRevision,
  onEnviarDirector,
  onBack,
  saving,
  sending,
}) => {
  const [notaModal, setNotaModal] = useState(null);
  const [notaInput, setNotaInput] = useState('');

  const todasRevisadas = intervenciones.length > 0
    && intervenciones.every(i => revisiones.has(i.id));

  const handleOpenNota = (intervencionId) => {
    const existing = revisiones.get(intervencionId);
    setNotaInput(existing?.nota || '');
    setNotaModal({ intervencionId });
  };

  const handleConfirmarRechazo = () => {
    if (!notaModal) return;
    onRevision(notaModal.intervencionId, false, notaInput || null);
    setNotaModal(null);
    setNotaInput('');
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
      {/* Header de vuelta */}
      <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200">
        <div className="bg-linear-to-r from-[#D32F2F] via-[#B71C1C] to-[#8B0000] px-5 py-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 bg-white/20 rounded-lg border border-white/30 hover:bg-white/30 transition-colors"
            >
              <ChevronLeft size={16} className="text-white" />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30 shrink-0">
                <ClipboardCheck size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-base leading-tight drop-shadow-sm uppercase truncate">
                  {informe.cliente_nombre}
                </p>
                <p className="text-white/80 text-xs mt-0.5">
                  {informe.sucursal_nombre} · {informe.tipo_visita} · {fmt(informe.fecha_fin)}
                </p>
              </div>
            </div>
            <div className="ml-auto shrink-0">
              <EstadoBadge estado={informe.estado} />
            </div>
          </div>
        </div>
      </div>

      {/* Observación del director si fue rechazado */}
      {informe.estado === 'RECHAZADO' && informe.observacion_director && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <TextSmall className="font-bold text-red-700">El director rechazó este informe</TextSmall>
            <TextTiny className="text-red-600 mt-0.5">{informe.observacion_director}</TextTiny>
          </div>
        </div>
      )}

      {/* Lista de dispositivos */}
      <Card className="p-0 overflow-hidden border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Dispositivo</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Categoría</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Observación técnico</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Nota rechazo</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {intervenciones.map((interv) => {
              const rev = revisiones.get(interv.id);
              const aprobado = rev?.aprobado === true;
              const rechazado = rev?.aprobado === false;
              const disp = interv.dispositivo;
              const label = disp?.serial || disp?.codigo_unico || disp?.id_inmotika || interv.id.slice(0, 8);
              const categoria = disp?.categoria?.nombre || '—';

              return (
                <tr key={interv.id} className={`hover:bg-gray-50 transition-colors ${aprobado ? 'bg-green-50/40' : rechazado ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <TextSmall className="font-bold text-gray-900">{label}</TextSmall>
                  </td>
                  <td className="px-4 py-3">
                    <TextTiny className="text-gray-500">{categoria}</TextTiny>
                  </td>
                  <td className="px-4 py-3">
                    <TextTiny className="text-gray-500 italic">{interv.observacion_final || '—'}</TextTiny>
                  </td>
                  <td className="px-4 py-3">
                    {rechazado && rev?.nota
                      ? <TextTiny className="text-red-600">{rev.nota}</TextTiny>
                      : <TextTiny className="text-gray-300">—</TextTiny>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => onRevision(interv.id, true, null)}
                        title="Aprobar"
                        className={`p-1.5 rounded-lg transition-colors ${aprobado
                          ? 'bg-green-100 text-green-600'
                          : 'hover:bg-green-50 text-gray-300 hover:text-green-500'}`}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleOpenNota(interv.id)}
                        title="Rechazar"
                        className={`p-1.5 rounded-lg transition-colors ${rechazado
                          ? 'bg-red-100 text-red-600'
                          : 'hover:bg-red-50 text-gray-300 hover:text-red-500'}`}
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Progreso y botón enviar */}
      <div className="flex items-center justify-between">
        <TextSmall className="text-gray-500">
          {revisiones.size} de {intervenciones.length} dispositivos revisados
          {revisiones.size > 0 && (
            <> · {[...revisiones.values()].filter(r => r.aprobado).length} aprobados,{' '}
            {[...revisiones.values()].filter(r => !r.aprobado).length} rechazados</>
          )}
        </TextSmall>
        {todasRevisadas && (
          <Button
            variant="primary"
            disabled={sending}
            onClick={onEnviarDirector}
          >
            <Send size={14} />
            {sending ? 'Enviando…' : 'Enviar al director'}
          </Button>
        )}
      </div>

      {/* Modal nota de rechazo */}
      {notaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm p-5 space-y-4">
            <H3 className="text-sm font-bold text-gray-900">Nota de rechazo (opcional)</H3>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              rows={3}
              placeholder="Describe el motivo del rechazo…"
              value={notaInput}
              onChange={(e) => setNotaInput(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setNotaModal(null)}>Cancelar</Button>
              <Button variant="danger" onClick={handleConfirmarRechazo}>Confirmar rechazo</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const ValidacionInformePage = () => {
  const { user } = useAuth();
  const coordinadorId = user?.id;

  const [informes, setInformes]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [selected, setSelected]               = useState(null);
  const [intervenciones, setIntervenciones]   = useState([]);
  const [revisiones, setRevisiones]           = useState(new Map());
  const [loadingDetail, setLoadingDetail]     = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [sending, setSending]                 = useState(false);
  const [resultModal, setResultModal]         = useState(null);
  const [filters, setFilters]                 = useState({ estado: [], cliente: [], sucursal: [], fechaDesde: '', fechaHasta: '' });

  const loadInformes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInformesEnRevision();
      setInformes(data);
    } catch (err) {
      console.error('[ValidacionInformePage]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInformes(); }, [loadInformes]);

  // ── Opciones para filtros ─────────────────────────────────────────────────
  const filterDefs = useMemo(() => {
    const clientes = [...new Map(informes.map(i => [i.cliente_nombre, i.cliente_nombre])).entries()]
      .map(([v]) => ({ value: v, label: v }));
    const sucursales = [...new Map(informes.map(i => [i.sucursal_nombre, { nombre: i.sucursal_nombre, cliente: i.cliente_nombre }])).entries()]
      .map(([v, d]) => ({ value: v, label: v, parentValue: d.cliente }));
    return [
      {
        key: 'estado',
        label: 'Estado',
        multi: true,
        options: [
          { value: 'EN_REVISION', label: 'En revisión' },
          { value: 'RECHAZADO',   label: 'Rechazado por director' },
        ],
      },
      {
        key: 'cliente',
        label: 'Cliente',
        multi: true,
        options: clientes,
      },
      {
        key: 'sucursal',
        label: 'Sucursal',
        multi: true,
        options: sucursales,
        dependsOn: 'cliente',
        dependsOnLabel: 'Cliente',
      },
      { key: 'fechaDesde', label: 'Fecha desde', type: 'date', dateRole: 'desde', linkedTo: 'fechaHasta' },
      { key: 'fechaHasta', label: 'Fecha hasta', type: 'date', dateRole: 'hasta', linkedTo: 'fechaDesde' },
    ];
  }, [informes]);

  const informesFiltrados = useMemo(() => {
    return informes.filter(inf => {
      if (filters.estado?.length && !filters.estado.includes(inf.estado)) return false;
      if (filters.cliente?.length && !filters.cliente.includes(inf.cliente_nombre)) return false;
      if (filters.sucursal?.length && !filters.sucursal.includes(inf.sucursal_nombre)) return false;
      if (filters.fechaDesde && inf.fecha_fin && inf.fecha_fin < filters.fechaDesde) return false;
      if (filters.fechaHasta && inf.fecha_fin && inf.fecha_fin > filters.fechaHasta + 'T23:59:59') return false;
      return true;
    });
  }, [informes, filters]);

  const activeFiltersCount = (filters.estado?.length || 0) + (filters.cliente?.length || 0)
    + (filters.sucursal?.length || 0) + (filters.fechaDesde ? 1 : 0) + (filters.fechaHasta ? 1 : 0);

  // ── Columnas para GenericListView ─────────────────────────────────────────
  const columns = useMemo(() => [
    {
      header: 'Cliente / Sucursal',
      render: (inf) => (
        <div>
          <TextSmall className="font-bold text-gray-900">{inf.cliente_nombre}</TextSmall>
          <TextTiny className="text-gray-400 flex items-center gap-1 mt-0.5">
            <Building2 size={10} />
            {inf.sucursal_nombre}{inf.sucursal_ciudad ? ` · ${inf.sucursal_ciudad}` : ''}
          </TextTiny>
        </div>
      ),
    },
    {
      header: 'Tipo',
      render: (inf) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold">
          <Tag size={10} />
          {inf.tipo_visita}
        </span>
      ),
    },
    {
      header: 'Fecha cierre',
      render: (inf) => (
        <TextSmall className="flex items-center gap-1.5 text-gray-600">
          <Calendar size={12} className="text-gray-400" />
          {fmt(inf.fecha_fin)}
        </TextSmall>
      ),
    },
    {
      header: 'Estado',
      render: (inf) => <EstadoBadge estado={inf.estado} />,
    },
    {
      header: 'Progreso',
      render: (inf) => {
        const pct = inf.total_intervenciones > 0
          ? Math.round((inf.revisadas / inf.total_intervenciones) * 100) : 0;
        return (
          <div className="flex items-center gap-2 min-w-24">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-yellow-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <TextTiny className="text-gray-500 shrink-0">{inf.revisadas}/{inf.total_intervenciones}</TextTiny>
          </div>
        );
      },
    },
    {
      header: 'Obs. director',
      render: (inf) => inf.observacion_director
        ? <TextTiny className="text-red-600 max-w-48 truncate">{inf.observacion_director}</TextTiny>
        : <TextTiny className="text-gray-300">—</TextTiny>,
    },
  ], []);

  // ── Selección de informe ──────────────────────────────────────────────────
  const handleSelectInforme = async (informe) => {
    setSelected(informe);
    setLoadingDetail(true);
    try {
      const [{ data: intData }, revData] = await Promise.all([
        supabase
          .from('intervencion')
          .select(`
            id, observacion_final,
            dispositivo:dispositivo_id(
              id, serial, codigo_unico, id_inmotika,
              categoria:categoria_id(nombre)
            )
          `)
          .eq('visita_id', informe.visita_id)
          .eq('activo', true),
        getRevisionesCoordinador(informe.id),
      ]);
      setIntervenciones(intData || []);
      const map = new Map();
      for (const r of revData) map.set(r.intervencion_id, { aprobado: r.aprobado, nota: r.nota });
      setRevisiones(map);
    } catch (err) {
      console.error('[ValidacionInformePage] detalle:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRevision = async (intervencionId, aprobado, nota) => {
    if (!selected || !coordinadorId) return;
    setSaving(true);
    try {
      await upsertRevisionCoordinador(selected.id, intervencionId, coordinadorId, aprobado, nota);
      setRevisiones(prev => {
        const next = new Map(prev);
        next.set(intervencionId, { aprobado, nota });
        return next;
      });
    } catch (err) {
      setResultModal({ error: true, title: 'Error al guardar', errorMessage: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarDirector = async () => {
    if (!selected) return;
    setSending(true);
    try {
      const { data: coordRow } = await supabase
        .from('coordinador')
        .select('coordinador_director(director:director_id(perfil:usuario_id(email)))')
        .eq('usuario_id', coordinadorId)
        .eq('activo', true)
        .maybeSingle();

      const directorEmails = (coordRow?.coordinador_director || [])
        .map(cd => cd.director?.perfil?.email).filter(Boolean);

      const { data: coordPerfil } = await supabase
        .from('perfil_usuario')
        .select('nombres, apellidos')
        .eq('id', coordinadorId)
        .maybeSingle();

      const coordNombre = coordPerfil
        ? `${coordPerfil.nombres || ''} ${coordPerfil.apellidos || ''}`.trim()
        : 'Coordinador';

      await enviarInformeADirector(selected.id, {
        directorEmails,
        clienteNombre: selected.cliente_nombre,
        sucursalNombre: selected.sucursal_nombre,
        tipoVisita: selected.tipo_visita,
        coordinadorNombre: coordNombre,
        appUrl: window.location.origin,
      });

      setResultModal({
        error: false,
        title: 'Informe enviado al director',
        subtitle: directorEmails.length
          ? `Se notificó a ${directorEmails.length} director(es). Tienen 2 horas para responder.`
          : 'El informe fue marcado como enviado.',
      });
      setSelected(null);
      loadInformes();
    } catch (err) {
      setResultModal({ error: true, title: 'Error al enviar', errorMessage: err.message });
    } finally {
      setSending(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (selected) {
    return (
      <div className="space-y-4 animate-in slide-in-from-right-12 duration-500">
        {loadingDetail ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-16 bg-gray-100 rounded-lg" />
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : (
          <RevisionPanel
            informe={selected}
            intervenciones={intervenciones}
            revisiones={revisiones}
            onRevision={handleRevision}
            onEnviarDirector={handleEnviarDirector}
            onBack={() => setSelected(null)}
            saving={saving}
            sending={sending}
          />
        )}
        <ActionResultModal
          open={!!resultModal}
          error={resultModal?.error || false}
          title={resultModal?.title || ''}
          subtitle={resultModal?.subtitle || ''}
          errorMessage={resultModal?.errorMessage}
          actions={[{ label: 'Cerrar', onClick: () => setResultModal(null) }]}
          onBackdropClick={() => setResultModal(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-right-12 duration-500">
      <GenericListView
        title="Validación de Informes"
        icon={ClipboardCheck}
        items={informesFiltrados}
        columns={columns}
        loading={loading}
        loadingText="Cargando informes…"
        emptyText="No hay informes pendientes de revisión"
        emptyIcon={ClipboardCheck}
        searchPlaceholder="Buscar por cliente o sucursal…"
        filterFunction={(inf, q) =>
          inf.cliente_nombre.toLowerCase().includes(q) ||
          inf.sucursal_nombre.toLowerCase().includes(q)
        }
        onView={handleSelectInforme}
        activeFiltersCount={activeFiltersCount}
        filteredCount={informesFiltrados.length}
        totalItems={informes.length}
        onClearFilters={() => setFilters({ estado: [], cliente: [], sucursal: [], fechaDesde: '', fechaHasta: '' })}
        extraFilters={
          <FilterBar
            filters={filterDefs}
            values={filters}
            onChange={setFilters}
          />
        }
      />

      <ActionResultModal
        open={!!resultModal}
        error={resultModal?.error || false}
        title={resultModal?.title || ''}
        subtitle={resultModal?.subtitle || ''}
        errorMessage={resultModal?.errorMessage}
        actions={[{ label: 'Cerrar', onClick: () => setResultModal(null) }]}
        onBackdropClick={() => setResultModal(null)}
      />
    </div>
  );
};

export default ValidacionInformePage;
