import { useState, useMemo, useEffect, useRef } from 'react';
import { User, Mail, Shield, IdCard, Hash, FileText, AlertTriangle, Save, ArrowLeft, RefreshCw, Loader2, Building2, MapPin, ChevronRight, Search } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Switch from '../../../components/ui/Switch';
import PhoneInput from '../../../components/ui/PhoneInput';
import FileUploader from '../../../components/ui/FileUploader';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import { Subtitle, TextSmall, H2, TextTiny, Label } from '../../../components/ui/Typography';
import { ROLES } from '../../../utils/constants';
import CertificadosList from './CertificadosList';

const TIPO_DOCUMENTO_OPTIONS = [
  { value: '',    label: 'Seleccionar...' },
  { value: 'CC',  label: 'Cédula de Ciudadanía' },
  { value: 'CE',  label: 'Cédula de Extranjería' },
  { value: 'PAS', label: 'Pasaporte' },
  { value: 'TI',  label: 'Tarjeta de Identidad' },
  { value: 'PPT', label: 'Permiso de Protección Temporal' },
];

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

/**
 * Checkbox con tri-state visual: checked | indeterminate | unchecked.
 * El estado `indeterminate` se aplica via ref porque no es un atributo HTML.
 * @param {{ estado: "checked"|"indeterminate"|"unchecked", onChange: Function }} props
 */
const TriStateCheckbox = ({ estado, onChange }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.indeterminate = estado === 'indeterminate';
    ref.current.checked = estado === 'checked';
  }, [estado]);
  return (
    <input
      ref={ref}
      type="checkbox"
      onChange={onChange}
      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0 cursor-pointer shrink-0"
    />
  );
};

const roleLabels = {
  [ROLES.DIRECTOR]: 'Director',
  [ROLES.COORDINADOR]: 'Coordinador',
  [ROLES.TECNICO]: 'Técnico',
  [ROLES.CLIENTE]: 'Cliente'
};

