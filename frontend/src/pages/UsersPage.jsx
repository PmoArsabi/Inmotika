import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useNotify } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import {
  Plus, Edit, Eye, Trash2, UserPlus, Shield, Mail, Phone,
  User, Search, X, Save, ArrowLeft, FileText, Lock, IdCard,
  Hash, Tag, CheckCircle, Send, RefreshCw, Clock,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ModuleHeader from '../components/ui/ModuleHeader';
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
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [successInfo, setSuccessInfo] = useState(null);
  const [resendingIds, setResendingIds] = useState(new Set()); // IDs de usuarios con reenvío en progreso

  const notify = useNotify();
  const confirm = useConfirm();

  // Cargar roles desde Supabase
  useEffect(() => {
    const fetchRoles = async () => {
      const { data: rolesData, error } = await supabase
        .from('catalogo_rol')
        .select('id, codigo, nombre')
        .order('nombre');
      
      if (rolesData) {
        setRoles(rolesData);
      }
      setLoadingRoles(false);
    };
    fetchRoles();
  }, []);
  
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
    certificados: [],   // solo para Técnico: [{ id, nombre, fileLoaded }]
    directorId: '',     // solo para Coordinador
  });

  const emptyDocs = () => ({ cedula: false, planillaSS: false });

  const [newUser, setNewUser] = useState(emptyUser());

  const [tecnicoDocumentos, setTecnicoDocumentos] = useState(emptyDocs());

  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Obtener usuarios del sistema desde Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      const { data: usersData, error } = await supabase
        .from('perfil_usuario')
        .select(`
          id, nombres, apellidos, email, telefono, tipo_documento, identificacion,
          catalogo_rol (id, codigo, nombre),
          catalogo_estado_general (id, codigo, nombre, activo)
        `)
        .order('nombres');

      if (usersData) {
        setUsuarios(usersData.map(u => ({
          ...u,
          rol: u.catalogo_rol?.codigo || '',
          rolNombre: u.catalogo_rol?.nombre || '',
          activo: u.catalogo_estado_general?.activo ?? true,
          estado: u.catalogo_estado_general?.codigo || '',
          estadoNombre: u.catalogo_estado_general?.nombre || '',
        })));
      } else if (error?.message?.includes('email')) {
        // email column doesn't exist yet — fetch without it
        const { data: fallback } = await supabase
          .from('perfil_usuario')
          .select(`
            id, nombres, apellidos, telefono, tipo_documento, identificacion,
            catalogo_rol (id, codigo, nombre),
            catalogo_estado_general (id, codigo, nombre, activo)
          `)
          .order('nombres');
        if (fallback) {
          setUsuarios(fallback.map(u => ({
            ...u,
            email: '(pendiente - ejecutar migración)',
            rol: u.catalogo_rol?.codigo || '',
            rolNombre: u.catalogo_rol?.nombre || '',
            activo: u.catalogo_estado_general?.activo ?? true,
            estado: u.catalogo_estado_general?.codigo || '',
            estadoNombre: u.catalogo_estado_general?.nombre || '',
          })));
        }
      } else {
        console.error('Error al cargar usuarios:', error);
      }
      setLoadingUsers(false);
    };
    fetchUsers();
  }, []);

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

  // Roles disponibles para el Select
  const roleOptions = useMemo(() => [
    { value: '', label: 'Seleccionar rol' },
    ...roles.filter(r => r.codigo !== 'CLIENTE').map(r => ({ value: r.codigo, label: r.nombre }))
  ], [roles]);

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

  const handleDelete = async (userId) => {
    const user = usuarios.find(u => u.id === userId);
    const confirmed = await confirm({
      title: '¿Eliminar usuario?',
      message: `¿Estás seguro de que deseas eliminar a ${user?.nombres || 'este usuario'}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Descartar',
      type: 'danger'
    });

    if (confirmed) {
      setData(prev => ({
        ...prev,
        usuarios: (prev.usuarios || []).filter(u => u.id !== userId)
      }));
      notify('success', 'Usuario eliminado correctamente');
    }
  };

  const handleResendInvitation = async (user) => {
    if (resendingIds.has(user.id)) return;
    setResendingIds(prev => new Set([...prev, user.id]));
    try {
      const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-user', {
        body: {
          email: user.email,
          nombres: user.nombres,
          apellidos: user.apellidos,
          role_code: user.rol,
          redirectTo: import.meta.env.VITE_APP_URL || window.location.origin,
        }
      });

      if (inviteError) {
        // Intentar extraer el mensaje real del cuerpo de la respuesta
        let mensaje = inviteError.message;
        try {
          if (inviteError.context?.json) {
            const body = await inviteError.context.json();
            if (body?.error) mensaje = body.error;
            else if (body?.message) mensaje = body.message;
          }
        } catch (_) {}
        throw new Error(mensaje);
      }
      if (inviteData?.error) throw new Error(inviteData.error);

      setSuccessInfo({ email: user.email, nombres: user.nombres, rol: user.rol, isResend: true });
    } catch (err) {
      setSuccessInfo({ error: true, message: err.message || 'No se pudo reenviar la invitación' });
    } finally {
      setResendingIds(prev => { const n = new Set(prev); n.delete(user.id); return n; });
    }
  };

  const handleSave = async () => {
    if (!newUser.nombres || !newUser.email || !newUser.rol) {
      notify('warning', 'Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      if (isCreating) {
        // Enviar invitación de Supabase mediante Edge Function (Seguro)
        const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-user', {
          body: {
            email: newUser.email,
            nombres: newUser.nombres,
            apellidos: newUser.apellidos,
            role_code: newUser.rol,
            redirectTo: `${window.location.origin}`,
          }
        });

        if (inviteError) {
          console.error('FULL INVITE ERROR:', inviteError);
          const status = inviteError.status || 'N/A';
          let errorMessage = inviteError.message;
          
          try {
            const response = inviteError.context;
            if (response && typeof response.json === 'function') {
              const body = await response.json();
              if (body && body.error) errorMessage = body.error;
            }
          } catch (e) {}

          throw new Error(`[Status ${status}] ${errorMessage}`);
        }

        if (inviteData && inviteData.error) {
          throw new Error(inviteData.error);
        }

        setSuccessInfo({ email: newUser.email, nombres: newUser.nombres, rol: newUser.rol });
        setIsCreating(false);

        // Actualizar campos adicionales en perfil_usuario (el trigger solo guarda nombre/rol/email)
        // La invitación crea el registro, esperamos un momento y luego actualizamos
        // Buscamos el perfil recién creado por email para obtener su ID
        const findAndUpdate = async () => {
          await new Promise(r => setTimeout(r, 1500)); // esperar a que el trigger cree el perfil
          const { data: newProfile } = await supabase
            .from('perfil_usuario')
            .select('id')
            .eq('email', newUser.email)
            .maybeSingle();

          if (newProfile?.id && (newUser.telefono || newUser.tipoDocumento || newUser.identificacion)) {
            await supabase
              .from('perfil_usuario')
              .update({
                telefono: newUser.telefono || null,
                tipo_documento: newUser.tipoDocumento || null,
                identificacion: newUser.identificacion || null,
              })
              .eq('id', newProfile.id);
          }
          // Recargar la lista de usuarios
          const { data: usersData } = await supabase
            .from('perfil_usuario')
            .select(`id, nombres, apellidos, email, telefono, tipo_documento, identificacion, catalogo_rol (id, codigo, nombre), catalogo_estado_general (id, codigo, nombre, activo)`)
            .order('nombres');
          if (usersData) {
            setUsuarios(usersData.map(u => ({
              ...u,
              rol: u.catalogo_rol?.codigo || '',
              rolNombre: u.catalogo_rol?.nombre || '',
              activo: u.catalogo_estado_general?.activo ?? true,
              estado: u.catalogo_estado_general?.codigo || '',
            })));
          }
        };
        findAndUpdate();
      } else if (editingUser) {
        // Encontrar el rol_id basado en el código seleccionado
        const selectedRole = roles.find(r => r.codigo === newUser.rol);
        
        // Lógica de actualización de perfil
        const { error: updateError } = await supabase
          .from('perfil_usuario')
          .update({
            nombres: newUser.nombres,
            apellidos: newUser.apellidos,
            rol_id: selectedRole?.id,
            telefono: newUser.telefono || null,
            tipo_documento: newUser.tipoDocumento || null,
            identificacion: newUser.identificacion || null,
          })
          .eq('id', editingUser.id);

        if (updateError) throw updateError;
        setSuccessInfo({ email: newUser.email, nombres: newUser.nombres, rol: null, isUpdate: true });
        setEditingUser(null);
      }
      
      setNewUser(emptyUser());
      setTecnicoDocumentos(emptyDocs());
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      setSuccessInfo({ error: true, message: err.message || 'Error desconocido' });
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
                <div className="p-3 bg-linear-to-br from-blue-50 to-blue-100 rounded-xl">
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

              {/* Invitación Informativa */}
              {isCreating && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                  <Mail className="text-blue-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <TextSmall className="text-blue-900 font-bold">Invitación por Correo</TextSmall>
                    <TextTiny className="text-blue-700 leading-relaxed">
                      Al guardar, el sistema enviará automáticamente un correo electrónico a este usuario con un enlace seguro para que cree su propia contraseña.
                    </TextTiny>
                  </div>
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
            <Card className="p-6 bg-linear-to-br from-gray-50 to-gray-100">
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
              <Card className="p-6 bg-linear-to-br from-orange-50 to-orange-100/50">
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
      <ModuleHeader
        title="USUARIOS AP"
        subtitle="Gestión de usuarios con acceso a la plataforma"
        icon={UserPlus}
        onNewClick={handleCreate}
        newButtonLabel="Crear Usuario"
        newButtonIcon={Plus}
        filterContent={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-8 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded">
                  <X size={13} className="text-gray-400" />
                </button>
              )}
            </div>
            <Select
              options={[{ value: 'Todos', label: 'Todos los roles' }, ...roleOptions.slice(1)]}
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
            />
          </div>
        }
      />

      {/* Tabla de Usuarios */}
      <Card className="p-0 overflow-hidden">
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
                    {/* Estado: Activo/Inactivo o Pendiente si nunca se confirmó */}
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
                        onClick={() => handleView(user)}
                        className="p-2 hover:bg-blue-50 rounded-md transition-colors"
                        title="Ver detalles"
                      >
                        <Eye size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 hover:bg-green-50 rounded-md transition-colors"
                        title="Editar usuario"
                      >
                        <Edit size={16} className="text-green-600" />
                      </button>
                      <button
                        onClick={() => handleResendInvitation(user)}
                        disabled={resendingIds.has(user.id)}
                        className="p-2 hover:bg-amber-50 rounded-md transition-colors disabled:opacity-50"
                        title="Reenviar invitación al correo"
                      >
                        <RefreshCw size={16} className={`text-amber-600 ${resendingIds.has(user.id) ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
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
      </Card>

      {/* ─── Modal de Éxito / Error ─── */}
      {successInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSuccessInfo(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {successInfo.error ? (
              /* ── Error ── */
              <>
                <div className="bg-linear-to-br from-red-500 to-red-700 p-6 text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <X size={32} className="text-white" />
                  </div>
                  <h2 className="text-white font-bold text-xl">Error en la operación</h2>
                </div>
                <div className="p-6 text-center space-y-4">
                  <p className="text-gray-600 text-sm">{successInfo.message}</p>
                  <button
                    onClick={() => setSuccessInfo(null)}
                    className="w-full py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                  >
                    Entendido
                  </button>
                </div>
              </>
            ) : (
              /* ── Éxito ── */
              <>
                <div className="bg-linear-to-br from-[#D32F2F] via-[#B71C1C] to-[#8B0000] p-6 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-white/30">
                      {successInfo.isUpdate
                        ? <CheckCircle size={32} className="text-white" />
                        : <Send size={28} className="text-white" />
                      }
                    </div>
                    <h2 className="text-white font-bold text-xl">
                      {successInfo.isResend ? '¡Invitación Reenviada!' : successInfo.isUpdate ? '¡Actualizado!' : '¡Invitación Enviada!'}
                    </h2>
                    <p className="text-white/70 text-sm mt-1">
                      {successInfo.isResend ? 'Se volvió a enviar el correo de activación.' : successInfo.isUpdate ? 'Los datos han sido guardados exitosamente.' : 'El correo de activación fue enviado con éxito.'}
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User size={15} className="text-gray-400 shrink-0" />
                      <span className="text-gray-500">Usuario:</span>
                      <span className="font-semibold text-gray-800">{successInfo.nombres}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={15} className="text-gray-400 shrink-0" />
                      <span className="text-gray-500">Correo:</span>
                      <span className="font-semibold text-gray-800 break-all">{successInfo.email}</span>
                    </div>
                    {!successInfo.isUpdate && successInfo.rol && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield size={15} className="text-gray-400 shrink-0" />
                        <span className="text-gray-500">Rol asignado:</span>
                        <span className="font-semibold text-gray-800">{successInfo.rol}</span>
                      </div>
                    )}
                  </div>

                  {!successInfo.isUpdate && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-amber-700 text-xs leading-relaxed">
                        <strong>Próximo paso:</strong> El usuario recibirá un correo con un enlace para configurar su contraseña y acceder a la plataforma.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setSuccessInfo(null)}
                    className="w-full py-2.5 rounded-lg bg-[#D32F2F] text-white font-semibold hover:bg-[#B71C1C] transition-colors"
                  >
                    Perfecto
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
        <div className={`p-2 bg-linear-to-br ${c.ring} rounded-lg`}>
          <Icon size={16} className={c.icon} />
        </div>
        <Label className="text-sm font-bold text-gray-800">{label}</Label>
      </div>
      {children}
    </div>
  );
};

export default UsersPage;
