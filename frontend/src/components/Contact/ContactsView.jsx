import { useState, useMemo } from 'react';
import { Plus, Eye, Edit2, Search, Users, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import Select from '../ui/Select';
import { Table, THead, TBody, Tr, Th, Td } from '../ui/Table';
import { TextSmall, Subtitle } from '../ui/Typography';
import ModuleHeader from '../ui/ModuleHeader';

const ContactsView = ({ config, data }) => {
  const { handleView, handleEdit, handleNew } = config;
  const contacts = data.contactos || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [showFilters, setShowFilters] = useState(false);

  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(ct =>
        (ct.nombre || '').toLowerCase().includes(q) ||
        (ct.email || '').toLowerCase().includes(q) ||
        String(ct.celular || '').includes(q) ||
        (ct.clienteNombre || '').toLowerCase().includes(q) ||
        (ct.sucursalNombre || '').toLowerCase().includes(q)
      );
    }

    // Ordenar por nombre
    result.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    return result;
  }, [contacts, searchQuery]);

  const totalPages = Math.ceil(filteredContacts.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  const handleChangeEntries = (value) => {
    setEntriesPerPage(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 -mt-2">
      {/* Header similar a Clientes */}
      <ModuleHeader
        title="Información Contactos"
        icon={Users}
        onNewClick={() => handleNew('contacto')}
        newButtonLabel="Nuevo Contacto"
        filterContent={
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar: Nombre / Email / Celular"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm w-64"
                />
              </div>
            </div>
          </div>
        }
      />

      {/* Pagination */}
      {filteredContacts.length > 0 && (
        <div className="flex items-center justify-between pt-2 pb-2 border-t border-gray-200">
          <div className="flex items-center gap-1.5">
            <TextSmall className="text-gray-600 text-[10px]">Mostrar</TextSmall>
            <Select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              options={[
                { value: 5, label: '5 Entradas' },
                { value: 10, label: '10 Entradas' },
                { value: 25, label: '25 Entradas' },
                { value: 50, label: '50 Entradas' },
                { value: 100, label: '100 Entradas' },
              ]}
              className="w-24 h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-linear-to-r from-red-500 to-red-700 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {filteredContacts.length === 0 ? (
        <Card className="p-12 text-center">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <Subtitle className="text-gray-500 mb-2">No se encontraron contactos</Subtitle>
          <TextSmall className="text-gray-400">
            {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer contacto'}
          </TextSmall>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden rounded-md border border-gray-200 shadow-sm">
          <Table>
            <THead variant="dark">
              <tr>
                <Th>Nombre</Th>
                <Th>Correo</Th>
                <Th>Celular</Th>
                <Th>Cliente / Sucursal</Th>
                <Th narrow className="text-right">Acciones</Th>
              </tr>
            </THead>
            <TBody>
              {paginatedContacts.map((ct) => (
                <Tr key={ct.id} className="hover:bg-gray-50">
                  <Td>
                    <div className="text-sm font-medium text-gray-900">
                      {ct.nombre || 'Sin nombre'}
                    </div>
                    {ct.cargo && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {ct.cargo}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <div className="text-sm font-medium text-gray-700">
                      {ct.email || '—'}
                    </div>
                  </Td>
                  <Td>
                    <div className="text-sm font-medium text-gray-700">
                      {ct.celular || '—'}
                    </div>
                  </Td>
                  <Td>
                    <div className="text-sm font-medium text-gray-700">
                      {ct.clienteNombre || 'Sin cliente'}{ct.sucursalNombre ? ` / ${ct.sucursalNombre}` : ''}
                    </div>
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(ct, 'contacto')}
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(ct, 'contacto', ct.branchId)}
                        className="p-1.5 rounded hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('¿Está seguro de eliminar este contacto?')) {
                            // TODO: Implementar eliminación de contacto
                          }
                        }}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default ContactsView;

