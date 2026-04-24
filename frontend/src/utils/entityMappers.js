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
  tipoDocumento: '',
  tipoPersonaId: '',    // FK catalogo (TIPO_PERSONA): NATURAL | JURIDICA
  nit: '',
  dv: '',
  celular: '',
  celularPaisIso: 'CO',
  email: '',
  logoUrl: '',
  rutUrl: '',
  certBancariaUrl: '',
  otrosDocumentos: [],  // desde tabla cliente_documento: [{id, nombre, url}]
  fechaNacimiento: '',
  estadoId: '',
  direccion: '',
  pais: 'CO',
  estado_depto: '',
  ciudad: '',
  associatedDirectorIds: [],
});

export const emptyContractDraft = () => ({
  id: generateUUID(),
  tema: '',
  fechaInicio: '',
  fechaFin: '',
  documentoUrl: '',
  estadoId: '',
  numVisitasPreventivas: 0,
  fechasPreventivas: [],   // Array de { inicio: 'YYYY-MM-DD', fin: 'YYYY-MM-DD' }
  visitaIdsPreventivas: [],
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
  esMarido: false,        // true = casado → muestra fecha boda
  cargoId: '',            // UUID → catalogo(tipo=CARGO_CONTACTO)
  descripcionCargo: '',
  email: '',
  telefonoMovil: '',
  telefonoMovilPais: 'CO',
  fechaNacimiento: '',
  fechaMatrimonio: '',    // fecha boda — solo visible si esMarido=true
  estadoId: '',           // UUID → catalogo (ESTADO_ENTIDAD) (oculto en creación)
  darAcceso: false,       // true = invitar al sistema al guardar
  associatedBranchIds: [],
});

export const emptyDeviceDraft = () => ({
  id: generateUUID(),
  clientId: '',
  branchId: '',
  descripcion: '',          // descripción libre del equipo
  serial: '',
  categoriaId: '',          // UUID → categoria_dispositivo
  proveedorId: '',          // UUID → proveedor
  marcaId: '',              // UUID → marca
  linea: '',
  modelo: '',
  imac: '',                 // dirección MAC / IMAC
  esDeInmotika: false,      // true = el equipo pertenece a Inmotika, false = es del cliente
  estadoId: '',             // UUID → catalogo (ESTADO_ENTIDAD) (Activo/Inactivo)
  estadoGestionId: '',      // UUID → catalogo (ESTADO_GESTION_DISPOSITIVO)
  frecuenciaMantenimientoMeses: '',
  fechaProximoMantenimiento: '',
  notasTecnicas: '',
  idInmotika: '',           // ID asignado por Inmotika
  codigoUnico: '',          // Código único adicional
  pasoAPaso: [],            // [{descripcion, orden}] — derivado de la categoría
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
  estadoId: '',            // UUID → catalogo (ESTADO_ENTIDAD)
  usuarioId: '',           // UUID → perfil_usuario.id
});

// ─── FROM-DB CONVERTERS ───────────────────────────────────────────────────────

export const toClientDraft = (client) => {
  if (!client) return emptyClientDraft();
  const nitStr = client.nit != null ? String(client.nit) : '';
  const [nit, dv] = nitStr.includes('-') ? nitStr.split('-') : [nitStr, ''];
  const otrosFromTable = client.cliente_documento;
  const otrosDocumentos = Array.isArray(otrosFromTable)
    ? otrosFromTable.filter(d => d.activo !== false).map(d => ({ id: d.id, nombre: d.nombre || '', url: d.url || '' }))
    : (Array.isArray(client.otros_documentos) ? client.otros_documentos : (Array.isArray(client.otrosDocumentos) ? client.otrosDocumentos : []));
  return {
    ...emptyClientDraft(),
    id: client.id || generateUUID(),
    nombre: client.razon_social ?? client.nombre ?? '',
    tipoDocumento: client.tipo_documento ?? client.tipoDocumento ?? '',
    tipoPersonaId: client.tipo_persona_id ?? client.tipoPersonaId ?? '',
    nit: nit || '',
    dv: dv || '',
    celular: client.celular ?? '',
    celularPaisIso: client.celular_pais_iso ?? client.celularPaisIso ?? 'CO',
    email: client.email ?? '',
    logoUrl: client.logo_url ?? client.logoUrl ?? '',
    rutUrl: client.rut_url ?? client.rutUrl ?? '',
    certBancariaUrl: client.cert_bancaria_url ?? client.certBancariaUrl ?? '',
    fechaNacimiento: client.fecha_nacimiento ?? client.fechaNacimiento ?? '',
    estadoId: client.estado_id ?? client.estadoId ?? '',
    direccion: client.direccion ?? '',
    pais: client.pais ?? 'CO',
    estado_depto: client.estado_depto ?? '',
    ciudad: client.ciudad ?? '',
    otrosDocumentos,
    associatedDirectorIds: Array.isArray(client.cliente_director) 
      ? client.cliente_director.filter(cd => cd.activo !== false).map(cd => cd.director_id)
      : (Array.isArray(client.associatedDirectorIds) ? client.associatedDirectorIds : []),
  };
};

