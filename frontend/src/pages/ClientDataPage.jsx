import { useState } from 'react';
import { Building2, MapPin, Hash, Briefcase, UserCircle2, Info, Eye, Globe, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import IconButton from '../components/ui/IconButton';
import InfoField from '../components/ui/InfoField';
import SectionHeader from '../components/ui/SectionHeader';
import { BranchForm } from '../components/forms/BranchForm';
import { Subtitle, TextSmall } from '../components/ui/Typography';
import { useClienteData } from '../hooks/useClienteData';
import { toBranchDraft } from '../utils/entityMappers';

/**
 * Vista de datos corporativos y red de sucursales para el usuario con rol CLIENTE.
 * Campos de cliente en BD: razon_social, nit, dv, tipo_documento, direccion, pais, estado_depto, ciudad
 * Campos de sucursal en BD: nombre, direccion, ciudad, estado_depto, pais, es_principal, clasificacion, horarios_atencion, contrato
 */
const ClientDataPage = () => {
  const { cliente, sucursales, contacto, dispositivos, loading } = useClienteData();
  const [selectedSucursal, setSelectedSucursal] = useState(null);

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
  const formatUbicacion = (obj) => {
    return [obj?.ciudad, obj?.estado_depto, obj?.pais].filter(Boolean).join(', ') || null;
  };

  // ── Vista de detalle de sucursal (inline, sin modal) ──────────────────────
  if (selectedSucursal) {
    // Enriquecer la sucursal con contactos extraídos del join contacto_sucursal
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
      <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
        <button
          onClick={() => setSelectedSucursal(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#D32F2F] transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a Mis Datos
        </button>
        <BranchForm
          newBranchDraft={draft}
          updateNewBranchDraft={() => {}}
          isEditing={false}
          isSaving={false}
          editingBranchId={selectedSucursal.id}
          onCancelEdit={() => setSelectedSucursal(null)}
        />
      </div>
    );
  }

  // ── Vista principal ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
      <div className="flex justify-between items-center mb-4">
        <SectionHeader
          title="Datos Corporativos"
          subtitle="Información registrada en el sistema"
        />
        <div className="p-3 bg-blue-50 text-blue-600 rounded-md"><Building2 size={24} /></div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Razón Social"         value={cliente.razon_social}  icon={Briefcase} />
          <InfoField label="NIT / Identificación" value={cliente.nit ? `${cliente.nit}${cliente.dv ? `-${cliente.dv}` : ''}` : null} icon={Hash} />
          <InfoField label="Tipo de Documento"    value={cliente.tipo_documento} icon={Hash} />
          <InfoField label="Dirección"            value={cliente.direccion}      icon={MapPin} />
          <InfoField label="Ubicación"            value={formatUbicacion(cliente)} icon={Globe} />
        </div>
      </Card>

      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-md text-gray-500"><MapPin size={18} /></div>
          <SectionHeader title="Red de Sucursales" subtitle="Sedes vinculadas al contrato" />
        </div>

        <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
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
                  const nombreContacto = contacto
                    ? `${contacto.nombres || ''} ${contacto.apellidos || ''}`.trim()
                    : null;
                  const telefonoContacto = contacto?.telefono_movil || null;
                  const ubicacion = formatUbicacion(sucursal);

                  return (
                    <Tr key={sucursal.id || idx}>
                      <Td>
                        <Subtitle className="text-[#D32F2F] normal-case tracking-normal">
                          {sucursal.nombre}
                          {sucursal.es_principal && (
                            <span className="ml-2 text-xs font-normal text-gray-400">(Principal)</span>
                          )}
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
                              <TextSmall className="text-gray-500">
                                {[nombreContacto, telefonoContacto].filter(Boolean).join(' — ')}
                              </TextSmall>
                            </div>
                          )}
                        </div>
                      </Td>
                      <Td align="right">
                        <IconButton
                          icon={Eye}
                          className="text-gray-300 hover:text-[#D32F2F]"
                          onClick={() => setSelectedSucursal(sucursal)}
                        />
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
      </div>
    </div>
  );
};

export default ClientDataPage;
