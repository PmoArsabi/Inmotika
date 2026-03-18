import React from 'react';
import { Cpu } from 'lucide-react';
import GenericListView from '../../components/shared/GenericListView';
import { Subtitle, TextSmall } from '../../components/ui/Typography';
import { deleteDevice } from '../../api/deviceApi';
import { useMasterData } from '../../context/MasterDataContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useNotify } from '../../context/NotificationContext';
import { useActivoInactivo } from '../../hooks/useCatalog';

const DevicesView = ({ config, data: masterData }) => {
  const { handleView, handleEdit, handleNew } = config;
  const { setData } = useMasterData();
  const confirm = useConfirm();
  const notify = useNotify();
  const { activoId, inactivoId } = useActivoInactivo();

  // Filter by active state
  const devices = (masterData.dispositivos || []).filter(d => 
    !activoId || d.estado_id === activoId || d.estadoId === activoId
  );

  const handleDelete = async (dev) => {
    const confirmed = await confirm({
      title: '¿Eliminar dispositivo?',
      message: `¿Estás seguro de eliminar el dispositivo con serie "${dev.serial}"?`,
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (confirmed) {
      try {
        await deleteDevice(dev.id, inactivoId);
        setData(prev => ({
          ...prev,
          dispositivos: prev.dispositivos.map(d => 
            d.id === dev.id ? { ...d, estado_id: inactivoId, estadoId: inactivoId } : d
          )
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
          {dev.modelo && (
            <TextSmall className="text-gray-500 mt-0.5">
              {dev.modelo}
            </TextSmall>
          )}
        </>
      )
    },
    {
      header: 'Marca / Línea',
      render: (dev) => (
        <TextSmall className="text-gray-700 font-bold uppercase">
          {dev.marca?.nombre || dev.marca || '—'} {dev.linea ? `— ${dev.linea}` : ''}
        </TextSmall>
      )
    },
    {
      header: 'Serial / Código',
      render: (dev) => (
        <TextSmall className="text-gray-600">
          {dev.serial || dev.codigoUnico || '—'}
        </TextSmall>
      )
    },
    {
      header: 'Proveedor',
      render: (dev) => (
        <TextSmall className="text-gray-600">
          {dev.proveedor?.nombre || dev.proveedor || '—'}
        </TextSmall>
      )
    }
  ];

  const filterFunction = (dev, q) => (
    (dev.nombre || '').toLowerCase().includes(q) ||
    (dev.marca || '').toLowerCase().includes(q) ||
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
      searchPlaceholder="Buscar: Nombre / Marca / Serial"
      filterFunction={filterFunction}
    />
  );
};

export default DevicesView;
