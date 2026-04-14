import { useState } from 'react';
import { Cpu } from 'lucide-react';
import GenericListView from '../components/shared/GenericListView';
import { Subtitle, TextSmall } from '../components/ui/Typography';
import { useClienteData } from '../hooks/useClienteData';
import { ConfigurationProvider } from '../context/ConfigurationContext';
import DeviceNavigator from '../components/configuration/navigators/DeviceNavigator';

/**
 * Vista de inventario de dispositivos instalados para el usuario con rol CLIENTE.
 * Reutiliza la misma visual de GenericListView que el admin (mismas columnas).
 */

/** Extrae el nombre de un campo que puede ser string u objeto { nombre } */
const getName = (val) => (typeof val === 'object' ? val?.nombre : val) || '';

const ClientInventoryPage = () => {
  const { dispositivos, loading } = useClienteData();
  const [selectedDevice, setSelectedDevice] = useState(null);

  // ── Vista de detalle: reutiliza DeviceNavigator en modo view ──────────────
  if (selectedDevice) {
    return (
      <ConfigurationProvider initialParams={{ type: 'dispositivo', deviceId: selectedDevice.id, mode: 'view' }}>
        <DeviceNavigator onBack={() => setSelectedDevice(null)} />
      </ConfigurationProvider>
    );
  }

  const columns = [
    {
      header: 'Serial / Modelo',
      render: (dev) => (
        <>
          <Subtitle className="text-gray-900 normal-case tracking-normal">
            {dev.serial || dev.numero_serie || '—'}
          </Subtitle>
          {dev.modelo && <TextSmall className="text-gray-500 mt-0.5">{dev.modelo}</TextSmall>}
        </>
      ),
    },
    {
      header: 'Categoría',
      render: (dev) => (
        <TextSmall className="text-gray-700">
          {getName(dev.categoria_dispositivo) || getName(dev.categoria) || '—'}
        </TextSmall>
      ),
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
      header: 'ID Inmotika',
      render: (dev) => (
        <TextSmall className="text-gray-600">{dev.id_inmotika || dev.idInmotika || dev.codigoUnico || dev.codigo_unico || '—'}</TextSmall>
      ),
    },
    {
      header: 'Proveedor',
      render: (dev) => (
        <TextSmall className="text-gray-600">{getName(dev.proveedor) || '—'}</TextSmall>
      ),
    },
  ];

  const filterFunction = (dev, q) => (
    (dev.serial || dev.numero_serie || '').toLowerCase().includes(q) ||
    (dev.modelo || '').toLowerCase().includes(q) ||
    getName(dev.categoria_dispositivo).toLowerCase().includes(q) ||
    getName(dev.categoria).toLowerCase().includes(q) ||
    getName(dev.marca).toLowerCase().includes(q) ||
    getName(dev.proveedor).toLowerCase().includes(q) ||
    (dev.id_inmotika || dev.idInmotika || '').toLowerCase().includes(q) ||
    (dev.codigoUnico || dev.codigo_unico || '').toLowerCase().includes(q) ||
    (dev.linea || '').toLowerCase().includes(q)
  );

  return (
    <GenericListView
      title="Inventario Instalado"
      icon={Cpu}
      items={dispositivos}
      columns={columns}
      onView={(dev) => setSelectedDevice(dev)}
      newButtonLabel="Nuevo Dispositivo"
      searchPlaceholder="Serial / Marca / Categoría"
      filterFunction={filterFunction}
      loading={loading}
      loadingText="Cargando dispositivos..."
      emptyText="No se encontraron equipos instalados"
    />
  );
};

export default ClientInventoryPage;
