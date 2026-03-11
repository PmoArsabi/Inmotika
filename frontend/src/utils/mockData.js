export const INITIAL_DATA = {
  "visitas": [
    {
      "id": "VIS-001",
      "solicitudId": "SV-001",
      "clienteId": "CLI-001",
      "clienteNombre": "Banco Nacional",
      "sucursalId": "SUC-001",
      "sucursalNombre": "Sede Principal Centro",
      "tipoVisita": "PREVENTIVO",
      "tecnicoIds": [
        "USR-003"
      ],
      "tecnicosNombres": [
        "Carlos Pérez"
      ],
      "fechaProgramada": "2026-03-20T09:00",
      "fechaInicio": null,
      "fechaFin": null,
      "observaciones": "Coordinación confirmada. Acceso por portería principal.",
      "estado": "PROGRAMADO",
      "dispositivos": [
        {
          "id": "1",
          "nombre": "Cámara IP IMK-001",
          "categoria": "Seguridad Electrónica",
          "serial": "SN-998822",
          "pasos": [
            {
              "id": "P1-1",
              "orden": 1,
              "descripcion": "Limpieza y Estado General",
              "esObligatorio": true,
              "actividades": [
                {
                  "id": "A1-1-1",
                  "orden": 1,
                  "descripcion": "Limpieza de superficies externas",
                  "esObligatorio": true
                },
                {
                  "id": "A1-1-2",
                  "orden": 2,
                  "descripcion": "Gabinete sin humedad ni polvo interno",
                  "esObligatorio": true
                },
                {
                  "id": "A1-1-3",
                  "orden": 3,
                  "descripcion": "Tornillería completa y ajustada",
                  "esObligatorio": false
                }
              ]
            },
            {
              "id": "P1-2",
              "orden": 2,
              "descripcion": "Sistema Óptico",
              "esObligatorio": true,
              "actividades": [
                {
                  "id": "A1-2-1",
                  "orden": 1,
                  "descripcion": "Limpieza de lente con paño antiestático",
                  "esObligatorio": true
                },
                {
                  "id": "A1-2-2",
                  "orden": 2,
                  "descripcion": "Ajuste de enfoque y zoom",
                  "esObligatorio": true
                },
                {
                  "id": "A1-2-3",
                  "orden": 3,
                  "descripcion": "Validación de infrarrojos nocturnos",
                  "esObligatorio": false
                }
              ]
            },
            {
              "id": "P1-3",
              "orden": 3,
              "descripcion": "Sistema Eléctrico y Red",
              "esObligatorio": true,
              "actividades": [
                {
                  "id": "A1-3-1",
                  "orden": 1,
                  "descripcion": "Revisión cables POE",
                  "esObligatorio": true
                },
                {
                  "id": "A1-3-2",
                  "orden": 2,
                  "descripcion": "Verificación voltaje de alimentación",
                  "esObligatorio": true
                },
                {
                  "id": "A1-3-3",
                  "orden": 3,
                  "descripcion": "Prueba de grabación continua 5 min",
                  "esObligatorio": true
                }
              ]
            }
          ]
        },
        {
          "id": "2",
          "nombre": "Control de Acceso IMK-002",
          "categoria": "Control de Acceso",
          "serial": "SN-112233",
          "pasos": [
            {
              "id": "P2-1",
              "orden": 1,
              "descripcion": "Limpieza y Estado",
              "esObligatorio": true,
              "actividades": [
                {
                  "id": "A2-1-1",
                  "orden": 1,
                  "descripcion": "Limpieza del lector biométrico",
                  "esObligatorio": true
                },
                {
                  "id": "A2-1-2",
                  "orden": 2,
                  "descripcion": "Limpieza de teclado y botonera",
                  "esObligatorio": true
                }
              ]
            },
            {
              "id": "P2-2",
              "orden": 2,
              "descripcion": "Verificación Funcional",
              "esObligatorio": true,
              "actividades": [
                {
                  "id": "A2-2-1",
                  "orden": 1,
                  "descripcion": "Prueba de tarjetas de acceso",
                  "esObligatorio": true
                },
                {
                  "id": "A2-2-2",
                  "orden": 2,
                  "descripcion": "Revisión de firmware",
                  "esObligatorio": false
                },
                {
                  "id": "A2-2-3",
                  "orden": 3,
                  "descripcion": "Prueba de apertura/cierre de puerta",
                  "esObligatorio": true
                }
              ]
            }
          ]
        }
      ],
      "ejecucionPasos": {},
      "ejecucionActividades": {}
    },
    {
      "id": "VIS-002",
      "solicitudId": null,
      "clienteId": "CLI-002",
      "clienteNombre": "Supermercados El Éxito",
      "sucursalId": "SUC-003",
      "sucursalNombre": "Sucursal Norte",
      "tipoVisita": "PREVENTIVO",
      "tecnicoIds": [
        "USR-004"
      ],
      "tecnicosNombres": [
        "Laura Martínez"
      ],
      "fechaProgramada": "2026-03-12T11:00",
      "fechaInicio": "2026-03-12T11:05",
      "fechaFin": null,
      "observaciones": "Visita de mantenimiento preventivo mensual.",
      "estado": "EN_CURSO",
      "dispositivos": [
        {
          "id": "3",
          "nombre": "Cámara IP IMK-003",
          "categoria": "Seguridad Electrónica",
          "serial": "SN-445566",
          "pasos": [
            {
              "id": "P3-1",
              "orden": 1,
              "descripcion": "Limpieza y Estado General",
              "esObligatorio": true,
              "actividades": [
                {
                  "id": "A3-1-1",
                  "orden": 1,
                  "descripcion": "Limpieza de superficies externas",
                  "esObligatorio": true
                },
                {
                  "id": "A3-1-2",
                  "orden": 2,
                  "descripcion": "Gabinete sin humedad",
                  "esObligatorio": true
                }
              ]
            },
            {
              "id": "P3-2",
              "orden": 2,
              "descripcion": "Sistema Óptico",
              "esObligatorio": true,
              "actividades": [
                {
                  "id": "A3-2-1",
                  "orden": 1,
                  "descripcion": "Limpieza de lente",
                  "esObligatorio": true
                },
                {
                  "id": "A3-2-2",
                  "orden": 2,
                  "descripcion": "Ajuste de enfoque",
                  "esObligatorio": true
                }
              ]
            },
            {
              "id": "P3-3",
              "orden": 3,
              "descripcion": "Pruebas de Grabación",
              "esObligatorio": true,
              "actividades": [
                {
                  "id": "A3-3-1",
                  "orden": 1,
                  "descripcion": "Grabación a 1080p verificada",
                  "esObligatorio": true
                },
                {
                  "id": "A3-3-2",
                  "orden": 2,
                  "descripcion": "Prueba de visión nocturna",
                  "esObligatorio": false
                }
              ]
            }
          ]
        },
        {
          "id": "4",
          "nombre": "Control de Acceso IMK-004",
          "categoria": "Control de Acceso",
          "serial": "SN-778899",
          "pasos": [
            {
              "id": "P4-1",
              "orden": 1,
              "descripcion": "Limpieza del lector",
              "esObligatorio": true,
              "actividades": [
                {
                  "id": "A4-1-1",
                  "orden": 1,
                  "descripcion": "Limpiar superficie del lector",
                  "esObligatorio": true
                },
                {
                  "id": "A4-1-2",
                  "orden": 2,
                  "descripcion": "Verificar anclaje y cableado",
                  "esObligatorio": true
                }
              ]
            },
            {
              "id": "P4-2",
              "orden": 2,
              "descripcion": "Verificación Funcional",
              "esObligatorio": true,
              "actividades": [
                {
                  "id": "A4-2-1",
                  "orden": 1,
                  "descripcion": "Prueba de tarjetas",
                  "esObligatorio": true
                },
                {
                  "id": "A4-2-2",
                  "orden": 2,
                  "descripcion": "Revisión firmware",
                  "esObligatorio": false
                }
              ]
            }
          ]
        }
      ],
      "ejecucionPasos": {
        "P3-1": {
          "comentarios": "Limpieza completa con aire comprimido.",
          "evidenciaUrl": null
        },
        "P3-2": {
          "comentarios": "",
          "evidenciaUrl": null
        },
        "P3-3": {
          "comentarios": "Grabación a 1080p verificada OK.",
          "evidenciaUrl": null
        },
        "P4-1": {
          "comentarios": "Lector limpio.",
          "evidenciaUrl": null
        }
      },
      "ejecucionActividades": {
        "A3-1-1": {
          "completada": true
        },
        "A3-1-2": {
          "completada": true
        },
        "A3-2-1": {
          "completada": true
        },
        "A3-2-2": {
          "completada": true
        },
        "A3-3-1": {
          "completada": true
        },
        "A3-3-2": {
          "completada": true
        },
        "A4-1-1": {
          "completada": true
        },
        "A4-1-2": {
          "completada": true
        },
        "A4-2-1": {
          "completada": false
        },
        "A4-2-2": {
          "completada": false
        }
      }
    }
  ],
  "solicitudesVisita": [
    {
      "id": "SV-001",
      "clienteId": "CLI-001",
      "clienteNombre": "Banco Nacional",
      "sucursalId": "SUC-001",
      "sucursalNombre": "Sede Principal Centro",
      "tipoVisita": "PREVENTIVO",
      "dispositivoIds": [
        "1",
        "2"
      ],
      "dispositivosNombres": [
        "Cámara IP IMK-001",
        "Control de Acceso IMK-002"
      ],
      "fechaSugerida": "2026-03-20T09:00",
      "observacion": "Mantenimiento preventivo bimensual solicitado por el cliente.",
      "estado": "PROGRAMADO",
      "fechaSolicitud": "2026-03-05T10:30",
      "visitaId": "VIS-001"
    },
    {
      "id": "SV-002",
      "clienteId": "CLI-002",
      "clienteNombre": "Supermercados El Éxito",
      "sucursalId": "SUC-003",
      "sucursalNombre": "Sucursal Norte",
      "tipoVisita": "CORRECTIVO",
      "dispositivoIds": [
        "3"
      ],
      "dispositivosNombres": [
        "Cámara IP IMK-003"
      ],
      "fechaSugerida": "2026-03-22T14:00",
      "observacion": "Cámara de acceso principal presenta falla en la grabación nocturna.",
      "estado": "SOLICITUD",
      "fechaSolicitud": "2026-03-08T16:15",
      "visitaId": null
    },
    {
      "id": "SV-003",
      "clienteId": "CLI-001",
      "clienteNombre": "Banco Nacional",
      "sucursalId": "SUC-002",
      "sucursalNombre": "Sede Norte",
      "tipoVisita": "PREVENTIVO",
      "dispositivoIds": [
        "4",
        "5"
      ],
      "dispositivosNombres": [
        "Control de Acceso IMK-004",
        "Cámara Domo IMK-005"
      ],
      "fechaSugerida": "2026-04-01T10:00",
      "observacion": "Mantenimiento anual de todos los dispositivos de seguridad.",
      "estado": "CANCELADO",
      "fechaSolicitud": "2026-02-20T09:00",
      "visitaId": null
    }
  ],
  "usuarios": [
    {
      "id": "usr-dir",
      "email": "juan.perez@inmotika.com",
      "telefono": "3001234567",
      "rol": "DIRECTOR",
      "rolNombre": "Director",
      "nombres": "Juan Carlos",
      "apellidos": "Pérez",
      "estado": "ACTIVO"
    },
    {
      "id": "usr-coord",
      "email": "maria.gonzalez@inmotika.com",
      "telefono": "3002345678",
      "rol": "COORDINADOR",
      "rolNombre": "Coordinador",
      "nombres": "María",
      "apellidos": "González",
      "estado": "ACTIVO"
    },
    {
      "id": "usr-tec1",
      "email": "carlos.perez@inmotika.com",
      "telefono": "3003456789",
      "rol": "TECNICO",
      "rolNombre": "Técnico",
      "nombres": "Carlos",
      "apellidos": "Pérez",
      "estado": "ACTIVO"
    },
    {
      "id": "usr-tec2",
      "email": "laura.martinez@inmotika.com",
      "telefono": "3004567890",
      "rol": "TECNICO",
      "rolNombre": "Técnico",
      "nombres": "Laura",
      "apellidos": "Martínez",
      "estado": "ACTIVO"
    },
    {
      "id": "usr-admin",
      "email": "admin@inmotika.com",
      "telefono": "3001112233",
      "rol": "ADMIN",
      "rolNombre": "Administrador",
      "nombres": "Administrador",
      "apellidos": "Sistema",
      "estado": "ACTIVO"
    },
    {
      "id": "usr-cliente",
      "email": "cliente@banco.com",
      "telefono": "3009998877",
      "rol": "CLIENTE",
      "rolNombre": "Cliente",
      "nombres": "Representante",
      "apellidos": "Banco",
      "estado": "ACTIVO"
    }
  ],
  "tecnicos": [
    {
      "id": 101,
      "nombre": "Carlos Perez",
      "identificacion": "10203040",
      "especialidad": "Instalación",
      "zona": "Norte",
      "estado": "Activo",
      "celular": "3201234567",
      "correo": "c.perez@inmotika.com",
      "ciudad": "Bogotá"
    },
    {
      "id": 102,
      "nombre": "Juan Rodriguez",
      "identificacion": "50607080",
      "especialidad": "Mantenimiento",
      "zona": "Sur",
      "estado": "Activo",
      "celular": "3159876543",
      "correo": "j.rodriguez@inmotika.com",
      "ciudad": "Cali"
    }
  ],
  "clientes": [
    {
      "id": "CLI-001",
      "nombre": "Cliente Empresa 1",
      "nit": "800.900.100-1",
      "nit_numero": "8009001001",
      "tipo": "juridica",
      "telefono": "300 000 0001",
      "email": "contacto@empresa1.com",
      "sitioWeb": "www.empresa1.com",
      "direccion": "Calle 1 # 10-20",
      "ciudad": "Bogotá D.C.",
      "pais": "CO",
      "sucursales": [
        {
          "id": "SUC-CLI-001-1",
          "nombre": "Sucursal 1 - Empresa 1",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 1 # 10-10",
          "telefono": "311 000 1001",
          "email": "sucursal1@empresa1.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-11",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-001-1",
              "nombre": "Contacto",
              "apellido": "Sucursal 1",
              "tipo": "Administrador",
              "telefono": "320 000 1001",
              "email": "admin1@empresa1.com"
            }
          ]
        },
        {
          "id": "SUC-CLI-001-2",
          "nombre": "Sucursal 2 - Empresa 1",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 2 # 10-20",
          "telefono": "311 000 2001",
          "email": "sucursal2@empresa1.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-12",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-001-2",
              "nombre": "Contacto",
              "apellido": "Sucursal 2",
              "tipo": "Administrador",
              "telefono": "320 000 2001",
              "email": "admin2@empresa1.com"
            }
          ]
        },
        {
          "id": "SUC-CLI-001-3",
          "nombre": "Sucursal 3 - Empresa 1",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 3 # 10-30",
          "telefono": "311 000 3001",
          "email": "sucursal3@empresa1.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-13",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-001-3",
              "nombre": "Contacto",
              "apellido": "Sucursal 3",
              "tipo": "Administrador",
              "telefono": "320 000 3001",
              "email": "admin3@empresa1.com"
            }
          ]
        }
      ]
    },
    {
      "id": "CLI-002",
      "nombre": "Cliente Empresa 2",
      "nit": "800.900.200-1",
      "nit_numero": "8009002001",
      "tipo": "juridica",
      "telefono": "300 000 0002",
      "email": "contacto@empresa2.com",
      "sitioWeb": "www.empresa2.com",
      "direccion": "Calle 2 # 10-20",
      "ciudad": "Bogotá D.C.",
      "pais": "CO",
      "sucursales": [
        {
          "id": "SUC-CLI-002-1",
          "nombre": "Sucursal 1 - Empresa 2",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 1 # 20-10",
          "telefono": "311 000 1002",
          "email": "sucursal1@empresa2.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-21",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-002-1",
              "nombre": "Contacto",
              "apellido": "Sucursal 1",
              "tipo": "Administrador",
              "telefono": "320 000 1002",
              "email": "admin1@empresa2.com"
            }
          ]
        },
        {
          "id": "SUC-CLI-002-2",
          "nombre": "Sucursal 2 - Empresa 2",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 2 # 20-20",
          "telefono": "311 000 2002",
          "email": "sucursal2@empresa2.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-22",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-002-2",
              "nombre": "Contacto",
              "apellido": "Sucursal 2",
              "tipo": "Administrador",
              "telefono": "320 000 2002",
              "email": "admin2@empresa2.com"
            }
          ]
        },
        {
          "id": "SUC-CLI-002-3",
          "nombre": "Sucursal 3 - Empresa 2",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 3 # 20-30",
          "telefono": "311 000 3002",
          "email": "sucursal3@empresa2.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-23",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-002-3",
              "nombre": "Contacto",
              "apellido": "Sucursal 3",
              "tipo": "Administrador",
              "telefono": "320 000 3002",
              "email": "admin3@empresa2.com"
            }
          ]
        }
      ]
    },
    {
      "id": "CLI-003",
      "nombre": "Cliente Empresa 3",
      "nit": "800.900.300-1",
      "nit_numero": "8009003001",
      "tipo": "juridica",
      "telefono": "300 000 0003",
      "email": "contacto@empresa3.com",
      "sitioWeb": "www.empresa3.com",
      "direccion": "Calle 3 # 10-20",
      "ciudad": "Bogotá D.C.",
      "pais": "CO",
      "sucursales": [
        {
          "id": "SUC-CLI-003-1",
          "nombre": "Sucursal 1 - Empresa 3",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 1 # 30-10",
          "telefono": "311 000 1003",
          "email": "sucursal1@empresa3.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-31",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-003-1",
              "nombre": "Contacto",
              "apellido": "Sucursal 1",
              "tipo": "Administrador",
              "telefono": "320 000 1003",
              "email": "admin1@empresa3.com"
            }
          ]
        },
        {
          "id": "SUC-CLI-003-2",
          "nombre": "Sucursal 2 - Empresa 3",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 2 # 30-20",
          "telefono": "311 000 2003",
          "email": "sucursal2@empresa3.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-32",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-003-2",
              "nombre": "Contacto",
              "apellido": "Sucursal 2",
              "tipo": "Administrador",
              "telefono": "320 000 2003",
              "email": "admin2@empresa3.com"
            }
          ]
        },
        {
          "id": "SUC-CLI-003-3",
          "nombre": "Sucursal 3 - Empresa 3",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 3 # 30-30",
          "telefono": "311 000 3003",
          "email": "sucursal3@empresa3.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-33",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-003-3",
              "nombre": "Contacto",
              "apellido": "Sucursal 3",
              "tipo": "Administrador",
              "telefono": "320 000 3003",
              "email": "admin3@empresa3.com"
            }
          ]
        }
      ]
    },
    {
      "id": "CLI-004",
      "nombre": "Cliente Empresa 4",
      "nit": "800.900.400-1",
      "nit_numero": "8009004001",
      "tipo": "juridica",
      "telefono": "300 000 0004",
      "email": "contacto@empresa4.com",
      "sitioWeb": "www.empresa4.com",
      "direccion": "Calle 4 # 10-20",
      "ciudad": "Bogotá D.C.",
      "pais": "CO",
      "sucursales": [
        {
          "id": "SUC-CLI-004-1",
          "nombre": "Sucursal 1 - Empresa 4",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 1 # 40-10",
          "telefono": "311 000 1004",
          "email": "sucursal1@empresa4.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-41",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-004-1",
              "nombre": "Contacto",
              "apellido": "Sucursal 1",
              "tipo": "Administrador",
              "telefono": "320 000 1004",
              "email": "admin1@empresa4.com"
            }
          ]
        },
        {
          "id": "SUC-CLI-004-2",
          "nombre": "Sucursal 2 - Empresa 4",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 2 # 40-20",
          "telefono": "311 000 2004",
          "email": "sucursal2@empresa4.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-42",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-004-2",
              "nombre": "Contacto",
              "apellido": "Sucursal 2",
              "tipo": "Administrador",
              "telefono": "320 000 2004",
              "email": "admin2@empresa4.com"
            }
          ]
        },
        {
          "id": "SUC-CLI-004-3",
          "nombre": "Sucursal 3 - Empresa 4",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 3 # 40-30",
          "telefono": "311 000 3004",
          "email": "sucursal3@empresa4.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-43",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-004-3",
              "nombre": "Contacto",
              "apellido": "Sucursal 3",
              "tipo": "Administrador",
              "telefono": "320 000 3004",
              "email": "admin3@empresa4.com"
            }
          ]
        }
      ]
    },
    {
      "id": "CLI-005",
      "nombre": "Cliente Empresa 5",
      "nit": "800.900.500-1",
      "nit_numero": "8009005001",
      "tipo": "juridica",
      "telefono": "300 000 0005",
      "email": "contacto@empresa5.com",
      "sitioWeb": "www.empresa5.com",
      "direccion": "Calle 5 # 10-20",
      "ciudad": "Bogotá D.C.",
      "pais": "CO",
      "sucursales": [
        {
          "id": "SUC-CLI-005-1",
          "nombre": "Sucursal 1 - Empresa 5",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 1 # 50-10",
          "telefono": "311 000 1005",
          "email": "sucursal1@empresa5.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-51",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-005-1",
              "nombre": "Contacto",
              "apellido": "Sucursal 1",
              "tipo": "Administrador",
              "telefono": "320 000 1005",
              "email": "admin1@empresa5.com"
            }
          ]
        },
        {
          "id": "SUC-CLI-005-2",
          "nombre": "Sucursal 2 - Empresa 5",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 2 # 50-20",
          "telefono": "311 000 2005",
          "email": "sucursal2@empresa5.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-52",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-005-2",
              "nombre": "Contacto",
              "apellido": "Sucursal 2",
              "tipo": "Administrador",
              "telefono": "320 000 2005",
              "email": "admin2@empresa5.com"
            }
          ]
        },
        {
          "id": "SUC-CLI-005-3",
          "nombre": "Sucursal 3 - Empresa 5",
          "pais": "CO",
          "estado_depto": "CUN",
          "ciudad": "Bogotá D.C.",
          "direccion": "Carrera 3 # 50-30",
          "telefono": "311 000 3005",
          "email": "sucursal3@empresa5.com",
          "horario": "L-V 8am a 6pm",
          "contrato": "CONTRATO-2026-53",
          "contactos": [
            {
              "id": "CNT-SUC-CLI-005-3",
              "nombre": "Contacto",
              "apellido": "Sucursal 3",
              "tipo": "Administrador",
              "telefono": "320 000 3005",
              "email": "admin3@empresa5.com"
            }
          ]
        }
      ]
    }
  ],
  "dispositivos": [
    {
      "id": "DEV-SUC-CLI-001-1-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-111",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 1",
      "clienteId": "CLI-001",
      "sucursal": "Sucursal 1 - Empresa 1",
      "sucursalId": "SUC-CLI-001-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-001-1-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-112",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 1",
      "clienteId": "CLI-001",
      "sucursal": "Sucursal 1 - Empresa 1",
      "sucursalId": "SUC-CLI-001-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-001-1-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-113",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 1",
      "clienteId": "CLI-001",
      "sucursal": "Sucursal 1 - Empresa 1",
      "sucursalId": "SUC-CLI-001-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-001-1-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-114",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 1",
      "clienteId": "CLI-001",
      "sucursal": "Sucursal 1 - Empresa 1",
      "sucursalId": "SUC-CLI-001-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-001-2-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-121",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 1",
      "clienteId": "CLI-001",
      "sucursal": "Sucursal 2 - Empresa 1",
      "sucursalId": "SUC-CLI-001-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-001-2-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-122",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 1",
      "clienteId": "CLI-001",
      "sucursal": "Sucursal 2 - Empresa 1",
      "sucursalId": "SUC-CLI-001-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-001-2-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-123",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 1",
      "clienteId": "CLI-001",
      "sucursal": "Sucursal 2 - Empresa 1",
      "sucursalId": "SUC-CLI-001-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-001-2-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-124",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 1",
      "clienteId": "CLI-001",
      "sucursal": "Sucursal 2 - Empresa 1",
      "sucursalId": "SUC-CLI-001-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-001-3-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-131",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 1",
      "clienteId": "CLI-001",
      "sucursal": "Sucursal 3 - Empresa 1",
      "sucursalId": "SUC-CLI-001-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-001-3-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-132",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 1",
      "clienteId": "CLI-001",
      "sucursal": "Sucursal 3 - Empresa 1",
      "sucursalId": "SUC-CLI-001-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-001-3-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-133",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 1",
      "clienteId": "CLI-001",
      "sucursal": "Sucursal 3 - Empresa 1",
      "sucursalId": "SUC-CLI-001-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-001-3-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-134",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 1",
      "clienteId": "CLI-001",
      "sucursal": "Sucursal 3 - Empresa 1",
      "sucursalId": "SUC-CLI-001-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-002-1-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-211",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 2",
      "clienteId": "CLI-002",
      "sucursal": "Sucursal 1 - Empresa 2",
      "sucursalId": "SUC-CLI-002-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-002-1-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-212",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 2",
      "clienteId": "CLI-002",
      "sucursal": "Sucursal 1 - Empresa 2",
      "sucursalId": "SUC-CLI-002-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-002-1-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-213",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 2",
      "clienteId": "CLI-002",
      "sucursal": "Sucursal 1 - Empresa 2",
      "sucursalId": "SUC-CLI-002-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-002-1-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-214",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 2",
      "clienteId": "CLI-002",
      "sucursal": "Sucursal 1 - Empresa 2",
      "sucursalId": "SUC-CLI-002-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-002-2-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-221",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 2",
      "clienteId": "CLI-002",
      "sucursal": "Sucursal 2 - Empresa 2",
      "sucursalId": "SUC-CLI-002-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-002-2-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-222",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 2",
      "clienteId": "CLI-002",
      "sucursal": "Sucursal 2 - Empresa 2",
      "sucursalId": "SUC-CLI-002-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-002-2-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-223",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 2",
      "clienteId": "CLI-002",
      "sucursal": "Sucursal 2 - Empresa 2",
      "sucursalId": "SUC-CLI-002-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-002-2-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-224",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 2",
      "clienteId": "CLI-002",
      "sucursal": "Sucursal 2 - Empresa 2",
      "sucursalId": "SUC-CLI-002-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-002-3-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-231",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 2",
      "clienteId": "CLI-002",
      "sucursal": "Sucursal 3 - Empresa 2",
      "sucursalId": "SUC-CLI-002-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-002-3-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-232",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 2",
      "clienteId": "CLI-002",
      "sucursal": "Sucursal 3 - Empresa 2",
      "sucursalId": "SUC-CLI-002-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-002-3-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-233",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 2",
      "clienteId": "CLI-002",
      "sucursal": "Sucursal 3 - Empresa 2",
      "sucursalId": "SUC-CLI-002-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-002-3-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-234",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 2",
      "clienteId": "CLI-002",
      "sucursal": "Sucursal 3 - Empresa 2",
      "sucursalId": "SUC-CLI-002-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-003-1-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-311",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 3",
      "clienteId": "CLI-003",
      "sucursal": "Sucursal 1 - Empresa 3",
      "sucursalId": "SUC-CLI-003-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-003-1-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-312",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 3",
      "clienteId": "CLI-003",
      "sucursal": "Sucursal 1 - Empresa 3",
      "sucursalId": "SUC-CLI-003-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-003-1-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-313",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 3",
      "clienteId": "CLI-003",
      "sucursal": "Sucursal 1 - Empresa 3",
      "sucursalId": "SUC-CLI-003-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-003-1-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-314",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 3",
      "clienteId": "CLI-003",
      "sucursal": "Sucursal 1 - Empresa 3",
      "sucursalId": "SUC-CLI-003-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-003-2-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-321",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 3",
      "clienteId": "CLI-003",
      "sucursal": "Sucursal 2 - Empresa 3",
      "sucursalId": "SUC-CLI-003-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-003-2-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-322",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 3",
      "clienteId": "CLI-003",
      "sucursal": "Sucursal 2 - Empresa 3",
      "sucursalId": "SUC-CLI-003-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-003-2-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-323",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 3",
      "clienteId": "CLI-003",
      "sucursal": "Sucursal 2 - Empresa 3",
      "sucursalId": "SUC-CLI-003-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-003-2-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-324",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 3",
      "clienteId": "CLI-003",
      "sucursal": "Sucursal 2 - Empresa 3",
      "sucursalId": "SUC-CLI-003-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-003-3-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-331",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 3",
      "clienteId": "CLI-003",
      "sucursal": "Sucursal 3 - Empresa 3",
      "sucursalId": "SUC-CLI-003-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-003-3-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-332",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 3",
      "clienteId": "CLI-003",
      "sucursal": "Sucursal 3 - Empresa 3",
      "sucursalId": "SUC-CLI-003-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-003-3-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-333",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 3",
      "clienteId": "CLI-003",
      "sucursal": "Sucursal 3 - Empresa 3",
      "sucursalId": "SUC-CLI-003-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-003-3-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-334",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 3",
      "clienteId": "CLI-003",
      "sucursal": "Sucursal 3 - Empresa 3",
      "sucursalId": "SUC-CLI-003-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-004-1-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-411",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 4",
      "clienteId": "CLI-004",
      "sucursal": "Sucursal 1 - Empresa 4",
      "sucursalId": "SUC-CLI-004-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-004-1-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-412",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 4",
      "clienteId": "CLI-004",
      "sucursal": "Sucursal 1 - Empresa 4",
      "sucursalId": "SUC-CLI-004-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-004-1-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-413",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 4",
      "clienteId": "CLI-004",
      "sucursal": "Sucursal 1 - Empresa 4",
      "sucursalId": "SUC-CLI-004-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-004-1-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-414",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 4",
      "clienteId": "CLI-004",
      "sucursal": "Sucursal 1 - Empresa 4",
      "sucursalId": "SUC-CLI-004-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-004-2-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-421",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 4",
      "clienteId": "CLI-004",
      "sucursal": "Sucursal 2 - Empresa 4",
      "sucursalId": "SUC-CLI-004-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-004-2-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-422",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 4",
      "clienteId": "CLI-004",
      "sucursal": "Sucursal 2 - Empresa 4",
      "sucursalId": "SUC-CLI-004-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-004-2-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-423",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 4",
      "clienteId": "CLI-004",
      "sucursal": "Sucursal 2 - Empresa 4",
      "sucursalId": "SUC-CLI-004-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-004-2-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-424",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 4",
      "clienteId": "CLI-004",
      "sucursal": "Sucursal 2 - Empresa 4",
      "sucursalId": "SUC-CLI-004-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-004-3-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-431",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 4",
      "clienteId": "CLI-004",
      "sucursal": "Sucursal 3 - Empresa 4",
      "sucursalId": "SUC-CLI-004-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-004-3-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-432",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 4",
      "clienteId": "CLI-004",
      "sucursal": "Sucursal 3 - Empresa 4",
      "sucursalId": "SUC-CLI-004-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-004-3-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-433",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 4",
      "clienteId": "CLI-004",
      "sucursal": "Sucursal 3 - Empresa 4",
      "sucursalId": "SUC-CLI-004-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-004-3-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-434",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 4",
      "clienteId": "CLI-004",
      "sucursal": "Sucursal 3 - Empresa 4",
      "sucursalId": "SUC-CLI-004-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-005-1-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-511",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 5",
      "clienteId": "CLI-005",
      "sucursal": "Sucursal 1 - Empresa 5",
      "sucursalId": "SUC-CLI-005-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-005-1-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-512",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 5",
      "clienteId": "CLI-005",
      "sucursal": "Sucursal 1 - Empresa 5",
      "sucursalId": "SUC-CLI-005-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-005-1-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-513",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 5",
      "clienteId": "CLI-005",
      "sucursal": "Sucursal 1 - Empresa 5",
      "sucursalId": "SUC-CLI-005-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-005-1-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-514",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 5",
      "clienteId": "CLI-005",
      "sucursal": "Sucursal 1 - Empresa 5",
      "sucursalId": "SUC-CLI-005-1",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-005-2-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-521",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 5",
      "clienteId": "CLI-005",
      "sucursal": "Sucursal 2 - Empresa 5",
      "sucursalId": "SUC-CLI-005-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-005-2-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-522",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 5",
      "clienteId": "CLI-005",
      "sucursal": "Sucursal 2 - Empresa 5",
      "sucursalId": "SUC-CLI-005-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-005-2-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-523",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 5",
      "clienteId": "CLI-005",
      "sucursal": "Sucursal 2 - Empresa 5",
      "sucursalId": "SUC-CLI-005-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-005-2-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-524",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 5",
      "clienteId": "CLI-005",
      "sucursal": "Sucursal 2 - Empresa 5",
      "sucursalId": "SUC-CLI-005-2",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-005-3-1",
      "nombre": "Dispositivo 1 (Seguridad Electrónica)",
      "categoriaId": "cat-1",
      "categoria": "Seguridad Electrónica",
      "marca": "Generica",
      "modelo": "Mod-1",
      "serial": "SN-531",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 5",
      "clienteId": "CLI-005",
      "sucursal": "Sucursal 3 - Empresa 5",
      "sucursalId": "SUC-CLI-005-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-005-3-2",
      "nombre": "Dispositivo 2 (Control de Acceso)",
      "categoriaId": "cat-2",
      "categoria": "Control de Acceso",
      "marca": "Generica",
      "modelo": "Mod-2",
      "serial": "SN-532",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 5",
      "clienteId": "CLI-005",
      "sucursal": "Sucursal 3 - Empresa 5",
      "sucursalId": "SUC-CLI-005-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-005-3-3",
      "nombre": "Dispositivo 3 (Detección de Incendios)",
      "categoriaId": "cat-3",
      "categoria": "Detección de Incendios",
      "marca": "Generica",
      "modelo": "Mod-3",
      "serial": "SN-533",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 5",
      "clienteId": "CLI-005",
      "sucursal": "Sucursal 3 - Empresa 5",
      "sucursalId": "SUC-CLI-005-3",
      "pasos": []
    },
    {
      "id": "DEV-SUC-CLI-005-3-4",
      "nombre": "Dispositivo 4 (Redes y Telecom)",
      "categoriaId": "cat-4",
      "categoria": "Redes y Telecom",
      "marca": "Generica",
      "modelo": "Mod-4",
      "serial": "SN-534",
      "estadoId": "est-1",
      "estado": "ACTIVO",
      "cliente": "Cliente Empresa 5",
      "clienteId": "CLI-005",
      "sucursal": "Sucursal 3 - Empresa 5",
      "sucursalId": "SUC-CLI-005-3",
      "pasos": []
    }
  ],
  "categorias": [
    {
      "id": "cat-1",
      "nombre": "Seguridad Electrónica",
      "descripcion": "Sistemas CCTV, Alarma",
      "activo": true
    },
    {
      "id": "cat-2",
      "nombre": "Control de Acceso",
      "descripcion": "Biometría, Torniquetes",
      "activo": true
    },
    {
      "id": "cat-3",
      "nombre": "Detección de Incendios",
      "descripcion": "Paneles, Sensores humo",
      "activo": true
    },
    {
      "id": "cat-4",
      "nombre": "Redes y Telecom",
      "descripcion": "Switches, Routers, APs",
      "activo": true
    }
  ]
};