export const toBranchDraft = (branch) => {
  if (!branch) return emptyBranchDraft();
  let rawContratos = [];
  if (Array.isArray(branch.contratos)) {
    rawContratos = branch.contratos;
  } else if (Array.isArray(branch.contrato)) {
    rawContratos = branch.contrato;
  } else if (branch.contrato) {
    rawContratos = [branch.contrato];
  }
  rawContratos = rawContratos.filter(c => c && c.activo !== false);
  return {
    ...emptyBranchDraft(),
    id: branch.id || generateUUID(),
    nombre: branch.nombre ?? '',
    direccion: branch.direccion ?? '',
    ciudad: branch.ciudad ?? '',
    estado_depto: branch.estado_depto ?? branch.estado ?? '',
    pais: branch.pais ?? 'CO',
    latitud: branch.latitud != null ? String(branch.latitud) : '',
    longitud: branch.longitud != null ? String(branch.longitud) : '',
    esPrincipal: branch.esPrincipal ?? branch.es_principal ?? false,
    estadoId: branch.estado_id ?? branch.estadoId ?? '',
    horarioAtencion: branch.horarios_atencion ?? branch.horarioAtencion ?? null,
    contratos: rawContratos.map(c => ({
      ...emptyContractDraft(),
      id: c.id && String(c.id).length > 5 ? c.id : generateUUID(),
      tema: c.tema ?? c.nombre ?? '',
      documentoUrl: c.documento_url ?? c.documentoUrl ?? '',
      fechaInicio: c.fecha_inicio ?? c.fechaInicio ?? '',
      fechaFin: c.fecha_fin ?? c.fechaFin ?? '',
      numVisitasPreventivas: c.num_visitas_preventivas ?? c.numVisitasPreventivas ?? 0,
      fechasPreventivas: c.fechasPreventivas || [],
      visitaIdsPreventivas: c.visitaIdsPreventivas || [],
    })),
  };
};

export const toContactDraft = (contact) => {
  if (!contact) return emptyContactDraft();

  let telefonoMovil = contact.telefonoMovil || contact.telefono_movil || contact.celular || '';
  let telefonoMovilPais = contact.telefonoMovilPais || contact.telefono_movil_pais_iso || 'CO';

  const bridges = Array.isArray(contact.contacto_sucursal)
    ? contact.contacto_sucursal
    : Array.isArray(contact.branches)
      ? contact.branches
      : [];
  const associatedBranchIds = bridges
    .filter(b => b.activo !== false)
    .map(b => b.sucursal_id || b.sucursalId || b.branchId)
    .filter(Boolean)
    .map(id => String(id));

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
    tipoDocumento: contact.tipo_documento || contact.tipoDocumento || '',
    // Mapear correctamente campos de catálogo y estado desde snake_case
    generoId: contact.genero_id || contact.generoId || '',
    cargoId: contact.cargo_id || contact.cargoId || '',
    descripcionCargo: contact.descripcion_cargo || contact.descripcionCargo || '',
    estadoId: contact.estado_id || contact.estadoId || '',
    fechaNacimiento: contact.fecha_nacimiento || contact.fechaNacimiento || '',
    fechaMatrimonio: contact.fecha_matrimonio || contact.fechaMatrimonio || '',
    // Si hay fecha de matrimonio en BD, inferir que es casado/a
    esMarido: contact.esMarido ?? Boolean(contact.fecha_matrimonio || contact.fechaMatrimonio),
    usuarioId: contact.usuario_id || contact.usuarioId || null,
    // Estado del perfil_usuario (controla acceso al sistema via RLS is_user_active())
    // true = puede loguearse, false = bloqueado, null = no tiene cuenta vinculada
    perfilAccesoActivo: contact.perfil_usuario
      ? (contact.perfil_usuario.catalogo?.activo ?? true)
      : (contact.perfilAccesoActivo ?? null),
    darAcceso: contact.darAcceso ?? contact.dar_acceso ?? false,
    associatedBranchIds: contact.associatedBranchIds && contact.associatedBranchIds.length
      ? contact.associatedBranchIds.map(id => String(id))
      : associatedBranchIds,
    telefonoMovil,
    telefonoMovilPais,
  };
};

