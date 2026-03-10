import { useState, useMemo } from 'react';
import {
  Plus, Edit, Eye, Trash2, UserPlus, Shield, Mail, Phone,
  User, Search, X, Save, ArrowLeft, FileText
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import FileUploader from '../components/ui/FileUploader';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import { Subtitle, TextSmall, H2, H3, TextTiny, Label } from '../components/ui/Typography';
import StatusBadge from '../components/ui/StatusBadge';
import { ROLES } from '../utils/constants';

const UsersPage = ({ data, setData }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
  
  const [newUser, setNewUser] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: '',
    activo: true,
    password: ''
  });

  // Estado para documentos del técnico
  const [tecnicoDocumentos, setTecnicoDocumentos] = useState({
    planilla: false,
    otros: false
  });

  // Obtener usuarios del sistema
  const usuarios = data?.usuarios || [];

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    let filtered = usuarios;
    
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterRole !== 'Todos') {
      filtered = filtered.filter(user => user.rol === filterRole);
    }
    
    return filtered;
  }, [usuarios, searchTerm, filterRole]);

  // Roles disponibles
  const roleOptions = [
    { value: '', label: 'Seleccionar rol' },
    { value: ROLES.DIRECTOR, label: 'Director' },
    { value: ROLES.COORDINADOR, label: 'Coordinador' },
    { value: ROLES.TECNICO, label: 'Técnico' },
    { value: ROLES.CLIENTE, label: 'Cliente' }
  ];

  const roleLabels = {
    [ROLES.DIRECTOR]: 'Director',
    [ROLES.COORDINADOR]: 'Coordinador',
    [ROLES.TECNICO]: 'Técnico',
    [ROLES.CLIENTE]: 'Cliente'
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingUser(null);
    setViewingUser(null);
    setNewUser({
      nombre: '',
      email: '',
      telefono: '',
      rol: '',
      activo: true,
      password: ''
    });
    setTecnicoDocumentos({
      planilla: false,
      otros: false
    });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsCreating(false);
    setViewingUser(null);
    setNewUser({
      nombre: user.nombre || '',
      email: user.email || '',
      telefono: user.telefono || '',
      rol: user.rol || '',
      activo: user.activo !== undefined ? user.activo : true,
      password: '' // No mostrar contraseña existente
    });
    setTecnicoDocumentos({
      planilla: user.documentos?.planilla || false,
      otros: user.documentos?.otros || false
    });
  };

  const handleView = (user) => {
    setViewingUser(user);
    setIsCreating(false);
    setEditingUser(null);
  };

  const handleDelete = (userId) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      setData(prev => ({
        ...prev,
        usuarios: (prev.usuarios || []).filter(u => u.id !== userId)
      }));
    }
  };

  const handleSave = () => {
    if (!newUser.nombre || !newUser.email || !newUser.rol) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    if (isCreating) {
      // Validar que no exista otro usuario con el mismo email
      if (usuarios.some(u => u.email === newUser.email)) {
        alert('Ya existe un usuario con este email');
        return;
      }

      // Crear nuevo usuario
      const newId = `USR-${String(usuarios.length + 1).padStart(3, '0')}`;
      const userToAdd = {
        id: newId,
        nombre: newUser.nombre,
        email: newUser.email,
        telefono: newUser.telefono || '',
        rol: newUser.rol,
        activo: newUser.activo,
        fechaCreacion: new Date().toISOString().split('T')[0],
        password: newUser.password || 'password123', // En producción, esto debería ser hasheado
        ...(newUser.rol === ROLES.TECNICO && { documentos: tecnicoDocumentos })
      };

      setData(prev => ({
        ...prev,
        usuarios: [...(prev.usuarios || []), userToAdd]
      }));

      setIsCreating(false);
      setNewUser({
        nombre: '',
        email: '',
        telefono: '',
        rol: '',
        activo: true,
        password: ''
      });
      setTecnicoDocumentos({
        planilla: false,
        otros: false
      });
    } else if (editingUser) {
      // Actualizar usuario existente
      setData(prev => ({
        ...prev,
        usuarios: (prev.usuarios || []).map(u =>
          u.id === editingUser.id
            ? {
                ...u,
                nombre: newUser.nombre,
                email: newUser.email,
                telefono: newUser.telefono,
                rol: newUser.rol,
                activo: newUser.activo,
                ...(newUser.password && { password: newUser.password }),
                ...(newUser.rol === ROLES.TECNICO && { documentos: tecnicoDocumentos })
              }
            : u
        )
      }));

      setEditingUser(null);
      setNewUser({
        nombre: '',
        email: '',
        telefono: '',
        rol: '',
        activo: true,
        password: ''
      });
      setTecnicoDocumentos({
        planilla: false,
        otros: false
      });
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingUser(null);
    setViewingUser(null);
    setNewUser({
      nombre: '',
      email: '',
      telefono: '',
      rol: '',
      activo: true,
      password: ''
    });
    setTecnicoDocumentos({
      planilla: false,
      otros: false
    });
  };

  // Vista de detalle/edición
  if (isCreating || editingUser || viewingUser) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
        <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-md transition-all shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <H2>
                {isCreating ? 'Crear Usuario' : editingUser ? 'Editar Usuario' : 'Detalle de Usuario'}
              </H2>
              <TextSmall className="text-gray-500">
                {isCreating ? 'Complete el formulario para crear un nuevo usuario' : 
                 editingUser ? 'Modifique la información del usuario' :
                 'Información detallada del usuario'}
              </TextSmall>
            </div>
          </div>
          {!viewingUser && (
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save size={16} />
              Guardar
            </Button>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <User size={24} className="text-blue-600" />
                </div>
                <div>
                  <Label className="text-lg font-bold text-gray-900">Información Personal</Label>
                  <TextTiny className="text-gray-500">Datos básicos del usuario</TextTiny>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre Completo *"
                  value={newUser.nombre}
                  onChange={e => setNewUser({ ...newUser, nombre: e.target.value })}
                  disabled={viewingUser}
                  required
                />
                <Input
                  label="Email *"
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  disabled={viewingUser}
                  required
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  value={newUser.telefono}
                  onChange={e => setNewUser({ ...newUser, telefono: e.target.value })}
                  disabled={viewingUser}
                />
                <Select
                  label="Rol *"
                  options={roleOptions}
                  value={newUser.rol}
                  onChange={e => {
                    const nuevoRol = e.target.value;
                    setNewUser({ ...newUser, rol: nuevoRol });
                    // Si cambia a un rol que no es técnico, limpiar documentos
                    if (nuevoRol !== ROLES.TECNICO) {
                      setTecnicoDocumentos({ planilla: false, otros: false });
                    }
                  }}
                  disabled={viewingUser}
                  required
                />
              </div>

              {!viewingUser && (
                <div className="mt-4">
                  <Input
                    label={isCreating ? "Contraseña *" : "Nueva Contraseña (dejar vacío para mantener la actual)"}
                    type="password"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    required={isCreating}
                  />
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={newUser.activo}
                  onChange={e => setNewUser({ ...newUser, activo: e.target.checked })}
                  disabled={viewingUser}
                  className="w-4 h-4 text-[#D32F2F] border-gray-300 rounded focus:ring-[#D32F2F]"
                />
                <Label htmlFor="activo" className="text-sm font-medium text-gray-700">
                  Usuario activo
                </Label>
              </div>

              {/* Sección de Documentos para Técnicos */}
              {newUser.rol === ROLES.TECNICO && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                      <FileText size={18} className="text-orange-600" />
                    </div>
                    <div>
                      <Label className="text-base font-bold text-gray-900">Documentos del Técnico</Label>
                      <TextTiny className="text-gray-500">Subir documentos requeridos (planilla, certificaciones, etc.)</TextTiny>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FileUploader
                      label="Planilla"
                      type="planilla"
                      isLoaded={tecnicoDocumentos.planilla}
                      viewMode={viewingUser}
                      onLoad={(type) => setTecnicoDocumentos(prev => ({ ...prev, [type]: !prev[type] }))}
                    />
                    <FileUploader
                      label="Otros Documentos"
                      type="otros"
                      isLoaded={tecnicoDocumentos.otros}
                      viewMode={viewingUser}
                      onLoad={(type) => setTecnicoDocumentos(prev => ({ ...prev, [type]: !prev[type] }))}
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <Shield size={20} className="text-gray-600" />
                <Label className="text-base font-bold text-gray-900">Información del Rol</Label>
              </div>
              {newUser.rol && (
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <TextSmall className="text-gray-500 text-xs">Rol Asignado</TextSmall>
                    <Subtitle className="text-gray-900 mt-1">{roleLabels[newUser.rol] || newUser.rol}</Subtitle>
                  </div>
                  <TextTiny className="text-gray-500">
                    {newUser.rol === ROLES.DIRECTOR && 'Acceso completo al sistema'}
                    {newUser.rol === ROLES.COORDINADOR && 'Gestión de visitas y coordinación'}
                    {newUser.rol === ROLES.TECNICO && 'Acceso a agenda y visitas asignadas'}
                    {newUser.rol === ROLES.CLIENTE && 'Acceso a información de cliente'}
                  </TextTiny>
                </div>
              )}
            </Card>

            {/* Información de Documentos para Técnicos */}
            {viewingUser && viewingUser.rol === ROLES.TECNICO && viewingUser.documentos && (
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50">
                <div className="flex items-center gap-3 mb-4">
                  <FileText size={20} className="text-orange-600" />
                  <Label className="text-base font-bold text-gray-900">Documentos del Técnico</Label>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <TextTiny className="text-gray-500">Planilla</TextTiny>
                    <TextSmall className={`font-semibold ${viewingUser.documentos.planilla ? 'text-green-600' : 'text-gray-400'}`}>
                      {viewingUser.documentos.planilla ? '✓ Cargado' : 'No cargado'}
                    </TextSmall>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <TextTiny className="text-gray-500">Otros Documentos</TextTiny>
                    <TextSmall className={`font-semibold ${viewingUser.documentos.otros ? 'text-green-600' : 'text-gray-400'}`}>
                      {viewingUser.documentos.otros ? '✓ Cargado' : 'No cargado'}
                    </TextSmall>
                  </div>
                </div>
              </Card>
            )}

            {viewingUser && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <User size={20} className="text-gray-600" />
                  <Label className="text-base font-bold text-gray-900">Información Adicional</Label>
                </div>
                <div className="space-y-3">
                  <div>
                    <TextTiny className="text-gray-500">ID de Usuario</TextTiny>
                    <TextSmall className="text-gray-900 font-semibold">{viewingUser.id}</TextSmall>
                  </div>
                  {viewingUser.fechaCreacion && (
                    <div>
                      <TextTiny className="text-gray-500">Fecha de Creación</TextTiny>
                      <TextSmall className="text-gray-900 font-semibold">
                        {new Date(viewingUser.fechaCreacion).toLocaleDateString('es-ES')}
                      </TextSmall>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista de lista
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <H2>Usuarios del Sistema</H2>
          <TextSmall className="text-gray-500">Gestione los usuarios y sus roles en el sistema</TextSmall>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <UserPlus size={16} />
          Nuevo Usuario
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>
          <Select
            label="Filtrar por Rol"
            options={[
              { value: 'Todos', label: 'Todos los roles' },
              ...roleOptions.slice(1)
            ]}
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
          />
        </div>
      </Card>

      {/* Tabla de Usuarios */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <THead>
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
            {filteredUsers.length === 0 ? (
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
              filteredUsers.map(user => (
                <Tr key={user.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {user.nombre?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <Subtitle className="text-gray-900">{user.nombre}</Subtitle>
                        <TextTiny className="text-gray-500">{user.id}</TextTiny>
                      </div>
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
                    <StatusBadge status={user.activo ? 'Activo' : 'Inactivo'} />
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(user)}
                        className="p-2 hover:bg-blue-50 rounded-md transition-colors"
                        title="Ver detalles"
                      >
                        <Eye size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 hover:bg-green-50 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit size={16} className="text-green-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 hover:bg-red-50 rounded-md transition-colors"
                        title="Eliminar"
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
      </Card>
    </div>
  );
};

export default UsersPage;
