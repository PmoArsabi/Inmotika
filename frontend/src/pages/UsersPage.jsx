import { useState, useMemo } from 'react';
import {
  Plus, Edit, Eye, Trash2, UserPlus, Shield, Mail, Phone,
  User, Search, X, Save, ArrowLeft, FileText, Lock, IdCard,
  Hash, Tag,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Switch from '../components/ui/Switch';
import PhoneInput from '../components/ui/PhoneInput';
import FileUploader from '../components/ui/FileUploader';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import { Subtitle, TextSmall, H2, TextTiny, Label } from '../components/ui/Typography';
import StatusBadge from '../components/ui/StatusBadge';
import { ROLES } from '../utils/constants';

const TIPO_DOCUMENTO_OPTIONS = [
  { value: '',    label: 'Seleccionar...' },
  { value: 'CC',  label: 'Cédula de Ciudadanía' },
  { value: 'CE',  label: 'Cédula de Extranjería' },
  { value: 'PAS', label: 'Pasaporte' },
  { value: 'TI',  label: 'Tarjeta de Identidad' },
  { value: 'PPT', label: 'Permiso de Protección Temporal' },
];

const UsersPage = ({ data, setData }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
  
  const emptyUser = () => ({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    telefonoPais: 'CO',
    tipoDocumento: '',
    identificacion: '',
    rol: '',
    activo: true,
    password: '',
    certificados: [],   // solo para Técnico: [{ id, nombre, fileLoaded }]
    directorId: '',     // solo para Coordinador
  });

  const emptyDocs = () => ({ cedula: false, planillaSS: false });

  const [newUser, setNewUser] = useState(emptyUser());

  const [tecnicoDocumentos, setTecnicoDocumentos] = useState(emptyDocs());

  // Obtener usuarios del sistema
  const usuarios = data?.usuarios || [];

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    let filtered = usuarios;
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.nombres?.toLowerCase().includes(q) ||
        user.apellidos?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q)
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
    setNewUser(emptyUser());
    setTecnicoDocumentos(emptyDocs());
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsCreating(false);
    setViewingUser(null);
    setNewUser({
      nombres: user.nombres || '',
      apellidos: user.apellidos || '',
      email: user.email || '',
      telefono: user.telefono || '',
      telefonoPais: user.telefonoPais || 'CO',
      tipoDocumento: user.tipoDocumento || '',
      identificacion: user.identificacion || '',
      rol: user.rol || '',
      activo: user.activo !== undefined ? user.activo : true,
      password: '',
      certificados: Array.isArray(user.certificados) ? user.certificados : [],
      directorId: user.directorId || '',
    });
    setTecnicoDocumentos({
      cedula:    user.documentos?.cedula    || false,
      planillaSS: user.documentos?.planillaSS || false,
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
    if (!newUser.nombres || !newUser.email || !newUser.rol) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    if (isCreating) {
      if (usuarios.some(u => u.email === newUser.email)) {
        alert('Ya existe un usuario con este email');
        return;
      }

      const newId = `USR-${String(usuarios.length + 1).padStart(3, '0')}`;
      const userToAdd = {
        id: newId,
        nombres: newUser.nombres,
        apellidos: newUser.apellidos,
        email: newUser.email,
        telefono: newUser.telefono || '',
        telefonoPais: newUser.telefonoPais || 'CO',
        tipoDocumento: newUser.tipoDocumento || '',
        identificacion: newUser.identificacion || '',
        rol: newUser.rol,
        activo: newUser.activo,
        fechaCreacion: new Date().toISOString().split('T')[0],
        password: newUser.password || 'password123',
        ...(newUser.rol === ROLES.TECNICO && {
          documentos: tecnicoDocumentos,
          certificados: newUser.certificados,
        }),
        ...(newUser.rol === ROLES.COORDINADOR && {
          directorId: newUser.directorId,
        }),
      };

      setData(prev => ({ ...prev, usuarios: [...(prev.usuarios || []), userToAdd] }));
      setIsCreating(false);
      setNewUser(emptyUser());
      setTecnicoDocumentos(emptyDocs());
    } else if (editingUser) {
      setData(prev => ({
        ...prev,
        usuarios: (prev.usuarios || []).map(u =>
          u.id === editingUser.id
            ? {
                ...u,
                nombres: newUser.nombres,
                apellidos: newUser.apellidos,
                email: newUser.email,
                telefono: newUser.telefono,
                telefonoPais: newUser.telefonoPais || 'CO',
                tipoDocumento: newUser.tipoDocumento || '',
                identificacion: newUser.identificacion || '',
                rol: newUser.rol,
                activo: newUser.activo,
                ...(newUser.password && { password: newUser.password }),
                ...(newUser.rol === ROLES.TECNICO && {
                  documentos: tecnicoDocumentos,
                  certificados: newUser.certificados,
                }),
                ...(newUser.rol === ROLES.COORDINADOR && {
                  directorId: newUser.directorId,
                }),
              }
            : u
        ),
      }));
      setEditingUser(null);
      setNewUser(emptyUser());
      setTecnicoDocumentos(emptyDocs());
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingUser(null);
    setViewingUser(null);
    setNewUser(emptyUser());
    setTecnicoDocumentos(emptyDocs());
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
                  label="Nombres"
                  icon={User}
                  value={newUser.nombres}
                  onChange={e => setNewUser({ ...newUser, nombres: e.target.value })}
                  viewMode={!!viewingUser}
                  uppercase
                  required
                />
                <Input
                  label="Apellidos"
                  icon={User}
                  value={newUser.apellidos}
                  onChange={e => setNewUser({ ...newUser, apellidos: e.target.value })}
                  viewMode={!!viewingUser}
                  uppercase
                />
                <Input
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value.toLowerCase() })}
                  viewMode={!!viewingUser}
                  required
                />
                <PhoneInput
                  label="Teléfono"
                  countryValue={newUser.telefonoPais || 'CO'}
                  phoneValue={newUser.telefono || ''}
                  onCountryChange={v => setNewUser({ ...newUser, telefonoPais: v })}
                  onPhoneChange={v => setNewUser({ ...newUser, telefono: v })}
                  viewMode={!!viewingUser}
                />
                <Select
                  label="Tipo de Documento"
                  icon={IdCard}
                  options={TIPO_DOCUMENTO_OPTIONS}
                  value={newUser.tipoDocumento || ''}
                  onChange={e => setNewUser({ ...newUser, tipoDocumento: e.target.value })}
                  viewMode={!!viewingUser}
                />
                <Input
                  label="Número de Documento"
                  icon={Hash}
                  value={newUser.identificacion || ''}
                  onChange={e => setNewUser({ ...newUser, identificacion: e.target.value })}
                  viewMode={!!viewingUser}
                  inputMode="numeric"
                />
                <Select
                  label="Rol"
                  icon={Shield}
                  options={roleOptions}
                  value={newUser.rol}
                  onChange={e => {
                    const nuevoRol = e.target.value;
                    setNewUser({ ...newUser, rol: nuevoRol, directorId: '' });
                    if (nuevoRol !== ROLES.TECNICO) setTecnicoDocumentos(emptyDocs());
                  }}
                  viewMode={!!viewingUser}
                  required
                />
                {/* Activo — comparte fila con Rol */}
                <Switch
                  label="Estado del Usuario"
                  checked={!!newUser.activo}
                  onChange={checked => setNewUser({ ...newUser, activo: checked })}
                  viewMode={!!viewingUser}
                  checkedLabel="Activo"
                  uncheckedLabel="Inactivo"
                />
              </div>

              {/* Contraseña — inmediatamente bajo los datos base */}
              {!viewingUser && (
                <div className="mt-4">
                  <Input
                    label={isCreating ? 'Contraseña' : 'Nueva Contraseña'}
                    icon={Lock}
                    type="password"
                    placeholder={isCreating ? '' : 'Dejar vacío para mantener la actual'}
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    required={isCreating}
                  />
                </div>
              )}

              {/* ── Campos por Rol ───────────────────────────────────── */}

              {/* COORDINADOR */}
              {newUser.rol === ROLES.COORDINADOR && (
                <RoleSection icon={Shield} label="Datos del Coordinador" color="blue">
                  <Select
                    label="Director Asignado"
                    icon={User}
                    options={[
                      { value: '', label: 'Seleccionar director...' },
                      ...(usuarios || [])
                        .filter(u => u.rol === ROLES.DIRECTOR)
                        .map(u => ({ value: u.id, label: `${u.nombres || ''} ${u.apellidos || ''}`.trim() || u.email })),
                    ]}
                    value={newUser.directorId || ''}
                    onChange={e => setNewUser({ ...newUser, directorId: e.target.value })}
                    viewMode={!!viewingUser}
                  />
                </RoleSection>
              )}

              {/* TÉCNICO */}
              {newUser.rol === ROLES.TECNICO && (
                <RoleSection icon={FileText} label="Datos del Técnico" color="orange">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FileUploader
                      label="Cédula / Documento de Identidad"
                      type="cedula"
                      isLoaded={tecnicoDocumentos.cedula}
                      viewMode={!!viewingUser}
                      onLoad={(type) => setTecnicoDocumentos(prev => ({ ...prev, [type]: !prev[type] }))}
                    />
                    <FileUploader
                      label="Planilla de Seguridad Social"
                      type="planillaSS"
                      isLoaded={tecnicoDocumentos.planillaSS}
                      viewMode={!!viewingUser}
                      onLoad={(type) => setTecnicoDocumentos(prev => ({ ...prev, [type]: !prev[type] }))}
                    />
                  </div>

                  {/* Certificados — lista dinámica */}
                  <CertificadosList
                    items={newUser.certificados || []}
                    viewMode={!!viewingUser}
                    onChange={certs => setNewUser(prev => ({ ...prev, certificados: certs }))}
                  />
                </RoleSection>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-9 border border-gray-300 rounded-md text-sm font-semibold bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] hover:border-gray-400 transition-all"
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
                        {(user.nombres || user.apellidos || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Subtitle className="text-gray-900">
                          {`${user.nombres || ''} ${user.apellidos || ''}`.trim() || '—'}
                        </Subtitle>
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

// ─── Certificados: dynamic list of named file uploaders ──────────────────────
const CertificadosList = ({ items = [], viewMode = false, onChange }) => {
  const addRow = () =>
    onChange([...items, { id: `cert-${Date.now()}`, nombre: '', fileLoaded: false }]);

  const updateRow = (id, patch) =>
    onChange(items.map(c => (c.id === id ? { ...c, ...patch } : c)));

  const removeRow = (id) =>
    onChange(items.filter(c => c.id !== id));

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
          Certificados
        </span>
        {!viewMode && (
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 text-xs font-semibold text-[#D32F2F] hover:text-[#B71C1C] transition-colors"
          >
            <Plus size={13} /> Agregar
          </button>
        )}
      </div>

      {items.length === 0 && viewMode && (
        <p className="text-xs italic text-gray-400">Sin documentos adicionales</p>
      )}

      {items.map(cert => (
        <div key={cert.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2">
          {/* Nombre del documento */}
          <div className="w-44 shrink-0">
            {viewMode ? (
              <p className="text-sm font-semibold text-gray-700 px-1 truncate">
                {cert.nombre || <span className="italic text-gray-400">Sin nombre</span>}
              </p>
            ) : (
              <input
                type="text"
                value={cert.nombre}
                onChange={e => updateRow(cert.id, { nombre: e.target.value })}
                placeholder="Nombre del documento"
                className="w-full h-9 px-3 text-sm font-semibold border border-gray-200 rounded-md focus:outline-none focus:border-[#D32F2F] focus:ring-4 focus:ring-[#D32F2F]/5 transition-all bg-gray-50"
              />
            )}
          </div>

          {/* FileUploader */}
          <div className="flex-1 min-w-0">
            <FileUploader
              label=""
              type={cert.id}
              isLoaded={cert.fileLoaded}
              viewMode={viewMode}
              onLoad={() => updateRow(cert.id, { fileLoaded: !cert.fileLoaded })}
            />
          </div>

          {/* Delete */}
          {!viewMode && (
            <button
              type="button"
              onClick={() => removeRow(cert.id)}
              className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors shrink-0"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Helper: coloured section wrapper for role-specific fields ───────────────
const COLOR_MAP = {
  blue:   { bg: 'from-blue-50 to-blue-100/60',   icon: 'text-blue-600',   ring: 'bg-blue-50 to-blue-100'   },
  orange: { bg: 'from-orange-50 to-orange-100/60', icon: 'text-orange-600', ring: 'bg-orange-50 to-orange-100' },
  green:  { bg: 'from-green-50 to-green-100/60',  icon: 'text-green-600',  ring: 'bg-green-50 to-green-100'  },
};

const RoleSection = ({ icon: Icon, label, color = 'blue', children }) => {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`mt-5 pt-5 border-t border-gray-100 space-y-4`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 bg-gradient-to-br ${c.ring} rounded-lg`}>
          <Icon size={16} className={c.icon} />
        </div>
        <Label className="text-sm font-bold text-gray-800">{label}</Label>
      </div>
      {children}
    </div>
  );
};

export default UsersPage;
