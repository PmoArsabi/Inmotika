export const INITIAL_DATA = {
  visitas: [
    { 
      id: "V-001", 
      cliente: "Residencial Horizonte", 
      tecnico_asignado: "Carlos Perez", 
      fecha: "2026-01-21", 
      hora: "09:00",
      sucursal: "Norte", 
      estado: "En Ejecución", 
      prioridad: "Alta", 
      direccion: "Calle 10 #5-20",
      tipoMantenimiento: "Preventivo",
      solicitadoPor: "Inmotika (Monitoreo)",
      observaciones: "El cliente reporta intermitencia en el nodo principal. Se requiere revisión de cableado estructurado.",
      contactoNombre: "Javier Martinez",
      contactoCelular: "3009988776",
      dispositivos: ["CAM-771"],
      ejecucion: {
        horaInicio: "09:05",
        horaFin: null,
        dispositivosTerminados: 0,
        estadoGeneral: "En Progreso",
        observacionesTecnico: "Iniciando revisión de cableado en rack principal.",
        fotos: 1
      }
    },
    { 
      id: "V-002", 
      cliente: "Torres del Parque", 
      tecnico_asignado: "Carlos Perez", 
      fecha: "2026-01-22", 
      hora: "14:00",
      sucursal: "Poblado",
      estado: "Pendiente", 
      prioridad: "Media", 
      direccion: "Av. Principal #45",
      tipoMantenimiento: "Correctivo",
      solicitadoPor: "Cliente",
      observaciones: "Falla total en sensor perimetral zona B.",
      contactoNombre: "Maria Gonzalez",
      contactoCelular: "3105551234",
      dispositivos: []
    }
  ],
  clientes: [
    { id: 1, nombre: "Residencial Horizonte", nit: "900.123.456-1", direccion: "Calle 10 #5-20", ciudad: "Bogotá", sucursal: "Norte", telefono: "3001234567", email: "admin@horizonte.com", dispositivos: ["IMK-CAM-001", "IMK-CAM-002", "IMK-PANEL-X1"] },
    { id: 2, nombre: "Torres del Parque", nit: "800.987.654-2", direccion: "Av. Principal #45", ciudad: "Medellín", sucursal: "Poblado", telefono: "3109876543", email: "gerencia@torresparque.com", dispositivos: ["IMK-CAM-099", "IMK-SENSOR-S2"] }
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
      historial: [
        { fecha: "2025-12-15", tecnico: "Juan Rodriguez", tipo: "Preventivo", observaciones: "Limpieza general de óptica y ajuste de conectores POE." },
        { fecha: "2025-10-02", tecnico: "Carlos Perez", tipo: "Correctivo", observaciones: "Reemplazo de inyector de energía por falla en voltaje." }
      ]
    },
    { 
      id: 2, 
      tipo: "Sensor PIR", 
      modelo: "IMK-PIR-X5", 
      serial: "SN-776655", 
      codigoUnico: "PIR-202", 
      marca: "Inmotika Core", 
      proveedor: "Inmotika Global", 
      linea: "Security", 
      imac: "00:3C:4D:5E:6F", 
      frecuencia: "Semestral", 
      tiempoPromedio: "20", 
      pasoAPaso: ["Prueba de paseo", "Limpieza de lente Fresnel", "Cambio de baterías"],
      historial: []
    }
  ]
};
