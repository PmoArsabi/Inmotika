import { useState } from 'react';
import { Cpu, MapPin, Calendar, Activity, Filter, Eye, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import IconButton from '../components/ui/IconButton';
import SectionHeader from '../components/ui/SectionHeader';
import { Subtitle, TextSmall } from '../components/ui/Typography';
import StatusBadge from '../components/ui/StatusBadge';
import InfoField from '../components/ui/InfoField';
import { useClienteData } from '../hooks/useClienteData';

/**
 * Vista de inventario de dispositivos instalados para el usuario con rol CLIENTE.
 * Consume useClienteData() para obtener los dispositivos y sucursales reales del contacto autenticado.
 */

const ClientInventoryPage = () => {
  const { dispositivos, sucursales, loading } = useClienteData();
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [invFilters, setInvFilters] = useState({
    sucursal: '',
    categoria: '',
    fecha: '',
    estado: '',
  });

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-24 bg-gray-100 rounded" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    );
  }

  /**
   * Obtiene el nombre de la sucursal para un dispositivo.
   * @param {object} dev - Dispositivo mapeado.
   * @returns {string}
   */
  const getSucursalNombre = (dev) => {
    const branchId = String(dev.branchId || dev.sucursal_id || '');
    if (!branchId) return dev.sucursal?.nombre || '';
    const found = sucursales.find(s => String(s.id) === branchId);
    return found?.nombre || dev.sucursal?.nombre || '';
  };

  /**
   * Extrae el nombre de la categoría del dispositivo.
   * @param {object} dev - Dispositivo mapeado.
   * @returns {string}
   */
  const getCategoriaNombre = (dev) => {
    // Query directa trae categoria_dispositivo(nombre), masterData trae categoria object
    if (dev.categoria_dispositivo && typeof dev.categoria_dispositivo === 'object') return dev.categoria_dispositivo.nombre || '';
    if (dev.categoria && typeof dev.categoria === 'object') return dev.categoria.nombre || '';
    if (typeof dev.categoria === 'string') return dev.categoria;
    return '';
  };

  /**
   * Extrae el nombre del estado de gestión del dispositivo.
   * @param {object} dev - Dispositivo mapeado.
   * @returns {string}
   */
  const getEstadoNombre = (dev) => {
    // Query directa trae catalogo_estado_gestion(nombre), masterData puede traer estado_gestion object
    if (dev.catalogo_estado_gestion && typeof dev.catalogo_estado_gestion === 'object') return dev.catalogo_estado_gestion.nombre || '';
    if (dev.estado_gestion && typeof dev.estado_gestion === 'object') return dev.estado_gestion.nombre || '';
    if (typeof dev.estado_gestion === 'string') return dev.estado_gestion;
    return '';
  };

  /**
   * Nombre visible del dispositivo: idInmotika > codigoUnico > id
   * @param {object} dev
   * @returns {string}
   */
  const getDeviceNombre = (dev) => {
    return dev.idInmotika || dev.id_inmotika || dev.codigoUnico || dev.codigo_unico || String(dev.id || '');
  };

  // Opciones dinámicas para el filtro de sucursales
  const sucursalOptions = [
    { value: '', label: 'Todas las Sedes' },
    ...sucursales.map(s => ({ value: String(s.id), label: s.nombre })),
  ];

  // Opciones dinámicas para categorías únicas presentes en los dispositivos
  const categoriaOptions = [
    { value: '', label: 'Todas las Categorías' },
    ...Array.from(
      new Map(
        dispositivos
          .map(d => ({ id: d.categoriaId, nombre: getCategoriaNombre(d) }))
          .filter(c => c.id && c.nombre)
          .map(c => [c.id, c])
      ).values()
    ).map(c => ({ value: c.id, label: c.nombre })),
  ];

  // Opciones dinámicas para estados únicos presentes en los dispositivos
  const estadoOptions = [
    { value: '', label: 'Todos los Estados' },
    ...Array.from(
      new Set(
        dispositivos.map(d => getEstadoNombre(d)).filter(Boolean)
      )
    ).map(nombre => ({ value: nombre, label: nombre })),
  ];

  const filteredDevices = dispositivos.filter(dev => {
    const devBranchId = String(dev.branchId || dev.sucursal_id || '');
    const matchSucursal = !invFilters.sucursal || devBranchId === invFilters.sucursal;
    const matchCategoria = !invFilters.categoria || dev.categoriaId === invFilters.categoria;
    const matchFecha = !invFilters.fecha || (dev.fechaProximoMantenimiento || dev.fecha_proximo_mantenimiento || '').startsWith(invFilters.fecha);
    const matchEstado = !invFilters.estado || getEstadoNombre(dev) === invFilters.estado;
    return matchSucursal && matchCategoria && matchFecha && matchEstado;
  });

  // ── Vista de detalle de dispositivo (inline, sin ConfigurationContext) ────
  if (selectedDevice) {
    const d = selectedDevice;
    const categoriaNombre = getCategoriaNombre(d);
    const estadoNombre = getEstadoNombre(d);
    const sucursalNombre = getSucursalNombre(d);
    return (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
        <button
          onClick={() => setSelectedDevice(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#D32F2F] transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a Dispositivos
        </button>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-12 h-12 bg-linear-to-br from-[#D32F2F] to-[#8B0000] rounded-xl flex items-center justify-center shrink-0">
              <Cpu size={20} className="text-white" />
            </div>
            <div>
              <p className="font-black text-gray-900 text-base">
                {d.id_inmotika || d.idInmotika || d.codigo_unico || d.codigoUnico || 'Dispositivo'}
              </p>
              <p className="text-xs text-[#D32F2F] font-bold uppercase tracking-widest">{categoriaNombre || 'Sin categoría'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField label="ID Inmotika"         value={d.id_inmotika || d.idInmotika}                                   icon={Cpu} />
            <InfoField label="Código Único"        value={d.codigo_unico || d.codigoUnico}                                  icon={Cpu} />
            <InfoField label="Serial"              value={d.serial}                                                          icon={Cpu} />
            <InfoField label="Modelo"              value={d.modelo}                                                          icon={Cpu} />
            <InfoField label="Línea"               value={d.linea}                                                           icon={Cpu} />
            <InfoField label="MAC Address"         value={d.mac_address || d.macAddress}                                     icon={Cpu} />
            <InfoField label="Categoría"           value={categoriaNombre}                                                    icon={Activity} />
            <InfoField label="Estado"              value={estadoNombre}                                                       icon={Activity} />
            <InfoField label="Sede"                value={sucursalNombre}                                                     icon={MapPin} />
            <InfoField label="Próx. Mantenimiento" value={d.fecha_proximo_mantenimiento || d.fechaProximoMantenimiento}       icon={Calendar} />
            <InfoField label="Frecuencia Mant."    value={d.frecuencia_mantenimiento_meses ? `${d.frecuencia_mantenimiento_meses} meses` : null} icon={Calendar} />
          </div>

          {(d.notas_tecnicas || d.notasTecnicas) && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Notas Técnicas</p>
              <p className="text-sm text-gray-600">{d.notas_tecnicas || d.notasTecnicas}</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-right-12 duration-500">
      <SectionHeader title="Inventario Instalado" subtitle="Equipos gestionados bajo contrato" />

      <Card className="p-4 bg-gray-50 border-none shadow-inner mb-4">
        <div className="flex items-center gap-2 mb-3 text-[#D32F2F]">
          <Filter size={16} />
          <TextSmall className="font-bold uppercase tracking-[0.25em] text-[#D32F2F]">Filtros de Inventario</TextSmall>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select
            label="Sucursal"
            icon={MapPin}
            value={invFilters.sucursal}
            onChange={(e) => setInvFilters({ ...invFilters, sucursal: e.target.value })}
            options={sucursalOptions}
          />
          <Select
            label="Categoría de Equipo"
            icon={Cpu}
            value={invFilters.categoria}
            onChange={(e) => setInvFilters({ ...invFilters, categoria: e.target.value })}
            options={categoriaOptions}
          />
          <Input
            label="Fecha Próx. Mantenimiento"
            type="date"
            icon={Calendar}
            value={invFilters.fecha}
            onChange={(e) => setInvFilters({ ...invFilters, fecha: e.target.value })}
          />
          <Select
            label="Estado Actual"
            icon={Activity}
            value={invFilters.estado}
            onChange={(e) => setInvFilters({ ...invFilters, estado: e.target.value })}
            options={estadoOptions}
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
        <Table>
          <THead variant="light">
            <tr>
              <Th>Equipo / Código</Th>
              <Th>Sede y Categoría</Th>
              <Th>Estado / Próx. Mant.</Th>
              <Th align="right">Acción</Th>
            </tr>
          </THead>
          <TBody>
            {filteredDevices.length > 0 ? (
              filteredDevices.map((dev) => (
                <Tr key={dev.id}>
                  <Td>
                    <Subtitle className="text-[#D32F2F] normal-case tracking-normal">
                      {getDeviceNombre(dev)}
                    </Subtitle>
                    <TextSmall className="text-gray-400 mt-0.5">{dev.codigoUnico || dev.idInmotika || ''}</TextSmall>
                  </Td>
                  <Td>
                    <Subtitle className="text-gray-700 normal-case tracking-normal">
                      {getCategoriaNombre(dev) || 'Sin categoría'}
                    </Subtitle>
                    <TextSmall className="text-gray-400 mt-0.5">{getSucursalNombre(dev)}</TextSmall>
                  </Td>
                  <Td>
                    <div className="mb-0.5">
                      <StatusBadge status={getEstadoNombre(dev) || 'Activo'} />
                    </div>
                    <TextSmall className="text-gray-400">
                      {dev.fechaProximoMantenimiento || dev.fecha_proximo_mantenimiento || '—'}
                    </TextSmall>
                  </Td>
                  <Td align="right">
                    <IconButton
                      icon={Eye}
                      className="text-gray-300 hover:text-[#D32F2F]"
                      onClick={() => setSelectedDevice(dev)}
                    />
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={4} className="text-center py-8">
                  <TextSmall className="text-gray-400 italic">No se encontraron equipos con estos filtros</TextSmall>
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </Card>
    </div>
  );
};

export default ClientInventoryPage;
