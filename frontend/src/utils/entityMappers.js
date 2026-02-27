// --- DRAFT HELPERS ---
export const emptyClientDraft = () => ({
  nombre: '', nit: '', dv: '', tipoPersona: 'juridica',
  rutUrl: '', logoUrl: '', telefono: '', email: '',
  direccion: '', pais: 'CO', estado_depto: '', ciudad: '',
  estatus: 'activo', fechaRegistro: ''
});

export const emptyBranchDraft = () => ({
  nombre: '', direccion: '', pais: 'CO', estado_depto: '',
  ciudad: '', clasificacion: 'secundaria', horario: null,
  estatus: 'activo', contratoFileUrl: '', contratoFechaInicio: '', contratoFechaFin: ''
});

export const emptyContactDraft = () => ({
  nombre: '', puesto: '', telefonoOffice: '', telefonoMovil: '',
  email: '', emailAlternativo: '', genero: '', estadoCivil: '',
  fechaCumpleanos: '', fechaAniversario: '', notas: '', estatus: 'activo'
});

export const emptyDeviceDraft = () => ({
  clientId: '', branchId: '', idInmotika: '', codigoUnico: '',
  serial: '', tipo: '', categoria: '', proveedor: '',
  marca: '', linea: '', modelo: '', imac: '', dueno: '',
  estatus: 'Activo', frecuencia: '', tiempoPromedio: '',
  pasoAPaso: [], notas: ''
});

export const emptyTecnicoDraft = () => ({
  nombre: '', identificacion: '', ciudad: '', zona: '',
  correo: '', celular: '', especialidad: '', estado: 'Activo'
});

export const toClientDraft = (client) => ({
  ...emptyClientDraft(),
  ...client,
  nit: client?.nit ? client.nit.split('-')[0] : '',
  dv: client?.nit ? client.nit.split('-')[1] || '' : ''
});

export const toBranchDraft = (branch) => ({
  ...emptyBranchDraft(),
  ...branch,
  estado_depto: branch?.estado_depto || branch?.estado || ''
});

export const toContactDraft = (contact) => ({
  ...emptyContactDraft(),
  ...contact,
  puesto: contact?.puesto || contact?.cargo || '',
  telefonoMovil: contact?.telefonoMovil || contact?.celular || ''
});

export const toDeviceDraft = (device, route = null) => ({
  ...emptyDeviceDraft(),
  ...device,
  clientId: device?.clientId || route?.clientId || '',
  branchId: device?.branchId || route?.branchId || '',
});

// --- DATA APPLY HELPERS ---
export const applyClientUpdate = (prevData, clientId, patch) => {
  const updatedClients = (prevData?.clientes || []).map((c) => {
    if (String(c.id) !== String(clientId)) return c;
    return { ...c, ...patch };
  });
  return { ...prevData, clientes: updatedClients };
};

export const applyTecnicoUpsert = (prevData, tecnicoId, tecnicoDraft) => {
  const currentTecnicos = prevData?.tecnicos || [];
  const exists = currentTecnicos.some(t => String(t.id) === String(tecnicoId));
  const tecnicoMapped = { ...tecnicoDraft, id: tecnicoId };
  
  const updatedTecnicos = exists
    ? currentTecnicos.map(t => String(t.id) === String(tecnicoId) ? { ...t, ...tecnicoMapped } : t)
    : [tecnicoMapped, ...currentTecnicos];
    
  return { ...prevData, tecnicos: updatedTecnicos };
};

export const applyBranchUpsert = (prevData, clientId, branchId, branchDraft) => {
  const updatedClients = (prevData?.clientes || []).map((c) => {
    if (String(c.id) !== String(clientId)) return c;
    const currentBranches = c.sucursales || [];
    const exists = currentBranches.some((b) => String(b.id) === String(branchId));
    const branchMapped = { ...branchDraft, id: branchId };
    const upserted = exists
      ? currentBranches.map((b) => (String(b.id) === String(branchId) ? { ...b, ...branchMapped } : b))
      : [...currentBranches, { ...branchMapped, contactos: [], dispositivos: [] }];
    return { ...c, sucursales: upserted };
  });
  return { ...prevData, clientes: updatedClients };
};

