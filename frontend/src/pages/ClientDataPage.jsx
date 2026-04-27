import { useState } from 'react';
import { Building2, MapPin, UserCircle2, Eye, Globe, ArrowLeft, Cpu, Users, Search, CheckCircle2 } from 'lucide-react';
import Card from '../components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import IconButton from '../components/ui/IconButton';
import InfoField from '../components/ui/InfoField';
import SectionHeader from '../components/ui/SectionHeader';
import { BranchForm } from '../components/forms/BranchForm';
import { Subtitle, TextSmall, TextTiny, Label } from '../components/ui/Typography';
import SecureImage from '../components/ui/SecureImage';
import { useClienteData } from '../hooks/useClienteData';
import { useActivoInactivo } from '../hooks/useCatalog';
import { toBranchDraft } from '../utils/entityMappers';

/**
 * Vista de datos corporativos y red de sucursales para el usuario con rol CLIENTE.
 */
const ClientDataPage = () => {
  const { cliente, sucursales, contacto, dispositivos, loading } = useClienteData();
  const { activoId, inactivoId } = useActivoInactivo();
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  /** @type {{ type: 'contactos'|'dispositivos', sucursal: object }|null} */
  const [asociacionModal, setAsociacionModal] = useState(null);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-40 bg-gray-100 rounded" />
        <div className="h-48 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-8 text-center text-gray-500">
        Sin datos de empresa asociados. Contacte a su Director de Cuenta.
      </div>
    );
  }

  /** Formatea ciudad + estado_depto + pais en una sola línea */
  const formatUbicacion = (obj) =>
    [obj?.ciudad, obj?.estado_depto, obj?.pais].filter(Boolean).join(', ') || null;

  // ── Modal de asociaciones inline ─────────────────────────────────────────
  const renderAsociacionModal = () => {
    if (!asociacionModal) return null;
    const { type, sucursal } = asociacionModal;
    const isContactos = type === 'contactos';
    const contactosList = (sucursal.contacto_sucursal || []).map(cs => cs.contacto).filter(Boolean);
    const dispositivosList = (dispositivos || []).filter(
      d => String(d.sucursal_id || d.branchId) === String(sucursal.id)
    );
    const items = isContactos ? contactosList : dispositivosList;
    const Icon = isContactos ? Users : Cpu;
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <Card className="max-w-md w-full p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg"><Icon size={20} className="text-brand" /></div>
            <h3 className="font-bold text-gray-900">
              {isContactos ? 'Contactos asociados' : 'Dispositivos asociados'}
            </h3>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <Icon size={32} className="mx-auto text-gray-300 mb-2" />
                <TextSmall className="text-gray-400">Sin {isContactos ? 'contactos' : 'dispositivos'} asociados.</TextSmall>
              </div>
            ) : items.map((item, i) => {
              const nombre = isContactos
                ? [item.nombres, item.apellidos].filter(Boolean).join(' ') || item.email || 'Contacto'
                : item.id_inmotika || item.serial || item.codigo_unico || String(item.id);
              const sub = isContactos ? item.email : item.modelo;
              return (
                <div key={item.id || i} className="flex items-center gap-3 p-3 rounded-lg border border-brand bg-red-50">
                  <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {(nombre[0] || '?').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <TextSmall className="font-bold text-gray-900 truncate">{nombre}</TextSmall>
                    {sub && <TextSmall className="text-gray-500 text-2xs truncate">{sub}</TextSmall>}
                  </div>
                  <CheckCircle2 size={18} className="text-brand shrink-0 ml-auto" />
                </div>
              );
            })}
          </div>
          <div className="pt-4">
            <button onClick={() => setAsociacionModal(null)} className="w-full py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cerrar
            </button>
          </div>
        </Card>
      </div>
    );
  };

  // ── Vista de detalle de sucursal ──────────────────────────────────────────
  if (selectedSucursal) {
    const contactosDeSucursal = (selectedSucursal.contacto_sucursal || [])
      .map(cs => cs.contacto)
      .filter(Boolean);
    const draft = {
      ...toBranchDraft(selectedSucursal),
      associatedContactIds: contactosDeSucursal.map(c => String(c.id)),
      associatedDeviceIds: (dispositivos || [])
        .filter(d => String(d.sucursal_id || d.branchId) === String(selectedSucursal.id))
        .map(d => String(d.id)),
    };
    return (
      <>
        <div className="space-y-4 animate-in slide-in-from-right-8 duration-300 max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedSucursal(null)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand transition-colors"
          >
            <ArrowLeft size={16} />
            Volver a Mis Datos
          </button>
          <Card className="p-6">
            <BranchForm
              newBranchDraft={draft}
              updateNewBranchDraft={() => {}}
              newBranchErrors={{}}
              showErrors={false}
              isEditing={false}
              isSaving={false}
              activoId={activoId}
              inactivoId={inactivoId}
              onAssociateContacts={() => setAsociacionModal({ type: 'contactos', sucursal: selectedSucursal })}
              onAssociateDevices={() => setAsociacionModal({ type: 'dispositivos', sucursal: selectedSucursal })}
            />
          </Card>
        </div>
        {renderAsociacionModal()}
      </>
    );
  }

  // ── Vista principal ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
      <SectionHeader
        title="Datos Corporativos"
        subtitle="Información registrada en el sistema"
      />

      {/* Tarjeta compacta del cliente — logo a la izquierda, datos a la derecha */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Logo */}
          <div className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
            {cliente.logo_url ? (
              <SecureImage
                path={cliente.logo_url}
                alt="Logo empresa"
                className="w-full h-full object-cover"
                fallback={<Building2 size={36} className="text-gray-300" />}
              />
            ) : (
              <Building2 size={36} className="text-gray-300" />
            )}
          </div>

          {/* Datos — grid compacto */}
          <div className="flex-1 min-w-0 grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            <div className="min-w-0">
              <Label className="text-gray-400 uppercase tracking-wider text-2xs block mb-0.5">Razón Social</Label>
              <TextSmall className="font-bold text-gray-900 truncate">{cliente.razon_social || '—'}</TextSmall>
            </div>
            <div className="min-w-0">
              <Label className="text-gray-400 uppercase tracking-wider text-2xs block mb-0.5">NIT / Identificación</Label>
              <TextSmall className="font-semibold text-gray-700">
                {cliente.nit ? `${cliente.nit}${cliente.dv ? `-${cliente.dv}` : ''}` : '—'}
              </TextSmall>
            </div>
            <div className="min-w-0">
              <Label className="text-gray-400 uppercase tracking-wider text-2xs block mb-0.5">Tipo Documento</Label>
              <TextSmall className="font-semibold text-gray-700">{cliente.tipo_documento || '—'}</TextSmall>
            </div>
            <div className="min-w-0">
              <Label className="text-gray-400 uppercase tracking-wider text-2xs block mb-0.5">Dirección</Label>
              <TextSmall className="font-semibold text-gray-700 truncate">{cliente.direccion || '—'}</TextSmall>
            </div>
            <div className="min-w-0 col-span-1 lg:col-span-2">
              <Label className="text-gray-400 uppercase tracking-wider text-2xs block mb-0.5">Ubicación</Label>
              <TextSmall className="font-semibold text-gray-700">{formatUbicacion(cliente) || '—'}</TextSmall>
            </div>
          </div>
        </div>
      </Card>

      {/* Red de Sucursales */}
      <div className="space-y-4 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-3 pt-2">
          <div className="p-2 bg-gray-100 rounded-md text-gray-500"><MapPin size={18} /></div>
          <SectionHeader title="Red de Sucursales" subtitle="Sedes vinculadas al contrato" />
        </div>

        {/* Desktop: tabla */}
        <Card className="hidden md:block p-0 overflow-hidden rounded-md border-none shadow-xl">
          <Table>
            <THead variant="light">
              <tr>
                <Th>Nombre / Sede</Th>
                <Th>Ubicación y Contacto</Th>
                <Th align="right">Acción</Th>
              </tr>
            </THead>
            <TBody>
              {sucursales.length > 0 ? (
                sucursales.map((sucursal, idx) => {
                  const nombreContacto   = contacto ? `${contacto.nombres || ''} ${contacto.apellidos || ''}`.trim() : null;
                  const telefonoContacto = contacto?.telefono_movil || null;
                  const ubicacion        = formatUbicacion(sucursal);
                  return (
                    <Tr key={sucursal.id || idx}>
                      <Td>
                        <Subtitle className="text-brand normal-case tracking-normal">
                          {sucursal.nombre}
                          {sucursal.es_principal && <span className="ml-2 text-xs font-normal text-gray-400">(Principal)</span>}
                        </Subtitle>
                        <TextSmall className="text-gray-400 mt-0.5">{ubicacion}</TextSmall>
                      </Td>
                      <Td>
                        <div className="flex flex-col gap-0.5">
                          {sucursal.direccion && (
                            <div className="flex items-center gap-2">
                              <MapPin size={10} className="text-gray-400" />
                              <TextSmall className="text-gray-700 font-bold">{sucursal.direccion}</TextSmall>
                            </div>
                          )}
                          {(nombreContacto || telefonoContacto) && (
                            <div className="flex items-center gap-2">
                              <UserCircle2 size={10} className="text-gray-400" />
                              <TextSmall className="text-gray-500">{[nombreContacto, telefonoContacto].filter(Boolean).join(' — ')}</TextSmall>
                            </div>
                          )}
                        </div>
                      </Td>
                      <Td align="right">
                        <IconButton icon={Eye} className="text-gray-300 hover:text-brand" onClick={() => setSelectedSucursal(sucursal)} />
                      </Td>
                    </Tr>
                  );
                })
              ) : (
                <Tr>
                  <Td colSpan={3} className="text-center py-8">
                    <TextSmall className="text-gray-400 italic">No hay sucursales vinculadas</TextSmall>
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        </Card>

        {/* Mobile: cards */}
        {sucursales.length > 0 ? (
          <div className="flex flex-col gap-4 md:hidden">
            {sucursales.map((sucursal, idx) => {
              const nombreContacto   = contacto ? `${contacto.nombres || ''} ${contacto.apellidos || ''}`.trim() : null;
              const telefonoContacto = contacto?.telefono_movil || null;
              const ubicacion        = formatUbicacion(sucursal);
              return (
                <Card key={sucursal.id || idx} className="p-5 border border-gray-200 shadow-sm rounded-2xl">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <Subtitle className="text-brand normal-case tracking-normal truncate">{sucursal.nombre}</Subtitle>
                      {sucursal.es_principal && <TextTiny className="text-gray-400">(Principal)</TextTiny>}
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50 mb-4">
                    {ubicacion && (
                      <div className="flex items-center gap-2 py-2 first:pt-0">
                        <Globe size={13} className="text-gray-300 shrink-0" />
                        <TextTiny className="text-gray-600">{ubicacion}</TextTiny>
                      </div>
                    )}
                    {sucursal.direccion && (
                      <div className="flex items-center gap-2 py-2">
                        <MapPin size={13} className="text-gray-300 shrink-0" />
                        <TextTiny className="text-gray-700 font-semibold">{sucursal.direccion}</TextTiny>
                      </div>
                    )}
                    {(nombreContacto || telefonoContacto) && (
                      <div className="flex items-center gap-2 py-2 last:pb-0">
                        <UserCircle2 size={13} className="text-gray-300 shrink-0" />
                        <TextTiny className="text-gray-500">{[nombreContacto, telefonoContacto].filter(Boolean).join(' — ')}</TextTiny>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedSucursal(sucursal)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 hover:border-brand hover:text-brand text-gray-600 transition-colors text-xs font-semibold"
                  >
                    <Eye size={14} /> Ver detalle
                  </button>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="md:hidden text-center py-8">
            <TextSmall className="text-gray-400 italic">No hay sucursales vinculadas</TextSmall>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDataPage;
