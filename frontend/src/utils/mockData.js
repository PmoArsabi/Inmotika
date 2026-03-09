export const INITIAL_DATA = {
  visitas: [
    { 
      id: "V-001", 
      cliente: "Banco Nacional", 
      tecnico_asignado: "Carlos Perez", 
      fecha: "2026-03-09", 
      hora: "09:00",
      sucursal: "Sede Principal Centro", 
      estado: "Pendiente", 
      prioridad: "Alta", 
      direccion: "Carrera 7 #12-45",
      tipoMantenimiento: "Preventivo",
      solicitadoPor: "Cliente",
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
    },
    { 
      id: "V-002", 
      cliente: "Supermercados El Éxito", 
      tecnico_asignado: "María González", 
      fecha: "2026-03-10", 
      hora: "11:00",
      sucursal: "Sucursal Norte", 
      estado: "Asignada", 
      prioridad: "Media", 
      direccion: "Calle 100 #15-30",
      tipoMantenimiento: "Preventivo",
      solicitadoPor: "Inmotika",
      observaciones: "Revisión mensual de sistemas de punto de venta y cámaras de seguridad.",
      contactoNombre: "Roberto Gómez",
      contactoCelular: "3154445566",
      dispositivos: ["CAM-772", "CAM-773"],
      ejecucion: {
        horaInicio: null,
        horaFin: null,
        dispositivosTerminados: 0,
        estadoGeneral: "Programado",
        observacionesTecnico: "",
        fotos: 0
      }
    },
    { 
      id: "V-003", 
      cliente: "Universidad Nacional de Colombia", 
      tecnico_asignado: "Juan Ramírez", 
      fecha: "2026-03-11", 
      hora: "14:00",
      sucursal: "Campus Principal", 
      estado: "Confirmada", 
      prioridad: "Baja", 
      direccion: "Carrera 30 #45-03",
      tipoMantenimiento: "Correctivo",
      solicitadoPor: "Cliente",
      observaciones: "Reparación de sistema de control de acceso en el edificio de ingeniería.",
      contactoNombre: "Ana Martínez",
      contactoCelular: "3201112233",
      dispositivos: ["ACC-001"],
      ejecucion: {
        horaInicio: null,
        horaFin: null,
        dispositivosTerminados: 0,
        estadoGeneral: "Programado",
        observacionesTecnico: "",
        fotos: 0
      }
    },
    { 
      id: "V-004", 
      cliente: "Hospital San Rafael", 
      tecnico_asignado: "Carlos Perez", 
      fecha: "2026-03-12", 
      hora: "08:00",
      sucursal: "Piso 3 - Urgencias", 
      estado: "En Ejecución", 
      prioridad: "Alta", 
      direccion: "Calle 72 #10-20",
      tipoMantenimiento: "Preventivo",
      solicitadoPor: "Técnico",
      observaciones: "Inspección mensual de equipos críticos en área de urgencias.",
      contactoNombre: "Dr. Juan Pérez",
      contactoCelular: "3012345678",
      dispositivos: ["MON-001", "BOM-001"],
      ejecucion: {
        horaInicio: "08:15",
        horaFin: null,
        dispositivosTerminados: 1,
        estadoGeneral: "En Progreso",
        observacionesTecnico: "Iniciando revisión de monitores de signos vitales.",
        fotos: 2
      }
    },
    { 
      id: "V-005", 
      cliente: "Retail Express", 
      tecnico_asignado: "María González", 
      fecha: "2026-03-12", 
      hora: "14:30",
      sucursal: "Sucursal Norte", 
      estado: "Finalizada", 
      prioridad: "Media", 
      direccion: "Avenida 68 #25-40",
      tipoMantenimiento: "Correctivo",
      solicitadoPor: "Cliente",
      observaciones: "Mantenimiento correctivo de impresora Zebra y lector de código de barras.",
      contactoNombre: "Carlos Ramírez",
      contactoCelular: "3123456789",
      dispositivos: ["IMP-001", "LEC-001"],
      ejecucion: {
        horaInicio: "14:30",
        horaFin: "16:00",
        dispositivosTerminados: 2,
        estadoGeneral: "Completado",
        observacionesTecnico: "Todos los dispositivos reparados y funcionando correctamente. Se realizó limpieza completa de los equipos.",
        fotos: 5
      }
    },
    { 
      id: "V-006", 
      cliente: "Banco Nacional", 
      tecnico_asignado: null, 
      fecha: "2026-03-15", 
      hora: "10:00",
      sucursal: "Sucursal Norte 100", 
      estado: "Pendiente", 
      prioridad: "Media", 
      direccion: "Calle 100 #15-30",
      tipoMantenimiento: "Preventivo",
      solicitadoPor: "Cliente",
      observaciones: "Revisión trimestral de sistemas de seguridad y cámaras.",
      contactoNombre: "Roberto Gómez",
      contactoCelular: "3154445566",
      dispositivos: ["CAM-774"],
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
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Oficinas",
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
            { 
              id: "C-1", 
              nombre: "Andrés Rivera", 
              celular: "3001234567", 
              email: "arivera@banconacional.com", 
              cargo: "Directivo",
              genero: "Masculino",
              estadoCivil: "Casado",
              fechaCumpleanos: "1985-05-12",
              fechaAniversario: "2010-10-20"
            },
            { 
              id: "C-2", 
              nombre: "Martha López", 
              celular: "3109876543", 
              email: "mlopez@banconacional.com", 
              cargo: "Administrativo",
              genero: "Femenino",
              estadoCivil: "Soltero",
              fechaCumpleanos: "1990-08-25",
              fechaAniversario: ""
            }
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
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Retail",
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
    },
    { 
      id: 3, 
      nombre: "Universidad Nacional de Colombia", 
      nit: "899.999.034-4", 
      direccion: "Carrera 30 #45-03", 
      ciudad: "Bogotá", 
      telefono: "601-3165000", 
      email: "infraestructura@unal.edu.co",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Universidad",
      sucursales: [
        {
          id: "S-301",
          nombre: "Sede Bogotá",
          ciudad: "Bogotá",
          direccion: "Carrera 30 #45-03",
          telefono: "601-3165000",
          contactos: [
            { id: "C-13", nombre: "María González", celular: "3001112233", email: "mgonzalez@unal.edu.co", cargo: "Directora de Infraestructura" }
          ]
        }
      ]
    },
    { 
      id: 4, 
      nombre: "Edificio Torre Empresarial", 
      nit: "830.123.456-7", 
      direccion: "Calle 72 #10-20", 
      ciudad: "Bogotá", 
      telefono: "601-3456789", 
      email: "administracion@torreempresarial.com",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Oficinas",
      sucursales: [
        {
          id: "S-401",
          nombre: "Torre Principal",
          ciudad: "Bogotá",
          direccion: "Calle 72 #10-20",
          telefono: "601-3456789",
          contactos: [
            { id: "C-14", nombre: "Roberto Sánchez", celular: "3105556677", email: "rsanchez@torreempresarial.com", cargo: "Administrador" }
          ]
        }
      ]
    },
    { 
      id: 5, 
      nombre: "Universidad de los Andes", 
      nit: "860.007.538-1", 
      direccion: "Carrera 1 #18A-12", 
      ciudad: "Bogotá", 
      telefono: "601-3394949", 
      email: "seguridad@uniandes.edu.co",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Universidad",
      sucursales: [
        {
          id: "S-501",
          nombre: "Campus Principal",
          ciudad: "Bogotá",
          direccion: "Carrera 1 #18A-12",
          telefono: "601-3394949",
          contactos: [
            { id: "C-15", nombre: "Luis Fernando Ramírez", celular: "3001234567", email: "lframirez@uniandes.edu.co", cargo: "Director de Seguridad" }
          ]
        }
      ]
    },
    { 
      id: 6, 
      nombre: "Centro Comercial Santafé", 
      nit: "830.124.567-8", 
      direccion: "Carrera 43A #7 Sur-170", 
      ciudad: "Medellín", 
      telefono: "604-4441234", 
      email: "seguridad@santafe.com.co",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Retail",
      sucursales: [
        {
          id: "S-601",
          nombre: "Sede Principal",
          ciudad: "Medellín",
          direccion: "Carrera 43A #7 Sur-170",
          telefono: "604-4441234",
          contactos: [
            { id: "C-16", nombre: "Ana María Vélez", celular: "3109876543", email: "amvelez@santafe.com.co", cargo: "Gerente de Seguridad" }
          ]
        }
      ]
    },
    { 
      id: 7, 
      nombre: "Hospital San Ignacio", 
      nit: "860.001.234-5", 
      direccion: "Carrera 7 #40-62", 
      ciudad: "Bogotá", 
      telefono: "601-5946161", 
      email: "tecnologia@hospitalsanignacio.org",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Salud",
      sucursales: [
        {
          id: "S-701",
          nombre: "Sede Principal",
          ciudad: "Bogotá",
          direccion: "Carrera 7 #40-62",
          telefono: "601-5946161",
          contactos: [
            { id: "C-17", nombre: "Dr. Carlos Mendoza", celular: "3151234567", email: "cmendoza@hospitalsanignacio.org", cargo: "Director de Tecnología" }
          ]
        }
      ]
    },
    { 
      id: 8, 
      nombre: "Torre Colpatria", 
      nit: "860.002.345-6", 
      direccion: "Carrera 7 #24-89", 
      ciudad: "Bogotá", 
      telefono: "601-2345678", 
      email: "administracion@torrecolpatria.com",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Oficinas",
      sucursales: [
        {
          id: "S-801",
          nombre: "Torre Principal",
          ciudad: "Bogotá",
          direccion: "Carrera 7 #24-89",
          telefono: "601-2345678",
          contactos: [
            { id: "C-18", nombre: "Patricia Gómez", celular: "3202345678", email: "pgomez@torrecolpatria.com", cargo: "Administradora" }
          ]
        }
      ]
    },
    { 
      id: 9, 
      nombre: "Universidad EAFIT", 
      nit: "890.900.608-1", 
      direccion: "Carrera 49 #7 Sur-50", 
      ciudad: "Medellín", 
      telefono: "604-2619500", 
      email: "infraestructura@eafit.edu.co",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Universidad",
      sucursales: [
        {
          id: "S-901",
          nombre: "Campus Principal",
          ciudad: "Medellín",
          direccion: "Carrera 49 #7 Sur-50",
          telefono: "604-2619500",
          contactos: [
            { id: "C-19", nombre: "Jorge Iván Cárdenas", celular: "3003456789", email: "jicardenas@eafit.edu.co", cargo: "Director de Infraestructura" }
          ]
        }
      ]
    },
    { 
      id: 10, 
      nombre: "Almacenes Éxito", 
      nit: "890.900.234-1", 
      direccion: "Carrera 48 #26-50", 
      ciudad: "Medellín", 
      telefono: "604-4445678", 
      email: "seguridad@almacenesexito.com",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Retail",
      sucursales: [
        {
          id: "S-1001",
          nombre: "Sede Principal",
          ciudad: "Medellín",
          direccion: "Carrera 48 #26-50",
          telefono: "604-4445678",
          contactos: [
            { id: "C-20", nombre: "Ricardo Mejía", celular: "3104567890", email: "rmejia@almacenesexito.com", cargo: "Gerente de Seguridad" }
          ]
        }
      ]
    },
    { 
      id: 11, 
      nombre: "Edificio Avianca", 
      nit: "860.003.456-7", 
      direccion: "Carrera 7 #32-33", 
      ciudad: "Bogotá", 
      telefono: "601-3456789", 
      email: "admin@edificioavianca.com",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Oficinas",
      sucursales: [
        {
          id: "S-1101",
          nombre: "Torre Principal",
          ciudad: "Bogotá",
          direccion: "Carrera 7 #32-33",
          telefono: "601-3456789",
          contactos: [
            { id: "C-21", nombre: "Sandra Milena López", celular: "3155678901", email: "smlopez@edificioavianca.com", cargo: "Administradora" }
          ]
        }
      ]
    },
    { 
      id: 12, 
      nombre: "Universidad Javeriana", 
      nit: "860.004.567-8", 
      direccion: "Carrera 7 #40-62", 
      ciudad: "Bogotá", 
      telefono: "601-3208320", 
      email: "seguridad@javeriana.edu.co",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Universidad",
      sucursales: [
        {
          id: "S-1201",
          nombre: "Campus Principal",
          ciudad: "Bogotá",
          direccion: "Carrera 7 #40-62",
          telefono: "601-3208320",
          contactos: [
            { id: "C-22", nombre: "Fernando Castro", celular: "3006789012", email: "fcastro@javeriana.edu.co", cargo: "Director de Seguridad" }
          ]
        }
      ]
    },
    { 
      id: 13, 
      nombre: "Centro Comercial Andino", 
      nit: "830.125.678-9", 
      direccion: "Carrera 11 #82-71", 
      ciudad: "Bogotá", 
      telefono: "601-6212929", 
      email: "seguridad@andino.com.co",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Retail",
      sucursales: [
        {
          id: "S-1301",
          nombre: "Sede Principal",
          ciudad: "Bogotá",
          direccion: "Carrera 11 #82-71",
          telefono: "601-6212929",
          contactos: [
            { id: "C-23", nombre: "María Fernanda Torres", celular: "3107890123", email: "mftorres@andino.com.co", cargo: "Gerente de Seguridad" }
          ]
        }
      ]
    },
    { 
      id: 14, 
      nombre: "Torre del Reloj", 
      nit: "860.005.678-9", 
      direccion: "Carrera 13 #93-47", 
      ciudad: "Bogotá", 
      telefono: "601-3457890", 
      email: "admin@torredelreloj.com",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Oficinas",
      sucursales: [
        {
          id: "S-1401",
          nombre: "Torre Principal",
          ciudad: "Bogotá",
          direccion: "Carrera 13 #93-47",
          telefono: "601-3457890",
          contactos: [
            { id: "C-24", nombre: "Andrés Felipe Rojas", celular: "3158901234", email: "afrojas@torredelreloj.com", cargo: "Administrador" }
          ]
        }
      ]
    },
    { 
      id: 15, 
      nombre: "Universidad del Valle", 
      nit: "890.901.345-2", 
      direccion: "Calle 13 #100-00", 
      ciudad: "Cali", 
      telefono: "602-3212100", 
      email: "infraestructura@univalle.edu.co",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Universidad",
      sucursales: [
        {
          id: "S-1501",
          nombre: "Campus Principal",
          ciudad: "Cali",
          direccion: "Calle 13 #100-00",
          telefono: "602-3212100",
          contactos: [
            { id: "C-25", nombre: "Luz Marina Herrera", celular: "3009012345", email: "lmherrera@univalle.edu.co", cargo: "Directora de Infraestructura" }
          ]
        }
      ]
    },
    { 
      id: 16, 
      nombre: "Hospital Universitario San Vicente", 
      nit: "860.006.789-0", 
      direccion: "Calle 64 #33-139", 
      ciudad: "Medellín", 
      telefono: "604-4444444", 
      email: "tecnologia@husvp.org.co",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Salud",
      sucursales: [
        {
          id: "S-1601",
          nombre: "Sede Principal",
          ciudad: "Medellín",
          direccion: "Calle 64 #33-139",
          telefono: "604-4444444",
          contactos: [
            { id: "C-26", nombre: "Dr. Juan Carlos Ospina", celular: "3100123456", email: "jospina@husvp.org.co", cargo: "Director de Tecnología" }
          ]
        }
      ]
    },
    { 
      id: 17, 
      nombre: "Edificio Seguros Bolívar", 
      nit: "860.007.890-1", 
      direccion: "Carrera 7 #32-33", 
      ciudad: "Bogotá", 
      telefono: "601-2348901", 
      email: "administracion@edificiosegurosbolivar.com",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Oficinas",
      sucursales: [
        {
          id: "S-1701",
          nombre: "Torre Principal",
          ciudad: "Bogotá",
          direccion: "Carrera 7 #32-33",
          telefono: "601-2348901",
          contactos: [
            { id: "C-27", nombre: "Claudia Patricia Muñoz", celular: "3151234567", email: "cpmunoz@edificiosegurosbolivar.com", cargo: "Administradora" }
          ]
        }
      ]
    },
    { 
      id: 18, 
      nombre: "Centro Comercial Unicentro", 
      nit: "830.126.789-0", 
      direccion: "Avenida 15 #124-30", 
      ciudad: "Bogotá", 
      telefono: "601-2134567", 
      email: "seguridad@unicentro.com.co",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Retail",
      sucursales: [
        {
          id: "S-1801",
          nombre: "Sede Principal",
          ciudad: "Bogotá",
          direccion: "Avenida 15 #124-30",
          telefono: "601-2134567",
          contactos: [
            { id: "C-28", nombre: "Diego Armando Quintero", celular: "3202345678", email: "daquintero@unicentro.com.co", cargo: "Gerente de Seguridad" }
          ]
        }
      ]
    },
    { 
      id: 19, 
      nombre: "Universidad Pontificia Bolivariana", 
      nit: "890.902.456-3", 
      direccion: "Circular 1 #70-01", 
      ciudad: "Medellín", 
      telefono: "604-4159015", 
      email: "infraestructura@upb.edu.co",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Universidad",
      sucursales: [
        {
          id: "S-1901",
          nombre: "Campus Principal",
          ciudad: "El Encanto",
          direccion: "Circular 1 #70-01",
          telefono: "604-4159015",
          pais: "CO",
          estado_depto: "ANT",
          estatus: "activo",
          clasificacion: "principal",
          contactos: [
            { id: "C-29", nombre: "Carlos Alberto Zapata", celular: "3003456789", email: "cazapata@upb.edu.co", cargo: "Director de Infraestructura" }
          ]
        },
        {
          id: "S-1902",
          nombre: "Sede Laureles",
          ciudad: "Medellín",
          direccion: "Calle 70 #52-21",
          telefono: "604-4159016",
          pais: "CO",
          estado_depto: "ANT",
          estatus: "activo",
          clasificacion: "secundaria",
          contactos: []
        },
        {
          id: "S-1903",
          nombre: "Sede El Poblado",
          ciudad: "Medellín",
          direccion: "Carrera 43A #1 Sur-50",
          telefono: "604-4159017",
          pais: "CO",
          estado_depto: "ANT",
          estatus: "activo",
          clasificacion: "secundaria",
          contactos: []
        },
        {
          id: "S-1904",
          nombre: "Sede Belén",
          ciudad: "Medellín",
          direccion: "Calle 30 #79-51",
          telefono: "604-4159018",
          pais: "CO",
          estado_depto: "ANT",
          estatus: "activo",
          clasificacion: "secundaria",
          contactos: []
        },
        {
          id: "S-1905",
          nombre: "Sede Bello",
          ciudad: "Bello",
          direccion: "Carrera 50 #45-30",
          telefono: "604-4159019",
          pais: "CO",
          estado_depto: "ANT",
          estatus: "activo",
          clasificacion: "secundaria",
          contactos: []
        },
        {
          id: "S-1906",
          nombre: "Sede Envigado",
          ciudad: "Envigado",
          direccion: "Calle 48 Sur #43-55",
          telefono: "604-4159020",
          pais: "CO",
          estado_depto: "ANT",
          estatus: "activo",
          clasificacion: "secundaria",
          contactos: []
        },
        {
          id: "S-1907",
          nombre: "Sede Itagüí",
          ciudad: "Itagüí",
          direccion: "Carrera 50 #51-20",
          telefono: "604-4159021",
          pais: "CO",
          estado_depto: "ANT",
          estatus: "activo",
          clasificacion: "secundaria",
          contactos: []
        }
      ]
    },
    { 
      id: 20, 
      nombre: "Torre WTC", 
      nit: "860.008.901-2", 
      direccion: "Carrera 7 #26-20", 
      ciudad: "Bogotá", 
      telefono: "601-3459012", 
      email: "admin@torrewtc.com",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Oficinas",
      sucursales: [
        {
          id: "S-2001",
          nombre: "Torre Principal",
          ciudad: "Bogotá",
          direccion: "Carrera 7 #26-20",
          telefono: "601-3459012",
          contactos: [
            { id: "C-30", nombre: "Mónica Patricia Giraldo", celular: "3154567890", email: "mpgiraldo@torrewtc.com", cargo: "Administradora" }
          ]
        }
      ]
    },
    { 
      id: 21, 
      nombre: "Hospital Pablo Tobón Uribe", 
      nit: "860.009.012-3", 
      direccion: "Calle 78B #69-240", 
      ciudad: "Medellín", 
      telefono: "604-4459000", 
      email: "tecnologia@hptu.org.co",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Salud",
      sucursales: [
        {
          id: "S-2101",
          nombre: "Sede Principal",
          ciudad: "Medellín",
          direccion: "Calle 78B #69-240",
          telefono: "604-4459000",
          contactos: [
            { id: "C-31", nombre: "Dr. Luis Fernando Montoya", celular: "3105678901", email: "lfmontoya@hptu.org.co", cargo: "Director de Tecnología" }
          ]
        }
      ]
    },
    { 
      id: 22, 
      nombre: "Centro Comercial Gran Estación", 
      nit: "830.127.890-1", 
      direccion: "Avenida Calle 26 #62-47", 
      ciudad: "Bogotá", 
      telefono: "601-4234567", 
      email: "seguridad@granestacion.com.co",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Retail",
      sucursales: [
        {
          id: "S-2201",
          nombre: "Sede Principal",
          ciudad: "Bogotá",
          direccion: "Avenida Calle 26 #62-47",
          telefono: "601-4234567",
          contactos: [
            { id: "C-32", nombre: "Jorge Mario Restrepo", celular: "3206789012", email: "jmrestrepo@granestacion.com.co", cargo: "Gerente de Seguridad" }
          ]
        }
      ]
    },
    { 
      id: 23, 
      nombre: "Universidad ICESI", 
      nit: "890.903.567-4", 
      direccion: "Calle 18 #122-135", 
      ciudad: "Cali", 
      telefono: "602-5552334", 
      email: "infraestructura@icesi.edu.co",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Universidad",
      sucursales: [
        {
          id: "S-2301",
          nombre: "Campus Principal",
          ciudad: "Cali",
          direccion: "Calle 18 #122-135",
          telefono: "602-5552334",
          contactos: [
            { id: "C-33", nombre: "Ana Lucía Velásquez", celular: "3007890123", email: "alvelasquez@icesi.edu.co", cargo: "Directora de Infraestructura" }
          ]
        }
      ]
    },
    { 
      id: 24, 
      nombre: "Edificio Bancolombia", 
      nit: "860.010.123-4", 
      direccion: "Carrera 48 #26-85", 
      ciudad: "Medellín", 
      telefono: "604-5109000", 
      email: "admin@edificiobancolombia.com",
      pais: "CO",
      tipoPersona: "juridica",
      tipoNegocio: "Oficinas",
      sucursales: [
        {
          id: "S-2401",
          nombre: "Torre Principal",
          ciudad: "Medellín",
          direccion: "Carrera 48 #26-85",
          telefono: "604-5109000",
          contactos: [
            { id: "C-34", nombre: "Ricardo Andrés Mejía", celular: "3158901234", email: "ramejia@edificiobancolombia.com", cargo: "Administrador" }
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
      idInmotika: "IMK-001",
      tipo: "Cámara IP", 
      categoria: "Seguridad Electrónica",
      modelo: "IMK-CAM-01", 
      serial: "SN-998822", 
      codigoUnico: "CAM-771", 
      marca: "Hikvision", 
      proveedor: "Inmotika Global", 
      linea: "Pro-Series", 
      imac: "00:1A:2B:3C:4D",
      dueno: "Inmotika",
      estatus: "Activo",
      frecuencia: "Mensual", 
      tiempoPromedio: "45", 
      pasoAPaso: ["Limpieza de Óptica", "Ajuste de Enfoque", "Revisión Cables POE", "Prueba de Grabación", "Validación Infrarrojos"],
      historialVisitas: [
        { fecha: "2026-01-15", tecnico: "Carlos Perez", tipo: "Preventivo", observaciones: "Limpieza general y prueba de grabación OK." }
      ],
      historialTraslados: [
        { fecha: "2025-12-20", origen: "Bodega Principal", destino: "Sede Principal Centro", motivo: "Instalación Inicial" }
      ]
    }
  ],
  usuarios: [
    {
      id: 'USR-001',
      nombre: 'Juan Carlos Pérez',
      email: 'juan.perez@inmotika.com',
      telefono: '3001234567',
      rol: 'director',
      activo: true,
      fechaCreacion: '2025-01-15',
      password: 'password123'
    },
    {
      id: 'USR-002',
      nombre: 'María González',
      email: 'maria.gonzalez@inmotika.com',
      telefono: '3002345678',
      rol: 'coordinador',
      activo: true,
      fechaCreacion: '2025-01-20',
      password: 'password123'
    },
    {
      id: 'USR-003',
      nombre: 'Carlos Pérez',
      email: 'carlos.perez@inmotika.com',
      telefono: '3003456789',
      rol: 'tecnico',
      activo: true,
      fechaCreacion: '2025-02-01',
      password: 'password123'
    },
    {
      id: 'USR-004',
      nombre: 'Laura Martínez',
      email: 'laura.martinez@inmotika.com',
      telefono: '3004567890',
      rol: 'tecnico',
      activo: true,
      fechaCreacion: '2025-02-05',
      password: 'password123'
    }
  ]
};