export const applyContactUpsert = (prevData, clientId, branchId, contactId, contactDraft) => {
  const updatedClients = (prevData?.clientes || []).map((c) => {
    if (String(c.id) !== String(clientId)) return c;
    const updatedBranches = (c.sucursales || []).map((b) => {
      if (String(b.id) !== String(branchId)) return b;
      const currentContacts = b.contactos || [];
      const exists = currentContacts.some((ct) => String(ct.id) === String(contactId));
      const mapped = { 
        id: contactId, 
        ...contactDraft, 
        puesto: contactDraft.puesto, 
        telefonoMovil: contactDraft.telefonoMovil 
      };
      const upserted = exists
        ? currentContacts.map((ct) => (String(ct.id) === String(contactId) ? { ...ct, ...mapped } : ct))
        : [...currentContacts, mapped];
      return { ...b, contactos: upserted };
    });
    return { ...c, sucursales: updatedBranches };
  });
  return { ...prevData, clientes: updatedClients };
};

export const applyDeviceUpsert = (prevData, originClientId, originBranchId, deviceId, deviceDraft) => {
  const currentDevices = prevData?.dispositivos || [];
  const existsGlobal = currentDevices.some(d => String(d.id) === String(deviceId));
  const deviceMapped = {
    ...deviceDraft,
    id: deviceId,
    historialVisitas: currentDevices.find(d => String(d.id) === String(deviceId))?.historialVisitas || [],
    historialTraslados: currentDevices.find(d => String(d.id) === String(deviceId))?.historialTraslados || []
  };

  const updatedGlobalDevices = existsGlobal
    ? currentDevices.map(d => String(d.id) === String(deviceId) ? deviceMapped : d)
    : [...currentDevices, deviceMapped];

  let updatedClients = prevData?.clientes || [];
  const newClientId = deviceDraft.clientId;
  const newBranchId = deviceDraft.branchId;
  const locationChanged = String(originClientId) !== String(newClientId) || String(originBranchId) !== String(newBranchId);

  if (locationChanged && originClientId && originBranchId) {
    updatedClients = updatedClients.map(c => {
      if (String(c.id) !== String(originClientId)) return c;
      const updatedBranches = (c.sucursales || []).map(b => {
        if (String(b.id) !== String(originBranchId)) return b;
        return { ...b, dispositivos: (b.dispositivos || []).filter(id => String(id) !== String(deviceId)) };
      });
      return { ...c, sucursales: updatedBranches };
    });
  }

  if (newClientId && newBranchId) {
    updatedClients = updatedClients.map(c => {
      if (String(c.id) !== String(newClientId)) return c;
      const updatedBranches = (c.sucursales || []).map(b => {
        if (String(b.id) !== String(newBranchId)) return b;
        const branchDevices = b.dispositivos || [];
        const exists = branchDevices.some(id => String(id) === String(deviceId));
        return { ...b, dispositivos: exists ? branchDevices : [...branchDevices, deviceId] };
      });
      return { ...c, sucursales: updatedBranches };
    });
  }

  return { ...prevData, dispositivos: updatedGlobalDevices, clientes: updatedClients };
};

export const applyContactDelete = (prevData, clientId, branchId, contactId) => {
  const updatedClients = (prevData?.clientes || []).map((c) => {
    if (String(c.id) !== String(clientId)) return c;
    const updatedBranches = (c.sucursales || []).map((b) => {
      if (String(b.id) !== String(branchId)) return b;
      return { ...b, contactos: (b.contactos || []).filter((ct) => String(ct.id) !== String(contactId)) };
    });
    return { ...c, sucursales: updatedBranches };
  });
  return { ...prevData, clientes: updatedClients };
};
