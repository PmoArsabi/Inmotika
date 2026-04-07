import React, { useState, useMemo } from 'react';
import { Cpu } from 'lucide-react';
import GenericListView from '../../components/shared/GenericListView';
import FilterBar from '../../components/shared/FilterBar';
import { Subtitle, TextSmall } from '../../components/ui/Typography';
import { deleteDevice } from '../../api/deviceApi';
import { useMasterData } from '../../context/MasterDataContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useNotify } from '../../context/NotificationContext';
import { useActivoInactivo } from '../../hooks/useCatalog';

/** Extrae el nombre de un campo que puede ser string u objeto { nombre } */
const getName = (val) => (typeof val === 'object' ? val?.nombre : val) || '';

const DevicesView = ({ config, data: masterData }) => {
  const { handleView, handleEdit, handleNew } = config;
  const { setData } = useMasterData();
  const confirm = useConfirm();
  const notify = useNotify();
  const { activoId, inactivoId } = useActivoInactivo();

  const [filters, setFilters] = useState({ categoria: [], marca: [], proveedor: [], fechaDesde: '', fechaHasta: '' });

  // Dispositivos activos (base)
  const allDevices = useMemo(
    () => (masterData.dispositivos || []).filter(d =>
      !activoId || d.estado_id === activoId || d.estadoId === activoId
    ),
    [masterData.dispositivos, activoId]
  );

  const categoriaOptions = useMemo(() => {
    const seen = new Set();
    return allDevices
      .map(d => getName(d.categoria))
      .filter(n => n && !seen.has(n) && seen.add(n))
      .sort()
      .map(n => ({ value: n, label: n }));
  }, [allDevices]);

  const marcaOptions = useMemo(() => {
    const seen = new Set();
    return allDevices
      .map(d => getName(d.marca))
      .filter(n => n && !seen.has(n) && seen.add(n))
      .sort()
      .map(n => ({ value: n, label: n }));
  }, [allDevices]);

  const proveedorOptions = useMemo(() => {
    const seen = new Set();
    return allDevices
      .map(d => getName(d.proveedor))
      .filter(n => n && !seen.has(n) && seen.add(n))
      .sort()
      .map(n => ({ value: n, label: n }));
  }, [allDevices]);

  const filterDefs = [
    { key: 'categoria',  label: 'Categoría',   options: categoriaOptions, multi: true },
    { key: 'marca',      label: 'Marca',        options: marcaOptions,     multi: true },
    { key: 'proveedor',  label: 'Proveedor',    options: proveedorOptions, multi: true },
    { key: 'fechaDesde', label: 'Fecha desde',  type: 'date', dateRole: 'desde', linkedTo: 'fechaHasta' },
    { key: 'fechaHasta', label: 'Fecha hasta',  type: 'date', dateRole: 'hasta', linkedTo: 'fechaDesde' },
  ];

  const devices = useMemo(() => allDevices.filter(d => {
    if (filters.categoria.length > 0 && !filters.categoria.includes(getName(d.categoria))) return false;
    if (filters.marca.length     > 0 && !filters.marca.includes(getName(d.marca)))         return false;
    if (filters.proveedor.length > 0 && !filters.proveedor.includes(getName(d.proveedor))) return false;
    if (filters.fechaDesde && !(d.created_at && d.created_at >= filters.fechaDesde)) return false;
    if (filters.fechaHasta && !(d.created_at && d.created_at <= filters.fechaHasta + 'T23:59:59')) return false;
    return true;
  }), [allDevices, filters]);

  const handleDelete = async (dev) => {
    const confirmed = await confirm({
      title: '¿Eliminar dispositivo?',
      message: `¿Estás seguro de eliminar el dispositivo con serie "${dev.serial}"?`,
      confirmText: 'Eliminar',
      type: 'danger',
    });
    if (confirmed) {
      try {
        await deleteDevice(dev.id, inactivoId);
        setData(prev => ({
          ...prev,
          dispositivos: prev.dispositivos.map(d =>
            d.id === dev.id ? { ...d, estado_id: inactivoId, estadoId: inactivoId } : d
          ),
        }));
        notify('success', 'Dispositivo eliminado correctamente');
      } catch (err) {
        console.error('Error deleting device:', err);
        notify('error', 'Error al eliminar el dispositivo');
      }
    }
  };

  const columns = [
    {
      header: 'Nombre / Modelo',
      render: (dev) => (
        <>
          <Subtitle className="text-gray-900 normal-case tracking-normal">
            {dev.nombre || dev.tipo || dev.modelo || 'Sin nombre'}
          </Subtitle>
          {dev.modelo && <TextSmall className="text-gray-500 mt-0.5">{dev.modelo}</TextSmall>}
        </>
      ),
    },
    {
      header: 'Categoría',
      render: (dev) => <TextSmall className="text-gray-700">{getName(dev.categoria) || '—'}</TextSmall>,
    },
    {
      header: 'Marca / Línea',
      render: (dev) => (
        <TextSmall className="text-gray-700 font-bold uppercase">
          {getName(dev.marca) || '—'}{dev.linea ? ` — ${dev.linea}` : ''}
        </TextSmall>
      ),
    },
    {
      header: 'Serial / Código',
      render: (dev) => <TextSmall className="text-gray-600">{dev.serial || dev.codigoUnico || '—'}</TextSmall>,
    },
    {
      header: 'Proveedor',
      render: (dev) => <TextSmall className="text-gray-600">{getName(dev.proveedor) || '—'}</TextSmall>,
    },
  ];

  const filterFunction = (dev, q) => (
    (dev.nombre || '').toLowerCase().includes(q) ||
    getName(dev.marca).toLowerCase().includes(q) ||
    getName(dev.categoria).toLowerCase().includes(q) ||
    getName(dev.proveedor).toLowerCase().includes(q) ||
    (dev.serial || '').toLowerCase().includes(q) ||
    (dev.codigoUnico || '').toLowerCase().includes(q) ||
    (dev.linea || '').toLowerCase().includes(q)
  );

  return (
    <GenericListView
      title="Información Dispositivos"
      icon={Cpu}
      items={devices}
      columns={columns}
      onNew={() => handleNew('dispositivo')}
      onView={(dev) => handleView(dev, 'dispositivo')}
      onEdit={(dev) => handleEdit(dev, 'dispositivo')}
      onDelete={handleDelete}
      newButtonLabel="Nuevo Dispositivo"
      searchPlaceholder="Nombre / Marca / Serial"
      filterFunction={filterFunction}
      filteredCount={devices.length}
      totalItems={allDevices.length}
      activeFiltersCount={filters.categoria.length + filters.marca.length + filters.proveedor.length + (filters.fechaDesde ? 1 : 0) + (filters.fechaHasta ? 1 : 0)}
      onClearFilters={() => setFilters({ categoria: [], marca: [], proveedor: [], fechaDesde: '', fechaHasta: '' })}
      extraFilters={
        <FilterBar filters={filterDefs} values={filters} onChange={setFilters} />
      }
    />
  );
};

export default DevicesView;