const UserForm = ({
  newUser,
  setNewUser,
  tecnicoDocumentos,
  setTecnicoDocumentos,
  isCreating,
  editingUser,
  viewingUser,
  onSave,
  onCancel,
  roleOptions,
  allUsers = [],
  activeDirectors = [],
  clientes = [],
  onResendInvitation,
  resendingIds = new Set(),
  isSaving = false
}) => {
  const isView = !!viewingUser;
  const isCliente = newUser.rol === ROLES.CLIENTE;
  const [showResendModal, setShowResendModal] = useState(false);
  const [expandedClientes, setExpandedClientes] = useState(/** @type {Set<string>} */(new Set()));
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const isResending = editingUser && resendingIds.has(editingUser.id);

  /**
   * Árbol de clientes con sus sucursales para el selector jerárquico.
   * MasterDataContext mapea razon_social → nombre via toClientDraft.
   */
  const arbolClientes = useMemo(() =>
    clientes.map(c => ({
      id: c.id,
      nombre: c.nombre || c.razon_social || '—',
      sucursales: (c.sucursales || []).map(s => ({ id: s.id, nombre: s.nombre })),
    })).filter(c => c.sucursales.length > 0),
    [clientes]);

  /** Clientes visibles según búsqueda */
  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.toLowerCase().trim();
    if (!q) return arbolClientes;
    return arbolClientes.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.sucursales.some(s => s.nombre.toLowerCase().includes(q))
    );
  }, [arbolClientes, busquedaCliente]);

  /**
   * Tri-state derivado para el checkbox del cliente padre.
   * @param {string} clienteId
   * @param {string[]} branchIds
   * @returns {"checked"|"indeterminate"|"unchecked"}
   */
  const getClienteState = (clienteId, branchIds) => {
    const selected = newUser.sucursalesACargo || [];
    const count = branchIds.filter(id => selected.includes(id)).length;
    if (count === 0) return 'unchecked';
    if (count === branchIds.length) return 'checked';
    return 'indeterminate';
  };

  const toggleCliente = (clienteId, branchIds) => {
    const state = getClienteState(clienteId, branchIds);
    const current = newUser.sucursalesACargo || [];
    const next = state === 'checked'
      ? current.filter(id => !branchIds.includes(id))          // deselect all
      : [...current.filter(id => !branchIds.includes(id)), ...branchIds]; // select all
    setNewUser({ ...newUser, sucursalesACargo: next });
  };

  const toggleSucursal = (sucursalId) => {
    const current = newUser.sucursalesACargo || [];
    const next = current.includes(sucursalId)
      ? current.filter(id => id !== sucursalId)
      : [...current, sucursalId];
    setNewUser({ ...newUser, sucursalesACargo: next });
  };

  const toggleExpanded = (clienteId) => {
    setExpandedClientes(prev => {
      const next = new Set(prev);
      next.has(clienteId) ? next.delete(clienteId) : next.add(clienteId);
      return next;
    });
  };

  /** Chips de sucursales seleccionadas para el resumen (view mode + footer) */
  const sucursalesSeleccionadas = useMemo(() => {
    const selected = newUser.sucursalesACargo || [];
    return arbolClientes.flatMap(c =>
      c.sucursales
        .filter(s => selected.includes(s.id))
        .map(s => ({ id: s.id, nombre: s.nombre, clienteNombre: c.nombre }))
    );
  }, [newUser.sucursalesACargo, arbolClientes]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
      <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
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
        {!isView && (
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 min-w-[120px]"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                viewMode={isView}
                uppercase
                required
              />
              <Input
                label="Apellidos"
                icon={User}
                value={newUser.apellidos}
                onChange={e => setNewUser({ ...newUser, apellidos: e.target.value })}
                viewMode={isView}
                uppercase
              />
              <Input
                label="Email"
                icon={Mail}
                type="email"
                value={newUser.email}
                onChange={e => setNewUser({ ...newUser, email: e.target.value.toLowerCase() })}
                viewMode={isView}
                required
              />
              <PhoneInput
                label="Teléfono"
                countryValue={newUser.telefonoPais || 'CO'}
                phoneValue={newUser.telefono || ''}
                onCountryChange={v => setNewUser({ ...newUser, telefonoPais: v })}
                onPhoneChange={v => setNewUser({ ...newUser, telefono: v })}
                viewMode={isView}
              />
              <Select
                label="Tipo de Documento"
                icon={IdCard}
                options={TIPO_DOCUMENTO_OPTIONS}
                value={newUser.tipoDocumento || ''}
                onChange={e => setNewUser({ ...newUser, tipoDocumento: e.target.value })}
                viewMode={isView}
              />
              <Input
                label="Número de Documento"
                icon={Hash}
                value={newUser.identificacion || ''}
                onChange={e => setNewUser({ ...newUser, identificacion: e.target.value })}
                viewMode={isView}
                inputMode="numeric"
              />
              {isCliente ? (
                <Input
                  label="Rol"
                  icon={Shield}
                  value="Cliente"
                  viewMode={true}
                  required
                />
              ) : (
                <Select
                  label="Rol"
                  icon={Shield}
                  options={roleOptions}
                  value={newUser.rol}
                  onChange={e => {
                    const nuevoRol = e.target.value;
                    setNewUser({ ...newUser, rol: nuevoRol, directorId: '' });
                    if (nuevoRol !== ROLES.TECNICO) setTecnicoDocumentos({ cedula: null, planillaSS: null });
                  }}
                  viewMode={isView}
                  required
                />
              )}
              <Switch
                label="Estado del Usuario"
                checked={!!newUser.activo}
                onChange={checked => setNewUser({ ...newUser, activo: checked })}
                viewMode={isView}
                checkedLabel="Activo"
                uncheckedLabel="Inactivo"
              />
            </div>

            {editingUser && newUser.rol && editingUser.rol && newUser.rol !== editingUser.rol && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <TextSmall className="text-amber-900 font-bold">Cambio de Rol Detectado</TextSmall>
                  <TextTiny className="text-amber-700 leading-relaxed">
                    Estás cambiando el rol de <strong>{roleLabels[editingUser.rol] || editingUser.rol}</strong>{' '}
                    a <strong>{roleLabels[newUser.rol] || newUser.rol}</strong>. Al guardar, el registro anterior
                    quedará inactivo y se creará o reactivará el registro correspondiente al nuevo rol automáticamente.
                  </TextTiny>
                </div>
              </div>
            )}

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

            {newUser.rol === ROLES.COORDINADOR && (
              <>
                <RoleSection icon={Shield} label="Datos del Coordinador" color="blue">
                  <SearchableSelect
                    label="Director Asignado"
                    icon={User}
                    options={activeDirectors.map(d => ({
                      value: d.id,
                      label: d.nombreCompleto
                    }))}
                    value={newUser.directorId || ''}
                    onChange={v => setNewUser({ ...newUser, directorId: v?.value || v || '' })}
                    viewMode={isView}
                    placeholder="Buscar director..."
                  />
                </RoleSection>

                <RoleSection icon={Building2} label="Sucursales a Cargo" color="green">
                  {isView ? (
                    /* ── View mode: chips agrupados por cliente ── */
                    sucursalesSeleccionadas.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Sin sucursales asignadas</p>
                    ) : (
                      <div className="space-y-2">
                        {arbolClientes
                          .filter(c => c.sucursales.some(s => (newUser.sucursalesACargo || []).includes(s.id)))
                          .map(c => (
                            <div key={c.id}>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{c.nombre}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {c.sucursales
                                  .filter(s => (newUser.sucursalesACargo || []).includes(s.id))
                                  .map(s => (
                                    <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 text-green-800 rounded-full text-xs font-medium">
                                      <MapPin size={10} />
                                      {s.nombre}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    )
                  ) : (
                    /* ── Edit mode: árbol jerárquico con tri-state ── */
                    <div className="space-y-2">
                      {/* Buscador */}
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Buscar cliente o sucursal..."
                          value={busquedaCliente}
                          onChange={e => setBusquedaCliente(e.target.value)}
                          className="w-full h-8 pl-8 pr-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                        />
                      </div>

                      {/* Árbol */}
                      {arbolClientes.length === 0 ? (
                        <p className="text-sm text-gray-400 italic py-2">No hay clientes con sucursales disponibles.</p>
                      ) : clientesFiltrados.length === 0 ? (
                        <p className="text-sm text-gray-400 italic py-2">Sin resultados para "{busquedaCliente}".</p>
                      ) : (
                        <div className="rounded-lg border border-gray-200 overflow-hidden max-h-64 overflow-y-auto">
                          {clientesFiltrados.map((c, idx) => {
                            const branchIds = c.sucursales.map(s => s.id);
                            const estado = getClienteState(c.id, branchIds);
                            const isOpen = expandedClientes.has(c.id);
                            const isLast = idx === clientesFiltrados.length - 1;
                            return (
                              <div key={c.id} className={!isLast ? 'border-b border-gray-100' : ''}>
                                {/* Fila cliente (padre) */}
                                <div className={`flex items-center gap-1 px-3 py-2.5 transition-colors ${estado !== 'unchecked' ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                                  {/* Chevron expandir */}
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(c.id)}
                                    className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                                  >
                                    <ChevronRight size={14} className={`transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`} />
                                  </button>
                                  {/* Checkbox tri-state */}
                                  <TriStateCheckbox
                                    estado={estado}
                                    onChange={() => toggleCliente(c.id, branchIds)}
                                  />
                                  {/* Nombre cliente — clic expande */}
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(c.id)}
                                    className="flex-1 text-left text-sm font-semibold text-gray-800 truncate ml-1"
                                  >
                                    {c.nombre}
                                  </button>
                                  {/* Contador */}
                                  <span className="shrink-0 text-xs text-gray-400">
                                    {branchIds.filter(id => (newUser.sucursalesACargo || []).includes(id)).length}/{branchIds.length}
                                  </span>
                                </div>

                                {/* Sucursales hijas */}
                                {isOpen && (
                                  <div className="bg-gray-50/60 border-t border-gray-100 divide-y divide-gray-100">
                                    {c.sucursales.map(s => {
                                      const checked = (newUser.sucursalesACargo || []).includes(s.id);
                                      return (
                                        <label
                                          key={s.id}
                                          className={`flex items-center gap-3 pl-9 pr-3 py-2 cursor-pointer select-none transition-colors ${checked ? 'bg-green-50' : 'hover:bg-white'}`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleSucursal(s.id)}
                                            className="w-3.5 h-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                                          />
                                          <MapPin size={11} className="text-gray-300 shrink-0" />
                                          <span className="text-sm text-gray-700 truncate">{s.nombre}</span>
                                          {checked && <span className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" />}
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Footer: contador + limpiar */}
                      {sucursalesSeleccionadas.length > 0 && (
                        <div className="flex items-center justify-between pt-0.5">
                          <p className="text-xs text-gray-500">
                            <span className="font-semibold text-green-700">{sucursalesSeleccionadas.length}</span> sucursal{sucursalesSeleccionadas.length !== 1 ? 'es' : ''} asignada{sucursalesSeleccionadas.length !== 1 ? 's' : ''}
                          </p>
                          <button
                            type="button"
                            onClick={() => setNewUser({ ...newUser, sucursalesACargo: [] })}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Limpiar todo
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </RoleSection>
              </>
            )}

            {newUser.rol === ROLES.TECNICO && (
              <RoleSection icon={FileText} label="Datos del Técnico" color="orange">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FileUploader
                    label="Cédula / Documento de Identidad"
                    bucket="inmotika"
                    value={tecnicoDocumentos.cedula}
                    viewMode={isView}
                    deferred={true}
                    onChange={(file) => setTecnicoDocumentos(prev => ({ ...prev, cedula: file }))}
                  />
                  <FileUploader
                    label="Planilla de Seguridad Social"
                    bucket="inmotika"
                    value={tecnicoDocumentos.planillaSS}
                    viewMode={isView}
                    deferred={true}
                    onChange={(file) => setTecnicoDocumentos(prev => ({ ...prev, planillaSS: file }))}
                  />
                </div>

                <CertificadosList
                  userId={(editingUser || viewingUser)?.id}
                  items={newUser.certificados || []}
                  viewMode={isView}
                  onChange={certs => setNewUser(prev => ({ ...prev, certificados: certs }))}
                />
              </RoleSection>
            )}
          </Card>
        </div>

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

          {isView && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <User size={20} className="text-gray-600" />
                <Label className="text-base font-bold text-gray-900">Información Adicional</Label>
              </div>
              <div className="space-y-3">
                <div>
                  <TextTiny className="text-gray-500">ID de Usuario</TextTiny>
                  <TextSmall className="text-gray-900 font-semibold">{(viewingUser || editingUser).id}</TextSmall>
                </div>
              </div>
            </Card>
          )}

          {editingUser && !isView && onResendInvitation && (
            <Card className="p-6 border-amber-200/60 bg-amber-50/30">
              <div className="flex flex-col gap-3">
                <Label className="text-sm font-bold text-gray-800">Invitación por correo</Label>
                <TextTiny className="text-gray-600">
                  Si el usuario no recibió el correo o ha expirado el enlace, puede volver a enviar la invitación al mismo correo.
                </TextTiny>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setShowResendModal(true)}
                  disabled={isResending}
                  className="w-full justify-center gap-2 bg-amber-500! hover:bg-amber-600! text-white! border-0 text-sm normal-case tracking-normal"
                >
                  {isResending ? <RefreshCw size={16} className="animate-spin" /> : null}
                  Volver a enviar invitación
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={showResendModal}
        onClose={() => setShowResendModal(false)}
        title="Volver a enviar invitación"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Se enviará un nuevo correo de invitación a <strong>{editingUser?.email}</strong> para que el usuario pueda activar su cuenta o restablecer el acceso.
          </p>
          <p className="text-sm text-gray-500">
            El enlace anterior dejará de ser válido. ¿Desea continuar?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowResendModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="bg-amber-500! hover:bg-amber-600! text-white! border-0 text-sm normal-case"
              onClick={async () => {
                if (editingUser && onResendInvitation) {
                  await onResendInvitation(editingUser);
                  setShowResendModal(false);
                }
              }}
              disabled={isResending}
            >
              {isResending ? <RefreshCw size={14} className="animate-spin inline mr-1" /> : null}
              Enviar invitación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserForm;
