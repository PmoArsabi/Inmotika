import React from 'react';
import { Cpu } from 'lucide-react';
import GenericListView from '../../components/shared/GenericListView';

const DevicesView = ({ config, data }) => {
  const { handleView, handleEdit, handleNew, removeItem } = config;
  const devices = data.dispositivos || [];

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
          {dev.marca || '—'} {dev.linea ? `— ${dev.linea}` : ''}
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
          {dev.proveedor || '—'}
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
      onDelete={(dev) => removeItem(dev.id, 'dispositivos')}
      newButtonLabel="Nuevo Dispositivo"
      searchPlaceholder="Buscar: Nombre / Marca / Serial"
      filterFunction={filterFunction}
    />
  );
};

export default DevicesView;
