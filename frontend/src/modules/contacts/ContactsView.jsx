import React from 'react';
import { Users } from 'lucide-react';
import GenericListView from '../../components/shared/GenericListView';
import { Subtitle, TextSmall } from '../../components/ui/Typography';

const ContactsView = ({ config, data }) => {
  const { handleView, handleEdit, handleNew, removeItem } = config;
  const contacts = data.contactos || [];

  const columns = [
    {
      header: 'Nombre',
      render: (ct) => (
        <>
          <Subtitle className="text-gray-900 normal-case tracking-normal">
            {ct.nombres || ct.apellidos ? `${ct.nombres || ''} ${ct.apellidos || ''}`.trim() : 'Sin nombre'}
          </Subtitle>
          {(ct.cargoNombre || ct.cargo) && (
            <TextSmall className="text-gray-500 mt-0.5">
              {ct.cargoNombre || ct.cargo}
            </TextSmall>
          )}
        </>
      )
    },
    {
      header: 'Correo',
      render: (ct) => <TextSmall className="text-gray-700 font-bold">{ct.email || '—'}</TextSmall>
    },
    {
      header: 'Celular',
      render: (ct) => <TextSmall className="text-gray-700 font-bold">{ct.telefonoMovil || '—'}</TextSmall>
    },
    {
      header: 'Cliente / Sucursal',
      render: (ct) => (
        <TextSmall className="text-gray-600">
          {ct.clienteNombre || 'Sin cliente'}{ct.sucursalNombre ? ` / ${ct.sucursalNombre}` : ''}
        </TextSmall>
      )
    }
  ];

  const filterFunction = (ct, q) => (
    (ct.nombres || '').toLowerCase().includes(q) ||
    (ct.apellidos || '').toLowerCase().includes(q) ||
    (ct.email || '').toLowerCase().includes(q) ||
    String(ct.telefonoMovil || '').includes(q) ||
    (ct.clienteNombre || '').toLowerCase().includes(q) ||
    (ct.sucursalNombre || '').toLowerCase().includes(q)
  );

  return (
    <GenericListView
      title="Información Contactos"
      icon={Users}
      items={contacts}
      columns={columns}
      onNew={() => handleNew('contacto')}
      onView={(ct) => handleView(ct, 'contacto')}
      onEdit={(ct) => handleEdit(ct, 'contacto', ct.branchId)}
      onDelete={(ct) => removeItem(ct.id, 'contactos')}
      newButtonLabel="Nuevo Contacto"
      searchPlaceholder="Buscar: Nombre / Email / Celular"
      filterFunction={filterFunction}
    />
  );
};

export default ContactsView;
