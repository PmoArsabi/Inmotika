import { Eye, Edit, Trash2, User, Mail, Phone, Shield, Clock, RefreshCw } from 'lucide-react';
import { Table, THead, TBody, Tr, Th, Td } from '../../../components/ui/Table';
import { Subtitle, TextSmall, TextTiny } from '../../../components/ui/Typography';
import StatusBadge from '../../../components/ui/StatusBadge';
import Card from '../../../components/ui/Card';
import { ROLES } from '../../../utils/constants';

const roleLabels = {
  [ROLES.DIRECTOR]:    'Director',
  [ROLES.COORDINADOR]: 'Coordinador',
  [ROLES.TECNICO]:     'Técnico',
  [ROLES.CLIENTE]:     'Cliente',
};

/**
 * Renders a status pill for a user (Activo / Inactivo / Pendiente).
 * @param {{ user: Object }} props
 */
const UserStatusCell = ({ user }) => {
  if (user.activo === undefined && !user.estado) {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 w-fit">
        <Clock size={11} /> Pendiente
      </span>
    );
  }
  return <StatusBadge status={user.estado === 'ACTIVO' || user.activo ? 'Activo' : 'Inactivo'} />;
};

const UserTable = ({
  users,
  onView,
  onEdit,
  onDelete,
  loading = false,
  searchTerm = '',
  filterRole = 'Todos',
}) => {
  if (loading) {
    return (
      <div className="py-12 text-center">
        <RefreshCw className="animate-spin text-gray-400 mx-auto mb-2" size={24} />
        <TextSmall className="text-gray-400">Cargando usuarios...</TextSmall>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="py-12 text-center">
        <TextSmall className="text-gray-400">
          {searchTerm || filterRole !== 'Todos'
            ? 'No se encontraron usuarios con los filtros aplicados'
            : 'No hay usuarios registrados. Cree el primer usuario.'}
        </TextSmall>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop: tabla (oculta en mobile) ── */}
      <div className="hidden md:block">
        <Table>
          <THead variant="light">
            <tr>
              <Th>Usuario</Th>
              <Th>Email</Th>
              <Th>Teléfono</Th>
              <Th>Rol</Th>
              <Th>Estado</Th>
              <Th align="right">Acciones</Th>
            </tr>
          </THead>
          <TBody>
            {users.map(user => (
              <Tr key={user.id}>
                <Td>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400 shrink-0" />
                    <Subtitle className="text-gray-900">
                      {`${user.nombres || ''} ${user.apellidos || ''}`.trim() || '—'}
                    </Subtitle>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <TextSmall>{user.email}</TextSmall>
                  </div>
                </Td>
                <Td>
                  {user.telefono ? (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <TextSmall>{user.telefono}</TextSmall>
                    </div>
                  ) : (
                    <TextSmall className="text-gray-400">—</TextSmall>
                  )}
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-gray-400" />
                    <TextSmall className="font-semibold">{roleLabels[user.rol] || user.rol}</TextSmall>
                  </div>
                </Td>
                <Td><UserStatusCell user={user} /></Td>
                <Td align="right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(user)}
                      className="p-2 hover:bg-blue-50 rounded-md transition-colors"
                      title="Ver detalles"
                    >
                      <Eye size={16} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 hover:bg-green-50 rounded-md transition-colors"
                      title="Editar usuario"
                    >
                      <Edit size={16} className="text-green-600" />
                    </button>
                    <button
                      onClick={() => onDelete(user.id)}
                      className="p-2 hover:bg-red-50 rounded-md transition-colors"
                      title="Eliminar usuario"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </div>

      {/* ── Mobile: cards (oculto en md+) ── */}
      <div className="flex flex-col gap-3 md:hidden p-3">
        {users.map(user => {
          const fullName = `${user.nombres || ''} ${user.apellidos || ''}`.trim() || '—';
          return (
            <Card key={user.id} className="p-4 border border-gray-200 shadow-sm rounded-xl">
              {/* Header: nombre + estado */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <User size={14} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <TextSmall className="font-bold text-gray-900 truncate">{fullName}</TextSmall>
                    <TextTiny className="text-gray-400 truncate">{user.email}</TextTiny>
                  </div>
                </div>
                <UserStatusCell user={user} />
              </div>

              {/* Detalles */}
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2">
                  <Shield size={13} className="text-gray-300 shrink-0" />
                  <TextTiny className="text-gray-500 font-semibold">{roleLabels[user.rol] || user.rol}</TextTiny>
                </div>
                {user.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-gray-300 shrink-0" />
                    <TextTiny className="text-gray-500">{user.telefono}</TextTiny>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => onView(user)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-semibold"
                >
                  <Eye size={14} /> Ver
                </button>
                <button
                  onClick={() => onEdit(user)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-semibold"
                >
                  <Edit size={14} /> Editar
                </button>
                <button
                  onClick={() => onDelete(user.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-xs font-semibold"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default UserTable;
