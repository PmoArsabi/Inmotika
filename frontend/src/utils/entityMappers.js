import { formatFullPhone } from '../components/ui/PhoneInput';

const generateUUID = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

// ─── EMPTY DRAFT FACTORIES ────────────────────────────────────────────────────

export const emptyClientDraft = () => ({
  id: generateUUID(),
  nombre: '',           // razon_social o nombre según tipo_documento
  tipoDocumento: '',    // código: 'CC', 'CE', 'NIT', 'PAS', 'TI', 'PPT'
  nit: '',              // número de identificación (todos los tipos)
  dv: '',               // dígito de verificación (solo NIT)
  celular: '',
  celularPaisIso: 'CO',
  email: '',
  logoUrl: '',
  rutUrl: '',
  certBancariaUrl: '',
  otrosDocumentos: [],  // [{id, nombre, url}]
  fechaNacimiento: '',
  estadoId: '',
  direccion: '',
  pais: 'CO',
  estado_depto: '',
  ciudad: '',
});

export const emptyContractDraft = () => ({
  id: generateUUID(),
  tema: '',
  fechaInicio: '',
  fechaFin: '',
  documentoUrl: '',
  estadoId: '',
});

export const emptyBranchDraft = () => ({
  id: generateUUID(),
  nombre: '',
  direccion: '',
  pais: 'CO',
  estado_depto: '',
  ciudad: '',
  latitud: '',
  longitud: '',
  esPrincipal: false,
  horarioAtencion: null,  // JSONB del SchedulePicker
  estadoId: '',
  contratos: [],          // array de emptyContractDraft()
  associatedContactIds: [],
  associatedDeviceIds: [],
});

export const emptyContactDraft = () => ({
  id: generateUUID(),
  nombres: '',
  apellidos: '',
  tipoDocumento: '',      // código: CC, CE, PAS, TI, NIT, PPT
  identificacion: '',
  generoId: '',           // UUID → catalogo(tipo=GENERO)
  esMarido: false,        // true = casado → muestra fecha aniversario
  cargoId: '',            // UUID → catalogo(tipo=CARGO_CONTACTO)
  descripcionCargo: '',
  email: '',
  telefonoMovil: '',
  telefonoMovilPais: 'CO',
  fechaNacimiento: '',
  fechaMatrimonio: '',    // fecha aniversario — solo visible si esMarido=true
  estadoId: '',           // UUID → catalogo_estado_general (oculto en creación)
  associatedBranchIds: [],
});

export const emptyDeviceDraft = () => ({
  id: generateUUID(),
  clientId: '',
  branchId: '',
  descripcion: '',          // descripción libre del equipo
  serial: '',
  categoriaId: '',          // UUID → categoria_dispositivo
  proveedor: '',            // código: DORLET, MORFO, OTRO
  marca: '',
  linea: '',
  modelo: '',
  imac: '',                 // dirección MAC / IMAC
  identificacionCliente: '', // identificador asignado por el cliente
  esDeInmotika: false,      // true = el equipo pertenece a Inmotika, false = es del cliente
  estadoId: '',             // UUID → catalogo_estado_general
  frecuenciaMantenimientoMeses: '',
  fechaProximoMantenimiento: '',
  notasTecnicas: '',
  pasoAPaso: [],            // [{descripcion, esObligatorio, orden}] — derivado de la categoría
});

export const emptyTecnicoDraft = () => ({
  id: generateUUID(),
  // perfil_usuario
  nombres: '',
  apellidos: '',
  email: '',
  telefono: '',
  telefonoPaisIso: 'CO',
  avatarUrl: '',
  // tecnico
  tipoDocumento: '',
  identificacion: '',
  documentoCedulaUrl: '',
  planillaSegSocialUrl: '',
  certificados: [],        // [{id, nombre, url}]
  estadoId: '',            // UUID → catalogo_estado_general
  usuarioId: '',           // UUID → perfil_usuario.id
});

// ─── FROM-DB CONVERTERS ───────────────────────────────────────────────────────

export const toClientDraft = (client) => {
  if (!client) return emptyClientDraft();
  return {
    ...emptyClientDraft(),
    ...client,
    id: client.id || generateUUID(),
    tipoDocumento: client.tipo_documento || client.tipoDocumento || '',
    nit: client.nit ? client.nit.split('-')[0] : '',
    dv:  client.nit ? (client.nit.split('-')[1] || '') : '',
    otrosDocumentos: Array.isArray(client.otrosDocumentos) ? client.otrosDocumentos : [],
  };
};

