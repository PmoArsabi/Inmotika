export const INITIAL_DATA = {
  visitas: [
    { 
      id: "V-001", 
      cliente: "Banco Nacional", 
      tecnico_asignado: "Carlos Perez", 
      fecha: "2026-02-15", 
      hora: "09:00",
      sucursal: "Sede Principal Centro", 
      estado: "Pendiente", 
      prioridad: "Alta", 
      direccion: "Carrera 7 #12-45",
      tipoMantenimiento: "Preventivo",
      solicitadoBy: "Sistema",
      observaciones: "Mantenimiento preventivo bimensual de nodos de seguridad.",
      contactoNombre: "Andrés Rivera",
      contactoCelular: "3001234567",
      dispositivos: ["CAM-771"],
      ejecucion: {
        horaInicio: null,
        horaFin: null,
        dispositivosTerminados: 0,
        estadoGeneral: "Programado",
        observacionesTecnico: "",
        fotos: 0
      }
    }
  ],
  clientes: [
    { 
      id: 1, 
      nombre: "Banco Nacional", 
      nit: "900.111.222-1", 
      direccion: "Carrera 7 #12-45", 
      ciudad: "Bogotá", 
      telefono: "601-5550000", 
      email: "infraestructura@banconacional.com",
      sucursales: [
        {
          id: "S-101",
          nombre: "Sede Principal Centro",
          ciudad: "Bogotá",
          direccion: "Carrera 7 #12-45",
          telefono: "601-5550101",
          clasificacion: "principal",
          horario: {
            mon: { isOpen: true, start: "08:00", end: "17:00" },
            tue: { isOpen: true, start: "08:00", end: "17:00" },
            wed: { isOpen: true, start: "08:00", end: "17:00" },
            thu: { isOpen: true, start: "08:00", end: "17:00" },
            fri: { isOpen: true, start: "08:00", end: "17:00" },
            sat: { isOpen: true, start: "09:00", end: "13:00" }
          },
          dispositivos: [1],
          contactos: [
            { id: "C-1", nombre: "Andrés Rivera", celular: "3001234567", email: "arivera@banconacional.com", cargo: "Jefe de Seguridad" },
            { id: "C-2", nombre: "Martha López", celular: "3109876543", email: "mlopez@banconacional.com", cargo: "Coordinadora de TI" }
          ]
        },
        {
          id: "S-102",
          nombre: "Sucursal Norte 100",
          ciudad: "Bogotá",
          direccion: "Calle 100 #15-30",
          telefono: "601-5550102",
          contactos: [
            { id: "C-3", nombre: "Roberto Gómez", celular: "3154445566", email: "rgomez@banconacional.com", cargo: "Administrador" },
            { id: "C-4", nombre: "Lucía Fernández", celular: "3203332211", email: "lfernandez@banconacional.com", cargo: "Soporte Técnico" }
          ]
        },
        {
          id: "S-103",
          nombre: "Sede Operativa Fontibón",
          ciudad: "Bogotá",
          direccion: "Avenida El Dorado #90-10",
          telefono: "601-5550103",
          contactos: [
            { id: "C-5", nombre: "Carlos Duarte", celular: "3017778899", email: "cduarte@banconacional.com", cargo: "Gerente de Planta" },
            { id: "C-6", nombre: "Sonia Ruiz", celular: "3116665544", email: "sruiz@banconacional.com", cargo: "Seguridad Física" }
          ]
        }
      ]
    },
    { 
      id: 2, 
      nombre: "Supermercados El Éxito", 
      nit: "800.333.444-5", 
      direccion: "Calle 80 #68-00", 
      ciudad: "Medellín", 
      telefono: "604-4441122", 
      email: "mantenimiento@elexito.com",
      sucursales: [
        {
          id: "S-201",
          nombre: "Éxito Poblado",
          ciudad: "Medellín",
          direccion: "Carrera 43A #1-50",
          telefono: "604-4442021",
          contactos: [
            { id: "C-7", nombre: "Fernando Cano", celular: "3005559988", email: "fcano@elexito.com", cargo: "Director de Tienda" },
            { id: "C-8", nombre: "Elena Méndez", celular: "3128887766", email: "emendez@elexito.com", cargo: "Encargada de Monitoreo" }
          ]
        },
        {
          id: "S-202",
          nombre: "Éxito Laureles",
          ciudad: "Medellín",
          direccion: "Circular 1 #70-30",
          telefono: "604-4442022",
          contactos: [
            { id: "C-9", nombre: "Jorge Iván Restrepo", celular: "3014443322", email: "jirestrepo@elexito.com", cargo: "Líder Técnico" },
            { id: "C-10", nombre: "Paola Holguín", celular: "3102221100", email: "pholguin@elexito.com", cargo: "Asistente Operativa" }
          ]
        },
        {
          id: "S-203",
          nombre: "Éxito Envigado",
          ciudad: "Medellín",
          direccion: "Calle 38 Sur #40-20",
          telefono: "604-4442023",
          contactos: [
            { id: "C-11", nombre: "Mauricio Velez", celular: "3156667788", email: "mvelez@elexito.com", cargo: "Supervisor Nocturno" },
            { id: "C-12", nombre: "Claudia Ortiz", celular: "3209998877", email: "cortiz@elexito.com", cargo: "Auditora de Seguridad" }
          ]
        }
      ]
    }
  ],
  tecnicos: [
    { id: 101, nombre: "Carlos Perez", identificacion: "10203040", especialidad: "Instalación", zona: "Norte", estado: "Activo", celular: "3201234567", correo: "c.perez@inmotika.com", ciudad: "Bogotá" },
    { id: 102, nombre: "Juan Rodriguez", identificacion: "50607080", especialidad: "Mantenimiento", zona: "Sur", estado: "Activo", celular: "3159876543", correo: "j.rodriguez@inmotika.com", ciudad: "Cali" }
  ],
  dispositivos: [
    { 
      id: 1, 
      tipo: "Cámara IP", 
      modelo: "IMK-CAM-01", 
      serial: "SN-998822", 
      codigoUnico: "CAM-771", 
      marca: "Hikvision", 
      proveedor: "Inmotika Global", 
      linea: "Pro-Series", 
      imac: "00:1A:2B:3C:4D", 
      frecuencia: "Mensual", 
      tiempoPromedio: "45", 
      pasoAPaso: ["Limpieza de Óptica", "Ajuste de Enfoque", "Revisión Cables POE", "Prueba de Grabación", "Validación Infrarrojos"],
      historial: []
    }
  ]
};
