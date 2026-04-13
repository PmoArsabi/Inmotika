import { useState, useMemo } from 'react';
import { useMasterData } from '../../context/MasterDataContext';
import { Plus, UserPlus } from 'lucide-react';
import ModuleHeader from '../../components/ui/ModuleHeader';
import Card from '../../components/ui/Card';
import FilterBar from '../../components/shared/FilterBar';
import { useUsers } from '../../hooks/useUsers';
import UserTable from './components/UserTable';
import UserForm from './components/UserForm';
import UserSuccessModal from './components/UserSuccessModal';

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
  certificados: [],
  directorId: '',
  sucursalesACargo: [],
});

const emptyDocs = () => ({ cedula: null, planillaSS: null });

const UsersPage = ({ setData }) => {
  const { data: masterData } = useMasterData();
  // UI State
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ rol: [], estado: [], clienteContacto: [], fechaDesde: '', fechaHasta: '' });
  const [newUser, setNewUser] = useState(emptyUser());
  const [tecnicoDocumentos, setTecnicoDocumentos] = useState(emptyDocs());
  const [savingUser, setSavingUser] = useState(false);

  // Data & Logic Hook
  const {
    usuarios,
    loadingUsers,
    roles,
    successInfo,
    setSuccessInfo,
    resendingIds,
    handleResendInvitation,
    handleDelete,
    saveUser,
    activeDirectors
  } = useUsers();

  // Filter options
  const rolOptions = useMemo(() =>
    roles.map(r => ({ value: r.codigo, label: r.nombre })),
  [roles]);

  const estadoOptions = [
    { value: 'activo',   label: 'Activo'   },
    { value: 'inactivo', label: 'Inactivo' },
  ];

  // Opciones de cliente relacionado: solo usuarios con rol CLIENTE que tengan cliente vinculado
  const clienteContactoOptions = useMemo(() => {
    const seen = new Map();
    usuarios
      .filter(u => u.rol === 'CLIENTE' && u.contactoClienteId)
      .forEach(u => seen.set(u.contactoClienteId, u.contactoClienteNombre));
    return [...seen.entries()]
      .map(([value, label]) => ({ value, label: label || value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [usuarios]);

  // El filtro de cliente relacionado solo aparece cuando el rol seleccionado incluye CLIENTE o no hay filtro de rol
  const showClienteFilter = filters.rol.length === 0 || filters.rol.includes('CLIENTE');

  const filterDefs = useMemo(() => [
    { key: 'rol',            label: 'Rol',               options: rolOptions,             multi: true },
    { key: 'estado',         label: 'Estado',            options: estadoOptions,          multi: true },
    ...(showClienteFilter ? [{
      key: 'clienteContacto', label: 'Cliente relacionado', options: clienteContactoOptions, multi: true,
    }] : []),
    { key: 'fechaDesde', label: 'Fecha desde', type: 'date', dateRole: 'desde', linkedTo: 'fechaHasta' },
    { key: 'fechaHasta', label: 'Fecha hasta', type: 'date', dateRole: 'hasta', linkedTo: 'fechaDesde' },
  ], [rolOptions, clienteContactoOptions, showClienteFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter Logic (client-side sobre datos en memoria)
  const filteredUsers = useMemo(() => {
    let list = usuarios;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.nombres?.toLowerCase().includes(q) ||
        u.apellidos?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    if (filters.rol.length > 0)
      list = list.filter(u => filters.rol.includes(u.rol));
    if (filters.estado.length > 0) {
      list = list.filter(u => {
        const isActivo = u.activo !== false;
        return (filters.estado.includes('activo') && isActivo) ||
               (filters.estado.includes('inactivo') && !isActivo);
      });
    }
    if (filters.clienteContacto.length > 0)
      list = list.filter(u => u.contactoClienteId && filters.clienteContacto.includes(u.contactoClienteId));
    if (filters.fechaDesde)
      list = list.filter(u => u.created_at && u.created_at >= filters.fechaDesde);
    if (filters.fechaHasta)
      list = list.filter(u => u.created_at && u.created_at <= filters.fechaHasta + 'T23:59:59');
    return list;
  }, [usuarios, search, filters]);

  // Kept for legacy prop on UserTable
  // CLIENTE se excluye: los contactos con acceso se crean desde la sección de Contactos.
  const roleOptions = useMemo(() => [
    { value: '', label: 'Seleccionar rol' },
    ...rolOptions.filter(r => r.value !== 'CLIENTE'),
  ], [rolOptions]);

  // Handlers
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
      telefonoPais: user.telefono_pais_iso || 'CO',
      tipoDocumento: user.tipo_documento || '',
      identificacion: user.identificacion || '',
      rol: user.rol || '',
      activo: user.activo !== undefined ? user.activo : true,
      certificados: Array.isArray(user.certificados) ? user.certificados : [],
      directorId: user.directorAsignadoId || '',
      sucursalesACargo: Array.isArray(user.sucursalesACargo) ? user.sucursalesACargo : [],
      avatarUrl: user.avatar_url || '',
    });
    setTecnicoDocumentos({
      cedula: user.documentos?.cedula || null,
      planillaSS: user.documentos?.planillaSS || null,
    });
  };

  const handleView = (user) => {
    // Reuse edit logic for state setup
    setNewUser({
      nombres: user.nombres || '',
      apellidos: user.apellidos || '',
      email: user.email || '',
      telefono: user.telefono || '',
      telefonoPais: user.telefono_pais_iso || 'CO',
      tipoDocumento: user.tipo_documento || '',
      identificacion: user.identificacion || '',
      rol: user.rol || '',
      activo: user.activo !== undefined ? user.activo : true,
      certificados: Array.isArray(user.certificados) ? user.certificados : [],
      directorId: user.directorAsignadoId || '',
      sucursalesACargo: Array.isArray(user.sucursalesACargo) ? user.sucursalesACargo : [],
      avatarUrl: user.avatar_url || '',
    });
    setTecnicoDocumentos({
      cedula: user.documentos?.cedula || null,
      planillaSS: user.documentos?.planillaSS || null,
    });
    setViewingUser(user);
    setIsCreating(false);
    setEditingUser(null);
  };

  const onSave = async () => {
    if (savingUser) return;
    setSavingUser(true);
    setSuccessInfo(null);
    try {
      const success = await saveUser(isCreating, editingUser, newUser, tecnicoDocumentos);
      if (success) {
        setIsCreating(false);
        setEditingUser(null);
        if (setData) {
          setData(prev => ({ ...prev, usuarios: usuarios }));
        }
      }
    } catch (err) {
      setSuccessInfo({
        error: true,
        message: err?.message || 'Error al guardar el usuario. Revise la consola.',
      });
    } finally {
      setSavingUser(false);
    }
  };

  const onCancel = () => {
    setIsCreating(false);
    setEditingUser(null);
    setViewingUser(null);
  };

  const onDeleteInternal = async (id) => {
    await handleDelete(id);
    if (setData) {
      setData(prev => ({
        ...prev,
        usuarios: (prev.usuarios || []).filter(u => u.id !== id)
      }));
    }
  };

  if (isCreating || editingUser || viewingUser) {
    return (
      <>
        <UserForm
          newUser={newUser}
          setNewUser={setNewUser}
          tecnicoDocumentos={tecnicoDocumentos}
          setTecnicoDocumentos={setTecnicoDocumentos}
          isCreating={isCreating}
          editingUser={editingUser}
          viewingUser={viewingUser}
          onSave={onSave}
          onCancel={onCancel}
          roleOptions={roleOptions}
          allUsers={usuarios}
          activeDirectors={activeDirectors}
          clientes={masterData?.clientes || []}
          onResendInvitation={handleResendInvitation}
          resendingIds={resendingIds}
          isSaving={savingUser}
        />
        <UserSuccessModal
          successInfo={successInfo}
          onClose={() => setSuccessInfo(null)}
        />
      </>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <ModuleHeader
        title="USUARIOS"
        subtitle="Gestión de usuarios con acceso a la plataforma"
        icon={UserPlus}
        onNewClick={handleCreate}
        newButtonLabel="Crear Usuario"
        newButtonIcon={Plus}
        filterContent={
          <FilterBar
            filters={filterDefs}
            values={filters}
            onChange={setFilters}
            searchPlaceholder="Buscar por nombre o email..."
            searchValue={search}
            onSearchChange={setSearch}
            totalItems={usuarios.length}
            filteredCount={filteredUsers.length}
          />
        }
      />

      <Card className="p-0 overflow-hidden">
        <UserTable
          users={filteredUsers}
          loading={loadingUsers}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={onDeleteInternal}
          searchTerm={search}
          filterRole={filters.rol[0] || 'Todos'}
        />
      </Card>

      <UserSuccessModal 
        successInfo={successInfo} 
        onClose={() => setSuccessInfo(null)} 
      />
    </div>
  );
};

export default UsersPage;
