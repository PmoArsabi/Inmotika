import React from 'react';
import { Users, Monitor, Search, Tag, GitBranch, UserCircle2, CheckCircle2, Plus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { TextSmall, H3 } from '../ui/Typography';
import SearchableSelect from '../ui/SearchableSelect';
import { CheckSelect } from '../shared/FilterBar';
import { useConfirm } from '../../context/ConfirmContext';

/**
 * AssociationModals — renderiza los 5 modales de asociación de ConfigurationNavigator.
 *
 * @param {object} props
 * @param {object|null} props.associateContactsModal - Payload del modal (clientId, branchKey) o null
 * @param {string} props.associateContactsSearch
 * @param {Function} props.setAssociateContactsSearch
 * @param {string[]} props.associateContactsSelected
 * @param {Function} props.setAssociateContactsSelected
 * @param {Function} props.onConfirmContacts - (branchKey, selected) => void
 * @param {Function} props.onCloseContactsModal
 * @param {object|null} props.associateDevicesModal - Payload (clientId, branchId, branchKey) o null
 * @param {string} props.associateDevicesSearch
 * @param {Function} props.setAssociateDevicesSearch
 * @param {string[]} props.associateDevicesSelected
 * @param {Function} props.setAssociateDevicesSelected
 * @param {object[]} props.associateDevicesCatFilter
 * @param {Function} props.setAssociateDevicesCatFilter
 * @param {Function} props.onConfirmDevices - (branchKey, selected) => void
 * @param {Function} props.onCloseDevicesModal
 * @param {object|null} props.associateDirectorsModal - Payload (key, allDirectors) o null
 * @param {string} props.associateDirectorsSearch
 * @param {Function} props.setAssociateDirectorsSearch
 * @param {string[]} props.associateDirectorsSelected
 * @param {Function} props.setAssociateDirectorsSelected
 * @param {Function} props.onConfirmDirectors - (key, selected) => void
 * @param {Function} props.onCloseDirectorsModal
 * @param {object|null} props.clientContactsModal - Payload (clientId, branches) o null
 * @param {string} props.clientContactsSearch
 * @param {Function} props.setClientContactsSearch
 * @param {object[]} props.clientContactsSedeFilter
 * @param {Function} props.setClientContactsSedeFilter
 * @param {Function} props.onCloseClientContactsModal - () => void — limpia estado y cierra
 * @param {Function} props.onCreateContact - (clientId) => void — abre formulario de nuevo contacto
 * @param {object|null} props.clientDevicesModal - Payload (clientId, branches) o null
 * @param {string} props.clientDevicesSearch
 * @param {Function} props.setClientDevicesSearch
 * @param {object[]} props.clientDevicesCatFilter
 * @param {Function} props.setClientDevicesCatFilter
 * @param {object[]} props.clientDevicesSedeFilter
 * @param {Function} props.setClientDevicesSedeFilter
 * @param {Function} props.onCloseClientDevicesModal - () => void
 * @param {Function} props.onCreateDevice - (clientId) => void
 * @param {object} props.data - MasterData completo
 * @param {boolean} props.associateSuccess
 */
const AssociationModals = ({
  // contacts modal
  associateContactsModal,
  associateContactsSearch,
  setAssociateContactsSearch,
  associateContactsSelected,
  setAssociateContactsSelected,
  onConfirmContacts,
  onCloseContactsModal,
  // devices modal
  associateDevicesModal,
  associateDevicesSearch,
  setAssociateDevicesSearch,
  associateDevicesSelected,
  setAssociateDevicesSelected,
  associateDevicesCatFilter,
  setAssociateDevicesCatFilter,
  onConfirmDevices,
  onCloseDevicesModal,
  // directors modal
  associateDirectorsModal,
  associateDirectorsSearch,
  setAssociateDirectorsSearch,
  associateDirectorsSelected,
  setAssociateDirectorsSelected,
  onConfirmDirectors,
  onCloseDirectorsModal,
  // coordinadores modal (sucursal → coordinadores)
  associateCoordinadoresModal,
  associateCoordinadoresSearch,
  setAssociateCoordinadoresSearch,
  associateCoordinadoresSelected,
  setAssociateCoordinadoresSelected,
  onConfirmCoordinadores,
  onCloseCoordinadoresModal,
  // client-level modals
  clientContactsModal,
  clientContactsSearch,
  setClientContactsSearch,
  clientContactsSedeFilter,
  setClientContactsSedeFilter,
  clientContactsSelected,
  setClientContactsSelected,
  onConfirmClientContacts,
  onCloseClientContactsModal,
  onCreateContact,
  clientDevicesModal,
  clientDevicesSearch,
  setClientDevicesSearch,
  clientDevicesCatFilter,
  setClientDevicesCatFilter,
  clientDevicesSedeFilter,
  setClientDevicesSedeFilter,
  clientDevicesSelected,
  setClientDevicesSelected,
  onConfirmClientDevices,
  onCloseClientDevicesModal,
  onCreateDevice,
  // data
  data,
}) => {
  const confirm = useConfirm();
  return (
<>
      {/* Associate Contacts Modal */}
      {associateContactsModal && (() => {
        const clientId = associateContactsModal.clientId;
        const clienteObj = (data?.clientes || []).find(c => String(c.id) === String(clientId));
        const contactosPorCliente = (() => {
          const seen = new Set();
          const result = [];
          (clienteObj?.sucursales || []).forEach(s => {
            (s.contactos || []).forEach(ct => {
              if (!seen.has(String(ct.id))) {
                seen.add(String(ct.id));
                result.push(ct);
              }
            });
          });
          (data?.contactos || []).forEach(ct => {
            const ctClientId = ct.clientId || ct.cliente_id;
            if (String(ctClientId) === String(clientId) && !seen.has(String(ct.id))) {
              seen.add(String(ct.id));
              result.push(ct);
            }
          });
          return result;
        })();
        const q = associateContactsSearch.toLowerCase();
        const filtered = contactosPorCliente.filter(ct =>
          !q ||
          (ct.nombres || ct.nombre || '').toLowerCase().includes(q) ||
          (ct.apellidos || ct.apellido || '').toLowerCase().includes(q) ||
          (ct.email || '').toLowerCase().includes(q)
        );
        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <Card className="max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 rounded-lg"><Users size={20} className="text-brand" /></div>
                <H3 className="normal-case">Asociar Contactos</H3>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm"
                    placeholder="Buscar contacto por nombre o email..."
                    value={associateContactsSearch}
                    onChange={(e) => setAssociateContactsSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-70 overflow-y-auto space-y-2 pr-1">
                  {filtered.length === 0 && (
                    <div className="text-center py-8">
                      <Users size={32} className="mx-auto text-gray-300 mb-2" />
                      <TextSmall className="text-gray-400">No hay contactos disponibles</TextSmall>
                    </div>
                  )}
                  {filtered.map(ct => {
                    const isSelected = associateContactsSelected.includes(String(ct.id));
                    const nombre = [ct.nombres || ct.nombre, ct.apellidos || ct.apellido].filter(Boolean).join(' ') || ct.email || 'Contacto';
                    return (
                      <div
                        key={ct.id}
                        onClick={() => setAssociateContactsSelected(prev =>
                          prev.includes(String(ct.id)) ? prev.filter(id => id !== String(ct.id)) : [...prev, String(ct.id)]
                        )}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected ? 'border-brand bg-red-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {(nombre[0] || 'C').toUpperCase()}
                          </div>
                          <div>
                            <TextSmall className="font-bold text-gray-900">{nombre}</TextSmall>
                            {ct.email && <TextSmall className="text-gray-500 text-2xs">{ct.email}</TextSmall>}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-brand" />}
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    onClick={() => onConfirmContacts(associateContactsModal.branchKey, associateContactsSelected)}
                    className="w-full bg-canvas hover:bg-brand text-white"
                  >
                    Confirmar
                  </Button>
                  <Button onClick={onCloseContactsModal} variant="ghost" className="w-full">Cancelar</Button>
                </div>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* Associate Devices Modal */}
      {associateDevicesModal && (() => {
        const clienteId = associateDevicesModal.clientId;
        const currentBranchId = associateDevicesModal.branchId;
        const dispositivos = (data?.dispositivos || []).filter(d => {
          if (clienteId && String(d.clientId || d.cliente_id) !== String(clienteId)) return false;
          const dBranchId = d.branchId || d.sucursal_id;
          if (dBranchId && currentBranchId && String(dBranchId) !== String(currentBranchId)) return false;
          return true;
        });
        const catOptions = [...new Map(
          dispositivos
            .filter(d => d.categoriaId && d.categoria?.nombre)
            .map(d => [d.categoriaId, d.categoria.nombre])
        ).entries()].map(([id, nombre]) => ({ value: id, label: nombre }));

        const q = associateDevicesSearch.toLowerCase();
        const catFilterIds = new Set(associateDevicesCatFilter.map(o => o.value));
        const filtered = dispositivos.filter(d => {
          if (catFilterIds.size > 0 && !catFilterIds.has(d.categoriaId)) return false;
          return !q ||
            (d.descripcion || '').toLowerCase().includes(q) ||
            (d.serial || '').toLowerCase().includes(q) ||
            (d.idInmotika || d.id_inmotika || '').toLowerCase().includes(q);
        });
        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <Card className="max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 rounded-lg"><Monitor size={20} className="text-brand" /></div>
                <H3 className="normal-case">Asociar Dispositivos</H3>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm"
                    placeholder="Buscar dispositivo por descripción o serial..."
                    value={associateDevicesSearch}
                    onChange={(e) => setAssociateDevicesSearch(e.target.value)}
                  />
                </div>
                {catOptions.length > 0 && (
                  <SearchableSelect
                    placeholder="Filtrar por categoría..."
                    options={catOptions}
                    value={associateDevicesCatFilter}
                    onChange={setAssociateDevicesCatFilter}
                    isMulti
                    icon={Tag}
                  />
                )}
                <div className="max-h-65 overflow-y-auto space-y-2 pr-1">
                  {filtered.length === 0 && (
                    <div className="text-center py-8">
                      <Monitor size={32} className="mx-auto text-gray-300 mb-2" />
                      <TextSmall className="text-gray-400">No hay dispositivos disponibles</TextSmall>
                    </div>
                  )}
                  {filtered.map(d => {
                    const isSelected = associateDevicesSelected.includes(String(d.id));
                    const label = d.descripcion || d.serial || d.idInmotika || 'Dispositivo';
                    const categoriaNombre = d.categoria?.nombre || d.categoriaNombre || null;
                    return (
                      <div
                        key={d.id}
                        onClick={() => setAssociateDevicesSelected(prev =>
                          prev.includes(String(d.id)) ? prev.filter(id => id !== String(d.id)) : [...prev, String(d.id)]
                        )}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected ? 'border-brand bg-red-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'}`}>
                            <Monitor size={14} />
                          </div>
                          <div>
                            <TextSmall className="font-bold text-gray-900">{label}</TextSmall>
                            {categoriaNombre && <TextSmall className="text-gray-500 text-2xs">{categoriaNombre}</TextSmall>}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-brand" />}
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    onClick={() => onConfirmDevices(associateDevicesModal.branchKey, associateDevicesSelected)}
                    className="w-full bg-canvas hover:bg-brand text-white"
                  >
                    Confirmar
                  </Button>
                  <Button onClick={onCloseDevicesModal} variant="ghost" className="w-full">Cancelar</Button>
                </div>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* Associate Directors Modal */}
      {associateDirectorsModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <Users size={20} className="text-brand" />
              </div>
              <H3 className="normal-case">Asociar Directores</H3>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm"
                  placeholder="Buscar director por nombre..."
                  value={associateDirectorsSearch}
                  onChange={(e) => setAssociateDirectorsSearch(e.target.value)}
                />
              </div>
              <div className="max-h-75 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {associateDirectorsModal.allDirectors
                  .filter(d =>
                    !associateDirectorsSearch ||
                    (d.nombreCompleto || '').toLowerCase().includes(associateDirectorsSearch.toLowerCase())
                  )
                  .map(dir => {
                    const isSelected = associateDirectorsSelected.includes(dir.id);
                    return (
                      <div
                        key={dir.id}
                        onClick={() => {
                          setAssociateDirectorsSelected(prev =>
                            prev.includes(dir.id) ? prev.filter(id => id !== dir.id) : [...prev, dir.id]
                          );
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected ? 'border-brand bg-red-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {(dir.nombres?.[0] || 'D').toUpperCase()}
                          </div>
                          <div>
                            <TextSmall className="font-bold text-gray-900">{dir.nombres} {dir.apellidos}</TextSmall>
                            <TextSmall className="text-gray-500 text-2xs break-all font-medium">{dir.email}</TextSmall>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-brand" />}
                      </div>
                    );
                  })}
                {associateDirectorsModal.allDirectors.length === 0 && (
                  <div className="text-center py-8">
                    <Users size={32} className="mx-auto text-gray-300 mb-2" />
                    <TextSmall className="text-gray-400">No hay directores disponibles</TextSmall>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={() => onConfirmDirectors(associateDirectorsModal.key, associateDirectorsSelected)}
                  variant="success"
                  className="w-full bg-canvas hover:bg-brand"
                >
                  Confirmar
                </Button>
                <Button onClick={onCloseDirectorsModal} variant="ghost" className="w-full">
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Client Contacts Modal */}
      {clientContactsModal && (() => {
        const { clientKey, clientId, branches } = clientContactsModal;
        const allContacts = (() => {
          const seen = new Map();
          (branches || []).forEach(s => {
            (s.contactos || []).forEach(ct => {
              if (!seen.has(String(ct.id))) seen.set(String(ct.id), { ...ct, branchId: String(s.id), branchName: s.nombre });
            });
          });
          return [...seen.values()];
        })();
        const sedeOptions = (branches || []).filter(b => b.id && b.nombre).map(b => ({ value: String(b.id), label: b.nombre }));
        const sedeFilterIds = new Set(clientContactsSedeFilter);
        const q = clientContactsSearch.toLowerCase();
        const filtered = allContacts.filter(ct => {
          if (sedeFilterIds.size > 0 && !sedeFilterIds.has(ct.branchId)) return false;
          const nombre = ((ct.nombre || ct.nombres || '') + ' ' + (ct.apellido || ct.apellidos || '')).toLowerCase();
          return !q || nombre.includes(q) || (ct.email || '').toLowerCase().includes(q) || (ct.cargo || '').toLowerCase().includes(q);
        });
        const originalSelected = clientContactsModal._originalSelected;
        const isDirty = JSON.stringify([...clientContactsSelected].sort()) !== JSON.stringify([...originalSelected].sort());

        const handleClose = async () => {
          if (isDirty) {
            const ok = await confirm({ title: 'Cambios sin confirmar', message: 'Tienes cambios sin confirmar. ¿Salir sin aplicarlos?', confirmText: 'Salir', cancelText: 'Seguir editando', type: 'warning' });
            if (!ok) return;
          }
          onCloseClientContactsModal();
        };

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <Card className="max-w-lg w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg"><UserCircle2 size={20} className="text-brand" /></div>
                  <h3 className="font-bold text-gray-900">Contactos del Cliente</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onCreateContact(clientId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-canvas hover:bg-brand text-white rounded-md text-xs font-bold uppercase tracking-wide transition-colors shrink-0"
                >
                  <Plus size={12} /> Crear contacto
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="Buscar por nombre, cargo o email..."
                      value={clientContactsSearch}
                      onChange={e => setClientContactsSearch(e.target.value)}
                    />
                  </div>
                  {sedeOptions.length > 0 && (
                    <CheckSelect
                      placeholder="Sucursal..."
                      options={sedeOptions}
                      value={clientContactsSedeFilter}
                      onChange={setClientContactsSedeFilter}
                    />
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {filtered.length === 0 ? (
                    <div className="text-center py-10">
                      <UserCircle2 size={32} className="mx-auto text-gray-300 mb-2" />
                      <TextSmall className="text-gray-400">{allContacts.length === 0 ? 'Sin contactos registrados.' : 'Sin resultados.'}</TextSmall>
                    </div>
                  ) : filtered.map(ct => {
                    const nombre = [ct.nombre || ct.nombres, ct.apellido || ct.apellidos].filter(Boolean).join(' ') || ct.email || 'Contacto';
                    const isSelected = clientContactsSelected.includes(String(ct.id));
                    return (
                      <div
                        key={ct.id}
                        onClick={() => setClientContactsSelected(prev =>
                          prev.includes(String(ct.id)) ? prev.filter(id => id !== String(ct.id)) : [...prev, String(ct.id)]
                        )}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected ? 'border-brand bg-red-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isSelected ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {(nombre[0] || 'C').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <TextSmall className="font-semibold text-gray-900 truncate">{nombre}</TextSmall>
                            <div className="flex flex-wrap gap-2 mt-0.5">
                              {ct.cargo && <span className="text-2xs text-gray-400">{ct.cargo}</span>}
                              {ct.branchName && (
                                <span className="flex items-center gap-0.5 text-2xs text-gray-400">
                                  <GitBranch size={9} />{ct.branchName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-brand shrink-0" />}
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    onClick={() => onConfirmClientContacts(clientKey, clientContactsSelected)}
                    className="w-full bg-canvas hover:bg-brand text-white"
                  >
                    Confirmar
                  </Button>
                  <Button onClick={handleClose} variant="ghost" className="w-full">Cancelar</Button>
                </div>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* Client Devices Modal */}
      {clientDevicesModal && (() => {
        const { clientKey, clientId, branches } = clientDevicesModal;
        const allDevices = (data?.dispositivos || []).filter(d => {
          const dClientId = String(d.clientId || d.cliente_id || '');
          return dClientId === String(clientId) || !dClientId || dClientId === 'null' || dClientId === 'undefined';
        });
        const catOptions = [...new Map(
          allDevices.filter(d => d.categoriaId && (d.categoria?.nombre || d.categoriaNombre))
            .map(d => [String(d.categoriaId), d.categoria?.nombre || d.categoriaNombre])
        ).entries()].map(([value, label]) => ({ value, label }));
        const sedeOptions = (branches || []).filter(b => b.id && b.nombre).map(b => ({ value: String(b.id), label: b.nombre }));
        const catFilterIds = new Set(clientDevicesCatFilter);
        const sedeFilterIds = new Set(clientDevicesSedeFilter);
        const q = clientDevicesSearch.toLowerCase();
        const filtered = allDevices.filter(d => {
          if (catFilterIds.size > 0 && !catFilterIds.has(String(d.categoriaId))) return false;
          if (sedeFilterIds.size > 0 && !sedeFilterIds.has(String(d.branchId || d.sucursal_id || ''))) return false;
          return !q ||
            (d.descripcion || '').toLowerCase().includes(q) ||
            (d.serial || '').toLowerCase().includes(q) ||
            (d.idInmotika || d.id_inmotika || '').toLowerCase().includes(q);
        });
        const originalSelected = clientDevicesModal._originalSelected;
        const isDirty = JSON.stringify([...clientDevicesSelected].sort()) !== JSON.stringify([...originalSelected].sort());

        const handleClose = async () => {
          if (isDirty) {
            const ok = await confirm({ title: 'Cambios sin confirmar', message: 'Tienes cambios sin guardar. ¿Salir sin confirmar?' });
            if (!ok) return;
          }
          onCloseClientDevicesModal();
        };

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <Card className="max-w-lg w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg"><Monitor size={20} className="text-brand" /></div>
                  <h3 className="font-bold text-gray-900">Dispositivos del Cliente</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onCreateDevice(clientId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-canvas hover:bg-brand text-white rounded-md text-xs font-bold uppercase tracking-wide transition-colors shrink-0"
                >
                  <Plus size={12} /> Agregar
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative sm:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="Buscar..."
                      value={clientDevicesSearch}
                      onChange={e => setClientDevicesSearch(e.target.value)}
                    />
                  </div>
                  {catOptions.length > 0 && (
                    <CheckSelect
                      placeholder="Categoría..."
                      options={catOptions}
                      value={clientDevicesCatFilter}
                      onChange={setClientDevicesCatFilter}
                    />
                  )}
                  {sedeOptions.length > 0 && (
                    <CheckSelect
                      placeholder="Sucursal..."
                      options={sedeOptions}
                      value={clientDevicesSedeFilter}
                      onChange={setClientDevicesSedeFilter}
                    />
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {filtered.length === 0 ? (
                    <div className="text-center py-10">
                      <Monitor size={32} className="mx-auto text-gray-300 mb-2" />
                      <TextSmall className="text-gray-400">{allDevices.length === 0 ? 'Sin dispositivos registrados.' : 'Sin resultados.'}</TextSmall>
                    </div>
                  ) : filtered.map(d => {
                    const label = d.descripcion || d.serial || d.idInmotika || 'Dispositivo';
                    const cat = d.categoria?.nombre || d.categoriaNombre || null;
                    const sedeName = (branches || []).find(b => String(b.id) === String(d.branchId || d.sucursal_id || ''))?.nombre || null;
                    const isSelected = clientDevicesSelected.includes(String(d.id));
                    const dClientId = String(d.clientId || d.cliente_id || '');
                    const isOwned = dClientId === String(clientId);
                    const isAvailable = !isOwned;
                    return (
                      <div
                        key={d.id}
                        onClick={() => setClientDevicesSelected(prev =>
                          prev.includes(String(d.id)) ? prev.filter(id => id !== String(d.id)) : [...prev, String(d.id)]
                        )}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected ? 'border-brand bg-red-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand' : 'bg-gray-200'}`}>
                            <Monitor size={14} className={isSelected ? 'text-white' : 'text-gray-500'} />
                          </div>
                          <div className="min-w-0">
                            <TextSmall className="font-semibold text-gray-900 truncate">{label}</TextSmall>
                            <div className="flex flex-wrap gap-2 mt-0.5">
                              {cat && <span className="flex items-center gap-0.5 text-2xs text-gray-400"><Tag size={9} />{cat}</span>}
                              {sedeName && <span className="flex items-center gap-0.5 text-2xs text-gray-400"><GitBranch size={9} />{sedeName}</span>}
                              {isAvailable && <span className="text-2xs text-emerald-600 font-medium">Disponible</span>}
                            </div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-brand shrink-0" />}
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    onClick={() => onConfirmClientDevices(clientKey, clientDevicesSelected)}
                    className="w-full bg-canvas hover:bg-brand text-white"
                  >
                    Confirmar
                  </Button>
                  <Button onClick={handleClose} variant="ghost" className="w-full">Cancelar</Button>
                </div>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* Associate Coordinadores Modal (sucursal → coordinadores) */}
      {associateCoordinadoresModal && (() => {
        const allCoordinadores = associateCoordinadoresModal.allCoordinadores || [];
        const q = (associateCoordinadoresSearch || '').toLowerCase();
        const filtered = allCoordinadores.filter(c =>
          !q ||
          (c.nombres || '').toLowerCase().includes(q) ||
          (c.apellidos || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q)
        );
        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <Card className="max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 rounded-lg">
                  <UserCircle2 size={20} className="text-brand" />
                </div>
                <H3 className="normal-case">Asociar Coordinadores</H3>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm"
                    placeholder="Buscar coordinador por nombre o email..."
                    value={associateCoordinadoresSearch}
                    onChange={e => setAssociateCoordinadoresSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-70 overflow-y-auto space-y-2 pr-1">
                  {filtered.length === 0 && (
                    <div className="text-center py-8">
                      <UserCircle2 size={32} className="mx-auto text-gray-300 mb-2" />
                      <TextSmall className="text-gray-400">No hay coordinadores disponibles</TextSmall>
                    </div>
                  )}
                  {filtered.map(c => {
                    const isSelected = (associateCoordinadoresSelected || []).includes(String(c.coordinadorId));
                    const nombre = [c.nombres, c.apellidos].filter(Boolean).join(' ') || c.email || 'Coordinador';
                    return (
                      <div
                        key={c.coordinadorId}
                        onClick={() => setAssociateCoordinadoresSelected(prev =>
                          prev.includes(String(c.coordinadorId))
                            ? prev.filter(id => id !== String(c.coordinadorId))
                            : [...prev, String(c.coordinadorId)]
                        )}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected ? 'border-brand bg-red-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {(nombre[0] || 'C').toUpperCase()}
                          </div>
                          <div>
                            <TextSmall className="font-bold text-gray-900">{nombre}</TextSmall>
                            {c.email && <TextSmall className="text-gray-500 text-2xs">{c.email}</TextSmall>}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-brand" />}
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    onClick={() => onConfirmCoordinadores(associateCoordinadoresModal.branchKey, associateCoordinadoresSelected)}
                    className="w-full bg-canvas hover:bg-brand text-white"
                  >
                    Confirmar
                  </Button>
                  <Button onClick={onCloseCoordinadoresModal} variant="ghost" className="w-full">Cancelar</Button>
                </div>
              </div>
            </Card>
          </div>
        );
      })()}
    </>
  );
};

export default AssociationModals;