export const toDeviceDraft = (device, route = null) => ({
  ...emptyDeviceDraft(),
  ...device,
  id: device?.id || generateUUID(),
  clientId: device?.clientId || device?.cliente_id || route?.clientId || '',
  branchId: device?.branchId || device?.sucursal_id || route?.branchId || '',
  clienteNombre: device?.cliente?.razon_social || device?.clienteNombre || '',
  sucursalNombre: device?.sucursal?.nombre || device?.sucursalNombre || '',
  categoriaId: device?.categoriaId || device?.categoria_id || '',
  categoria: device?.categoria?.nombre || (typeof device?.categoria === 'string' ? device.categoria : '') || device?.categoriaNombre || '',
  marca: device?.marca?.nombre || (typeof device?.marca === 'string' ? device.marca : '') || device?.marcaNombre || '',
  proveedor: device?.proveedor?.nombre || (typeof device?.proveedor === 'string' ? device.proveedor : '') || device?.proveedorNombre || '',
  estadoId: device?.estadoId || device?.estado_id || '',
  imac: device?.imac || device?.macAddress || device?.mac_address || '',
  identificacionCliente: '', // removido de BD pero se limpia del draft
  esDeInmotika: device?.esDeInmotika ?? device?.es_de_inmotika ?? false,
  frecuenciaMantenimientoMeses: device?.frecuenciaMantenimientoMeses ?? device?.frecuencia_mantenimiento_meses ?? device?.frecuencia ?? '',
  fechaProximoMantenimiento: device?.fechaProximoMantenimiento ?? device?.fecha_proximo_mantenimiento ?? '',
  idInmotika: device?.idInmotika || device?.id_inmotika || '',
  codigoUnico: device?.codigoUnico || device?.codigo_unico || '',
  proveedorId: device?.proveedorId || device?.proveedor_id || '',
  marcaId: device?.marcaId || device?.marca_id || '',
  estadoGestionId: device?.estadoGestionId || device?.estado_gestion_id || '',
  notasTecnicas: device?.notasTecnicas || device?.notas_tecnicas || '',
  fechaCompra: device?.fechaCompra || device?.fecha_compra || '',
  fechaCaducidad: device?.fechaCaducidad || device?.fecha_caducidad || '',
  pasoAPaso: Array.isArray(device?.pasoAPaso)
    ? device.pasoAPaso.map((p, i) =>
        typeof p === 'string'
          ? { descripcion: p, orden: i + 1 }
          : p
      )
    : [],
});

export const toTecnicoDraft = (tecnico, perfil) => ({
  ...emptyTecnicoDraft(),
  id: tecnico?.id || generateUUID(),
  nombres: perfil?.nombres || perfil?.nombre || '',
  apellidos: perfil?.apellidos || perfil?.apellido || '',
  email: perfil?.email || '',
  telefono: perfil?.telefono || tecnico?.telefono || '',
  telefonoPaisIso: perfil?.telefono_pais_iso || perfil?.telefonoPaisIso || 'CO',
  avatarUrl: perfil?.avatar_url || perfil?.avatarUrl || '',
  tipoDocumento: perfil?.tipo_documento || tecnico?.tipo_documento || perfil?.tipoDocumento || '',
  identificacion: perfil?.identificacion || tecnico?.identificacion || '',
  estadoId: tecnico?.estado_id || tecnico?.estadoId || perfil?.estado_id || '',
  usuarioId: perfil?.id || tecnico?.usuario_id || tecnico?.usuarioId || '',
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
  // Reconstruir el array de objetos contacto a partir de los IDs del draft.
  // data.contactos es la fuente de verdad de objetos; el draft solo guarda IDs.
  // Contactos viven en data.contactos Y en clientes[].sucursales[].contactos — buscar en ambas fuentes
  const contactIds = new Set((branchDraft.associatedContactIds || []).map(String));
  const contactosPorId = new Map();
  (prevData?.contactos || []).forEach(ct => contactosPorId.set(String(ct.id), ct));
  (prevData?.clientes || []).forEach(c =>
    (c.sucursales || []).forEach(s =>
      (s.contactos || []).forEach(ct => contactosPorId.set(String(ct.id), ct))
    )
  );
  // Siempre reconstruir: array vacío significa que se removieron todos
  const updatedContactos = [...contactIds].map(id => contactosPorId.get(id)).filter(Boolean);

  const updatedClients = (prevData?.clientes || []).map(c => {
    if (String(c.id) !== String(clientId)) return c;
    const current = c.sucursales || [];
    const exists = current.some(b => String(b.id) === String(branchId));
    // No propagamos associatedContactIds/associatedDeviceIds a la sucursal en data
    // (esos campos son solo del draft del formulario)
    const { associatedContactIds: _cIds, associatedDeviceIds: _dIds, ...draftFields } = branchDraft;
    const mapped = { ...draftFields, id: branchId };
    const upserted = exists
      ? current.map(b => {
          if (String(b.id) !== String(branchId)) return b;
          return {
            ...b,
            ...mapped,
            // Si el draft tenía IDs de contactos, actualizar el array de objetos
            contactos: updatedContactos,
          };
        })
      : [...current, { ...mapped, contactos: updatedContactos, dispositivos: [] }];
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
