import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClipboardCheck, CheckCircle2, XCircle, AlertCircle,
  ChevronLeft, Building2, Calendar, Tag, Clock,
} from 'lucide-react';
import GenericListView from '../../components/shared/GenericListView';
import FilterBar from '../../components/shared/FilterBar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ActionResultModal from '../../components/ui/ActionResultModal';
import { TextSmall, TextTiny, H3 } from '../../components/ui/Typography';
import { useAuth } from '../../context/AuthContext';
import {
  getInformesPendientesDirector,
  getRevisionesCoordinador,
  registrarRevisionDirector,
  aprobarYGenerarPDF,
} from '../../api/informeApi';
import { supabase } from '../../utils/supabase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const tiempoTranscurrido = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `Hace ${h}h ${m}m` : `Hace ${m}m`;
};

const tiempoRestante = (iso) => {
  if (!iso) return null;
  const diff = new Date(iso).getTime() + 2 * 3600000 - Date.now();
  if (diff <= 0) return { label: 'Vencido — se enviará automáticamente', vencido: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return { label: `${h}h ${m}m restantes`, vencido: false };
};

// ─── Badge de tiempo ──────────────────────────────────────────────────────────

const TiempoBadge = ({ enviado_director_at }) => {
  const restante = tiempoRestante(enviado_director_at);
  if (!restante) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${restante.vencido ? 'text-red-600' : 'text-amber-600'}`}>
      <Clock size={10} />
      {restante.label}
    </span>
  );
};

// ─── Panel de revisión del director ──────────────────────────────────────────

const RevisionDirectorPanel = ({
  informe,
  revisiones,
  intervenciones,
  onAprobar,
  onRechazar,
  onBack,
  approving,
  rejecting,
}) => {
  const [obs, setObs] = useState('');
  const [showRechazo, setShowRechazo] = useState(false);

  const revMap = new Map(revisiones.map(r => [r.intervencion_id, r]));

  return (
    <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
      {/* Header */}
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
            <div className="flex items-center gap-3 min-w-0 flex-1">
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
          </div>
        </div>
      </div>

      {/* Alerta de tiempo */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
        <AlertCircle size={15} className="text-amber-600 shrink-0" />
        <TextTiny className="text-amber-700">
          Enviado por el coordinador {tiempoTranscurrido(informe.enviado_director_at)} ·{' '}
          {tiempoRestante(informe.enviado_director_at)?.label}
        </TextTiny>
      </div>

      {/* Tabla de revisiones del coordinador */}
      <Card className="p-0 overflow-hidden border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Dispositivo</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Categoría</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Revisión coordinador</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Nota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {intervenciones.map((interv) => {
              const rev = revMap.get(interv.id);
              const disp = interv.dispositivo;
              const label = disp?.serial || disp?.codigo_unico || disp?.id_inmotika || interv.id.slice(0, 8);
              const categoria = disp?.categoria?.nombre || '—';

              return (
                <tr key={interv.id} className={`hover:bg-gray-50 ${rev?.aprobado ? 'bg-green-50/30' : rev && !rev.aprobado ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <TextSmall className="font-bold text-gray-900">{label}</TextSmall>
                  </td>
                  <td className="px-4 py-3">
                    <TextTiny className="text-gray-500">{categoria}</TextTiny>
                  </td>
                  <td className="px-4 py-3">
                    {rev ? (
                      rev.aprobado
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> Aprobado</span>
                        : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><XCircle size={10} /> Rechazado</span>
                    ) : (
                      <TextTiny className="text-gray-400 italic">Sin revisar</TextTiny>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {rev?.nota
                      ? <TextTiny className="text-red-600">{rev.nota}</TextTiny>
                      : <TextTiny className="text-gray-300">—</TextTiny>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Resumen */}
      <TextSmall className="text-gray-500">
        {informe.aprobadas} aprobados · {informe.rechazadas} rechazados · {informe.total} dispositivos totales
      </TextSmall>

      {/* Acciones */}
      {!showRechazo ? (
        <div className="flex gap-3">
          <Button
            variant="success"
            className="flex-1 justify-center"
            disabled={approving || rejecting}
            onClick={onAprobar}
          >
            <CheckCircle2 size={14} />
            {approving ? 'Aprobando y generando PDF…' : 'Aprobar y generar informe'}
          </Button>
          <Button
            variant="danger"
            className="flex-1 justify-center"
            disabled={approving || rejecting}
            onClick={() => setShowRechazo(true)}
          >
            <XCircle size={14} />
            Rechazar
          </Button>
        </div>
      ) : (
        <Card className="p-4 space-y-3 border border-red-200 bg-red-50">
          <H3 className="text-sm font-bold text-red-700">Motivo del rechazo</H3>
          <textarea
            className="w-full border border-red-200 rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
            rows={3}
            placeholder="Observación general para el coordinador…"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowRechazo(false)}>Cancelar</Button>
            <Button
              variant="danger"
              disabled={rejecting}
              onClick={() => onRechazar(obs || null)}
            >
              {rejecting ? 'Rechazando…' : 'Confirmar rechazo'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const InformeDirectorPage = () => {
  const { user } = useAuth();
  const directorId = user?.id;

  const [informes, setInformes]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selected, setSelected]             = useState(null);
  const [intervenciones, setIntervenciones] = useState([]);
  const [revisiones, setRevisiones]         = useState([]);
  const [loadingDetail, setLoadingDetail]   = useState(false);
  const [approving, setApproving]           = useState(false);
  const [rejecting, setRejecting]           = useState(false);
  const [resultModal, setResultModal]       = useState(null);
  const [filters, setFilters]               = useState({ cliente: [], sucursal: [], fechaDesde: '', fechaHasta: '' });

  const loadInformes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInformesPendientesDirector(directorId);
      setInformes(data);
    } catch (err) {
      console.error('[InformeDirectorPage]', err);
    } finally {
      setLoading(false);
    }
  }, [directorId]);

  useEffect(() => { loadInformes(); }, [loadInformes]);

  const filterDefs = useMemo(() => {
    const clientes = [...new Map(informes.map(i => [i.cliente_nombre, i.cliente_nombre])).entries()]
      .map(([v]) => ({ value: v, label: v }));
    const sucursales = [...new Map(informes.map(i => [i.sucursal_nombre, { nombre: i.sucursal_nombre, cliente: i.cliente_nombre }])).entries()]
      .map(([v, d]) => ({ value: v, label: v, parentValue: d.cliente }));
    return [
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
      if (filters.cliente?.length && !filters.cliente.includes(inf.cliente_nombre)) return false;
      if (filters.sucursal?.length && !filters.sucursal.includes(inf.sucursal_nombre)) return false;
      if (filters.fechaDesde && inf.fecha_fin && inf.fecha_fin < filters.fechaDesde) return false;
      if (filters.fechaHasta && inf.fecha_fin && inf.fecha_fin > filters.fechaHasta + 'T23:59:59') return false;
      return true;
    });
  }, [informes, filters]);

  const activeFiltersCount = (filters.cliente?.length || 0) + (filters.sucursal?.length || 0)
    + (filters.fechaDesde ? 1 : 0) + (filters.fechaHasta ? 1 : 0);

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
      header: 'Revisión coordinador',
      render: (inf) => (
        <TextTiny className="text-gray-600">
          {inf.aprobadas} aprobados · {inf.rechazadas} rechazados · {inf.total} total
        </TextTiny>
      ),
    },
    {
      header: 'Tiempo restante',
      render: (inf) => <TiempoBadge enviado_director_at={inf.enviado_director_at} />,
    },
  ], []);

  const handleSelect = async (informe) => {
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
      setRevisiones(revData);
    } catch (err) {
      console.error('[InformeDirectorPage] detalle:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAprobar = async () => {
    if (!selected) return;
    setApproving(true);
    try {
      await registrarRevisionDirector(selected.id, directorId, 'APROBADO', null);

      const { data: visitaData } = await supabase
        .from('visita')
        .select('sucursal_id, sucursal:sucursal_id(nombre), cliente:cliente_id(razon_social), tipo_visita:tipo_visita_id(nombre), fecha_fin')
        .eq('id', selected.visita_id)
        .maybeSingle();

      let clienteEmails = [];
      if (visitaData?.sucursal_id) {
        const { data: ctRows } = await supabase
          .from('contacto_sucursal')
          .select('contacto:contacto_id(email)')
          .eq('sucursal_id', visitaData.sucursal_id)
          .eq('activo', true);
        clienteEmails = (ctRows || []).map(r => r.contacto?.email).filter(Boolean);
      }

      await aprobarYGenerarPDF(selected.id, selected.visita_id, {
        clienteEmails,
        clienteNombre: visitaData?.cliente?.razon_social || selected.cliente_nombre,
        sucursalNombre: visitaData?.sucursal?.nombre || selected.sucursal_nombre,
        tipoVisita: visitaData?.tipo_visita?.nombre || selected.tipo_visita,
        fechaFin: visitaData?.fecha_fin
          ? new Date(visitaData.fecha_fin).toLocaleDateString('es-ES') : null,
        appUrl: window.location.origin,
      });

      setResultModal({
        error: false,
        title: 'Informe aprobado',
        subtitle: 'El PDF fue generado y el cliente fue notificado por correo.',
      });
      setSelected(null);
      loadInformes();
    } catch (err) {
      setResultModal({ error: true, title: 'Error al aprobar', errorMessage: err.message });
    } finally {
      setApproving(false);
    }
  };

  const handleRechazar = async (observacion) => {
    if (!selected) return;
    setRejecting(true);
    try {
      await registrarRevisionDirector(selected.id, directorId, 'RECHAZADO', observacion);
      setResultModal({
        error: false,
        title: 'Informe rechazado',
        subtitle: 'El coordinador deberá revisar nuevamente el informe con tu observación.',
      });
      setSelected(null);
      loadInformes();
    } catch (err) {
      setResultModal({ error: true, title: 'Error al rechazar', errorMessage: err.message });
    } finally {
      setRejecting(false);
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
          <RevisionDirectorPanel
            informe={selected}
            revisiones={revisiones}
            intervenciones={intervenciones}
            onAprobar={handleAprobar}
            onRechazar={handleRechazar}
            onBack={() => setSelected(null)}
            approving={approving}
            rejecting={rejecting}
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
        title="Aprobación de Informes"
        icon={ClipboardCheck}
        items={informesFiltrados}
        columns={columns}
        loading={loading}
        loadingText="Cargando informes…"
        emptyText="No hay informes pendientes de aprobación"
        emptyIcon={ClipboardCheck}
        searchPlaceholder="Buscar por cliente o sucursal…"
        filterFunction={(inf, q) =>
          inf.cliente_nombre.toLowerCase().includes(q) ||
          inf.sucursal_nombre.toLowerCase().includes(q)
        }
        onView={handleSelect}
        activeFiltersCount={activeFiltersCount}
        filteredCount={informesFiltrados.length}
        totalItems={informes.length}
        onClearFilters={() => setFilters({ cliente: [], sucursal: [], fechaDesde: '', fechaHasta: '' })}
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

export default InformeDirectorPage;
