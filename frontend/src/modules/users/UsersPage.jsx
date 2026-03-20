import { useState, useMemo } from 'react';
import { useMasterData } from '../../context/MasterDataContext';
import { Plus, UserPlus, Search, X } from 'lucide-react';
import ModuleHeader from '../../components/ui/ModuleHeader';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
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

const UsersPage = ({ data, setData }) => {
  const { data: masterData } = useMasterData();
  // UI State
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
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

  // Filter Logic
  const filteredUsers = useMemo(() => {
    let filtered = usuarios;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.nombres?.toLowerCase().includes(q) ||
        u.apellidos?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    if (filterRole !== 'Todos') {
      filtered = filtered.filter(u => u.rol === filterRole);
    }
    return filtered;
  }, [usuarios, searchTerm, filterRole]);

  const roleOptions = useMemo(() => [
    { value: '', label: 'Seleccionar rol' },
    ...roles.filter(r => r.codigo !== 'CLIENTE').map(r => ({ value: r.codigo, label: r.nombre }))
  ], [roles]);

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
      directorId: user.assignedDirectorProfileId || '',
      sucursalesACargo: Array.isArray(user.sucursalesACargo) ? user.sucursalesACargo : [],
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

      <Card className="p-0 overflow-hidden">
        <UserTable
          users={filteredUsers}
          loading={loadingUsers}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={onDeleteInternal}
          searchTerm={searchTerm}
          filterRole={filterRole}
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
