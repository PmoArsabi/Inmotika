import React, { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import GenericListView from '../../components/shared/GenericListView';
import FilterBar from '../../components/shared/FilterBar';
import Input from '../../components/ui/Input';
import { Subtitle, TextSmall } from '../../components/ui/Typography';

const ContactsView = ({ config, data }) => {
  const { handleView, handleEdit, handleNew, removeItem } = config;
  const contacts = useMemo(() => data.contactos || [], [data.contactos]);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({ cliente: [], sucursal: [] });
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Opciones únicas de clientes
  const clienteOptions = useMemo(() => {
    const seen = new Set();
    return contacts
      .map(ct => ({ value: String(ct.clientId || ct.clienteId || ct.cliente_id || ''), label: ct.clienteNombre || '' }))
      .filter(o => o.value && o.label && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [contacts]);

  // Sucursales filtradas según clientes seleccionados (cascading).
  // contactsFlat usa `branchId` como identificador de sucursal.
  const sucursalOptions = useMemo(() => {
    const selectedClientes = filters.cliente;
    const seen = new Set();
    return contacts
      .filter(ct => selectedClientes.length === 0 || selectedClientes.includes(String(ct.clientId || ct.clienteId || ct.cliente_id || '')))
      .map(ct => ({
        value: String(ct.branchId || ct.sucursalId || ct.sucursal_id || ''),
        label: ct.sucursalNombre || '',
        parentValue: String(ct.clientId || ct.clienteId || ct.cliente_id || ''),
      }))
      .filter(o => {
        const key = `${o.value}__${o.parentValue}`;
        return o.value && o.label && o.value !== 'null' && !seen.has(key) && seen.add(key);
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [contacts, filters.cliente]);

  const filterDefs = [
    { key: 'cliente',  label: 'Cliente',  options: clienteOptions,  multi: true },
    { key: 'sucursal', label: 'Sucursal', options: sucursalOptions, multi: true, dependsOn: 'cliente', dependsOnLabel: 'un cliente' },
  ];

  // Contactos filtrados por multi-select y rango de fechas (texto lo maneja GenericListView)
  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (filters.cliente.length > 0)
      list = list.filter(ct => filters.cliente.includes(String(ct.clientId || ct.clienteId || ct.cliente_id || '')));
    if (filters.sucursal.length > 0)
      list = list.filter(ct => filters.sucursal.includes(String(ct.branchId || ct.sucursalId || ct.sucursal_id || '')));
    if (fechaDesde)
      list = list.filter(ct => ct.created_at && ct.created_at >= fechaDesde);
    if (fechaHasta)
      list = list.filter(ct => ct.created_at && ct.created_at <= fechaHasta + 'T23:59:59');
    return list;
  }, [contacts, filters, fechaDesde, fechaHasta]);

  const columns = [
    {
      header: 'Nombre',
      render: (ct) => (
        <>
          <Subtitle className="text-gray-900 normal-case tracking-normal">
            {ct.nombres || ct.apellidos ? `${ct.nombres || ''} ${ct.apellidos || ''}`.trim() : 'Sin nombre'}
          </Subtitle>
          {(ct.cargoNombre || ct.cargo) && (
            <TextSmall className="text-gray-500 mt-0.5">{ct.cargoNombre || ct.cargo}</TextSmall>
          )}
        </>
      ),
    },
    { header: 'Correo',  render: (ct) => <TextSmall className="text-gray-700 font-bold">{ct.email || '—'}</TextSmall> },
    { header: 'Celular', render: (ct) => <TextSmall className="text-gray-700 font-bold">{ct.telefonoMovil || '—'}</TextSmall> },
    {
      header: 'Cliente / Sucursal',
      render: (ct) => (
        <TextSmall className="text-gray-600">
          {ct.clienteNombre || 'Sin cliente'}{ct.sucursalNombre ? ` / ${ct.sucursalNombre}` : ''}
        </TextSmall>
      ),
    },
  ];

  return (
    <GenericListView
      title="Información Contactos"
      icon={Users}
      items={filteredContacts}
      columns={columns}
      onNew={() => handleNew('contacto')}
      onView={(ct) => handleView(ct, 'contacto')}
      onEdit={(ct) => handleEdit(ct, 'contacto', ct.branchId)}
      onDelete={(ct) => removeItem(ct.id, 'contactos')}
      newButtonLabel="Nuevo Contacto"
      searchPlaceholder="Buscar: Nombre / Email / Celular"
      filterFunction={(ct, q) =>
        (ct.nombres || '').toLowerCase().includes(q) ||
        (ct.apellidos || '').toLowerCase().includes(q) ||
        (ct.email || '').toLowerCase().includes(q) ||
        String(ct.telefonoMovil || '').includes(q)
      }
      extraFilters={
        <>
          <FilterBar
            mode="inline"
            filters={filterDefs}
            values={filters}
            onChange={setFilters}
            totalItems={contacts.length}
            filteredCount={filteredContacts.length}
          />
          <Input
            type="date"
            label="Creado desde"
            value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
            className="min-w-36 flex-1"
          />
          <Input
            type="date"
            label="Creado hasta"
            value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
            className="min-w-36 flex-1"
          />
        </>
      }
    />
  );
};

export default ContactsView;
