import { Eye, Edit, RefreshCw, Trash2, User, Mail, Phone, Shield, Clock } from 'lucide-react';
import { Table, THead, TBody, Tr, Th, Td } from '../../../components/ui/Table';
import { Subtitle, TextSmall } from '../../../components/ui/Typography';
import StatusBadge from '../../../components/ui/StatusBadge';
import { ROLES } from '../../../utils/constants';

const roleLabels = {
  [ROLES.DIRECTOR]: 'Director',
  [ROLES.COORDINADOR]: 'Coordinador',
  [ROLES.TECNICO]: 'Técnico',
  [ROLES.CLIENTE]: 'Cliente'
};

const UserTable = ({ 
  users, 
  onView, 
  onEdit, 
  onDelete, 
  onResend, 
  resendingIds = new Set(),
  loading = false,
  searchTerm = '',
  filterRole = 'Todos'
}) => {
  if (loading) {
    return (
      <div className="py-12 text-center">
        <RefreshCw className="animate-spin text-gray-400 mx-auto mb-2" size={24} />
        <TextSmall className="text-gray-400">Cargando usuarios...</TextSmall>
      </div>
    );
  }

  return (
    <Table>
      <THead variant="dark">
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
        {users.length === 0 ? (
          <Tr>
            <Td colSpan={6} className="text-center py-12">
              <TextSmall className="text-gray-400">
                {searchTerm || filterRole !== 'Todos' 
                  ? 'No se encontraron usuarios con los filtros aplicados'
                  : 'No hay usuarios registrados. Cree el primer usuario.'}
              </TextSmall>
            </Td>
          </Tr>
        ) : (
          users.map(user => (
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
                  <TextSmall className="text-gray-400">-</TextSmall>
                )}
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-gray-400" />
                  <TextSmall className="font-semibold">{roleLabels[user.rol] || user.rol}</TextSmall>
                </div>
              </Td>
              <Td>
                {user.activo === undefined && !user.estado
                  ? <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 w-fit">
                      <Clock size={11} /> Pendiente
                    </span>
                  : <StatusBadge status={user.estado === 'ACTIVO' || user.activo ? 'Activo' : 'Inactivo'} />
                }
              </Td>
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
                    onClick={() => onResend(user)}
                    disabled={resendingIds.has(user.id)}
                    className="p-2 hover:bg-amber-50 rounded-md transition-colors disabled:opacity-50"
                    title="Reenviar invitación al correo"
                  >
                    <RefreshCw size={16} className={`text-amber-600 ${resendingIds.has(user.id) ? 'animate-spin' : ''}`} />
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
          ))
        )}
      </TBody>
    </Table>
  );
};

export default UserTable;