export const toBranchDraft = (branch) => {
  if (!branch) return emptyBranchDraft();
  // backward-compat: if DB returns single `contrato` object, wrap it in array
  const rawContratos = branch.contratos
    ? branch.contratos
    : branch.contrato
      ? [{ ...emptyContractDraft(), ...branch.contrato }]
      : [];
  return {
    ...emptyBranchDraft(),
    ...branch,
    id: branch.id || generateUUID(),
    estado_depto: branch.estado_depto || branch.estado || '',
    esPrincipal: branch.esPrincipal ?? branch.es_principal ?? false,
    contratos: rawContratos.map(c => ({ ...emptyContractDraft(), ...c })),
  };
};

export const toContactDraft = (contact) => {
  if (!contact) return emptyContactDraft();

  let telefonoMovil = contact.telefonoMovil || contact.celular || '';
  let telefonoMovilPais = contact.telefonoMovilPais || contact.telefono_movil_pais_iso || 'CO';

  if (telefonoMovil && typeof telefonoMovil === 'string') {
    const match = telefonoMovil.match(/^([A-Z]{2})\+?\d+\s*(.+)$/);
    if (match) {
      telefonoMovilPais = match[1];
      telefonoMovil = match[2].replace(/\D/g, '');
    } else {
      telefonoMovil = telefonoMovil.replace(/\D/g, '');
    }
  }

  return {
    ...emptyContactDraft(),
    ...contact,
    id: contact.id || generateUUID(),
    nombres: contact.nombres || contact.nombre || '',
    apellidos: contact.apellidos || contact.apellido || '',
    telefonoMovil,
    telefonoMovilPais,
  };
};

export const toDeviceDraft = (device, route = null) => ({
  ...emptyDeviceDraft(),
  ...device,
  id: device?.id || generateUUID(),
  clientId: device?.clientId || route?.clientId || '',
  branchId: device?.branchId || route?.branchId || '',
  imac: device?.imac || device?.macAddress || device?.mac_address || '',
  identificacionCliente: device?.identificacionCliente || device?.identificacion_cliente || '',
  esDeInmotika: device?.esDeInmotika ?? device?.es_de_inmotika ?? false,
  frecuenciaMantenimientoMeses: device?.frecuenciaMantenimientoMeses ?? device?.frecuencia ?? '',
  pasoAPaso: Array.isArray(device?.pasoAPaso)
    ? device.pasoAPaso.map((p, i) =>
        typeof p === 'string'
          ? { descripcion: p, esObligatorio: true, orden: i + 1 }
          : p
      )
    : [],
});

export const toTecnicoDraft = (tecnico, perfil) => ({
  ...emptyTecnicoDraft(),
  id: tecnico?.id || generateUUID(),
  nombres: perfil?.nombres || '',
  apellidos: perfil?.apellidos || '',
  email: perfil?.email || '',
  telefono: perfil?.telefono || '',
  telefonoPaisIso: perfil?.telefono_pais_iso || 'CO',
  avatarUrl: perfil?.avatar_url || '',
  tipoDocumento: perfil?.tipo_documento || tecnico?.tipo_documento || '',
  identificacion: perfil?.identificacion || tecnico?.identificacion || '',
  documentoCedulaUrl: tecnico?.documento_cedula_url || '',
  planillaSegSocialUrl: tecnico?.planilla_seg_social_url || '',
  certificados: Array.isArray(tecnico?.tecnico_certificado) 
    ? tecnico.tecnico_certificado.filter(c => c.activo) 
    : (Array.isArray(tecnico?.certificados) ? tecnico.certificados : []),
  estadoId: tecnico?.estado_id || perfil?.estado_id || '',
  usuarioId: perfil?.id || tecnico?.usuario_id || '',
});

// ─── IMMUTABLE STATE UPDATERS ─────────────────────────────────────────────────

export const applyClientUpdate = (prevData, clientId, patch) => {
  const updatedClients = (prevData?.clientes || []).map(c =>
    String(c.id) !== String(clientId) ? c : { ...c, ...patch }
  );
  return { ...prevData, clientes: updatedClients };
};

export const applyTecnicoUpsert = (prevData, tecnicoId, tecnicoDraft) => {
  const current = prevData?.tecnicos || [];
  const exists = current.some(t => String(t.id) === String(tecnicoId));
  const mapped = { ...tecnicoDraft, id: tecnicoId };
  const updated = exists
    ? current.map(t => String(t.id) === String(tecnicoId) ? { ...t, ...mapped } : t)
    : [mapped, ...current];
  return { ...prevData, tecnicos: updated };
};

export const applyBranchUpsert = (prevData, clientId, branchId, branchDraft) => {
  const updatedClients = (prevData?.clientes || []).map(c => {
    if (String(c.id) !== String(clientId)) return c;
    const current = c.sucursales || [];
    const exists = current.some(b => String(b.id) === String(branchId));
    const mapped = { ...branchDraft, id: branchId };
    const upserted = exists
      ? current.map(b => String(b.id) === String(branchId) ? { ...b, ...mapped } : b)
      : [...current, { ...mapped, contactos: [], dispositivos: [] }];
    return { ...c, sucursales: upserted };
  });
  return { ...prevData, clientes: updatedClients };
};

export const applyContactUpsert = (prevData, clientId, branchId, contactId, contactDraft) => {
  const telefonoCompleto = contactDraft.telefonoMovilPais && contactDraft.telefonoMovil
    ? formatFullPhone(contactDraft.telefonoMovilPais, contactDraft.telefonoMovil)
    : contactDraft.telefonoMovil;
  
  const mapped = {
    id: contactId,
    ...contactDraft,
    telefonoMovil: telefonoCompleto,
  };

  // Si no hay cliente ni sede, se guarda en el array global de contactos
  if (!clientId || !branchId) {
    const current = prevData?.contactos || [];
    const exists = current.some(ct => String(ct.id) === String(contactId));
    const upserted = exists
      ? current.map(ct => String(ct.id) === String(contactId) ? { ...ct, ...mapped } : ct)
      : [...current, mapped];
    return { ...prevData, contactos: upserted };
  }

  const updatedClients = (prevData?.clientes || []).map(c => {
    if (String(c.id) !== String(clientId)) return c;
    const updatedBranches = (c.sucursales || []).map(b => {
      if (String(b.id) !== String(branchId)) return b;
      const current = b.contactos || [];
      const exists = current.some(ct => String(ct.id) === String(contactId));
      const upserted = exists
        ? current.map(ct => String(ct.id) === String(contactId) ? { ...ct, ...mapped } : ct)
        : [...current, mapped];
      return { ...b, contactos: upserted };
    });
    return { ...c, sucursales: updatedBranches };
  });
  return { ...prevData, clientes: updatedClients };
};

export const applyDeviceUpsert = (prevData, originClientId, originBranchId, deviceId, deviceDraft) => {
  const current = prevData?.dispositivos || [];
  const existsGlobal = current.some(d => String(d.id) === String(deviceId));
  const deviceMapped = {
    ...deviceDraft,
    id: deviceId,
    historialVisitas: current.find(d => String(d.id) === String(deviceId))?.historialVisitas || [],
    historialTraslados: current.find(d => String(d.id) === String(deviceId))?.historialTraslados || [],
  };

  const updatedGlobal = existsGlobal
    ? current.map(d => String(d.id) === String(deviceId) ? deviceMapped : d)
    : [...current, deviceMapped];

  const newClientId = deviceDraft.clientId;
  const newBranchId = deviceDraft.branchId;
  const locationChanged =
    String(originClientId) !== String(newClientId) ||
    String(originBranchId) !== String(newBranchId);

  let updatedClients = prevData?.clientes || [];

  if (locationChanged && originClientId && originBranchId) {
    updatedClients = updatedClients.map(c => {
      if (String(c.id) !== String(originClientId)) return c;
      return {
        ...c,
        sucursales: (c.sucursales || []).map(b => {
          if (String(b.id) !== String(originBranchId)) return b;
          return { ...b, dispositivos: (b.dispositivos || []).filter(id => String(id) !== String(deviceId)) };
        }),
      };
    });
  }

  if (newClientId && newBranchId) {
    updatedClients = updatedClients.map(c => {
      if (String(c.id) !== String(newClientId)) return c;
      return {
        ...c,
        sucursales: (c.sucursales || []).map(b => {
          if (String(b.id) !== String(newBranchId)) return b;
          const branchDevices = b.dispositivos || [];
          const exists = branchDevices.some(id => String(id) === String(deviceId));
          return { ...b, dispositivos: exists ? branchDevices : [...branchDevices, deviceId] };
        }),
      };
    });
  }

  return { ...prevData, dispositivos: updatedGlobal, clientes: updatedClients };
};

export const applyContactDelete = (prevData, clientId, branchId, contactId) => {
  const updatedClients = (prevData?.clientes || []).map(c => {
    if (String(c.id) !== String(clientId)) return c;
    return {
      ...c,
      sucursales: (c.sucursales || []).map(b => {
        if (String(b.id) !== String(branchId)) return b;
        return { ...b, contactos: (b.contactos || []).filter(ct => String(ct.id) !== String(contactId)) };
      }),
    };
  });
  return { ...prevData, clientes: updatedClients };
};
