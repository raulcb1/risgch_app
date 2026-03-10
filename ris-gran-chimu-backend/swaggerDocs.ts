const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RIS Gran Chimú API',
      version: '1.0.0',
      description: 'API REST para el sistema de gestión de la Red Integrada de Salud Gran Chimú. Incluye gestión de normativas, noticias, servicios, establecimientos, estrategias y control de acceso (RBAC).'
    },
    servers: [
      { url: 'http://localhost:3000/api', description: 'Servidor de Desarrollo' }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Introduce el token JWT obtenido en `/api/auth/login`'
        }
      },
      schemas: {
        // --- SCHEMAS PÚBLICOS ---
        PublicNorma: {
          type: 'object',
          properties: {
            id_norma: { type: 'integer', example: 1 },
            anho: { type: 'integer', example: 2025 },
            nombre_norma: { type: 'string', example: "RD N° 123-2025-RIS-GC" },
            descripcion: { type: 'string', example: "Aprobar el plan de contingencia..." },
            fecha_norma: { type: 'string', format: 'date', example: "2025-01-15" },
            archivo: { type: 'string', format: 'uri', nullable: true, example: "https://midominio.com/archivos/norma.pdf" }
          }
        },
        PublicNoticia: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            titulo: { type: 'string', example: "Campaña de vacunación" },
            descripcion: { type: 'string', example: "Este fin de semana..." },
            imagen_url: { type: 'string', format: 'uri', nullable: true },
            fecha: { type: 'string', format: 'date', example: "2025-02-01" },
            link_facebook: { type: 'string', format: 'uri', nullable: true }
          }
        },
        PublicServicio: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            descripcion: { type: 'string' },
            icono: { type: 'string', nullable: true }
          }
        },
        PublicEstrategia: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            titulo: { type: 'string' },
            descripcion: { type: 'string' },
            icono: { type: 'string', nullable: true }
          }
        },
        PublicEstablecimiento: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            direccion: { type: 'string' },
            telefono: { type: 'string', nullable: true },
            map_link: { type: 'string', format: 'uri', nullable: true },
            servicios: {
              type: 'array',
              items: { $ref: '#/components/schemas/PublicServicio' }
            }
          }
        },

        // --- SCHEMAS PROTEGIDOS ---
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            email: { type: 'string' },
            rol: { type: 'string' },
            nombre_usuario_creador: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            descripcion: { type: 'string', nullable: true },
            activo: { type: 'boolean' },
            permisos: {
              type: 'array',
              items: { type: 'integer' }
            }
          }
        },
        Norma: {
          type: 'object',
          properties: {
            id_norma: { type: 'integer' },
            cod_tipo_norma: { type: 'integer' },
            tipo_nombre: { type: 'string' },
            nombre_norma: { type: 'string' },
            descripcion: { type: 'string' },
            fecha_norma: { type: 'string', format: 'date' },
            archivo: { type: 'string', nullable: true },
            activo: { type: 'integer', enum: [0, 1] },
            fecha_registro: { type: 'string', format: 'date-time' },
            creado_por_nombre: { type: 'string' }
          }
        },
        Noticia: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            titulo: { type: 'string' },
            descripcion: { type: 'string' },
            imagen_url: { type: 'string', nullable: true },
            link_facebook: { type: 'string' },
            fecha: { type: 'string', format: 'date' },
            creado_por_nombre: { type: 'string' }
          }
        },

        // --- AUTH ---
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            token: { type: 'string' }
          }
        }
      }
    },
    tags: [
      { name: 'Public', description: 'Endpoints accesibles sin autenticación' },
      { name: 'Auth', description: 'Autenticación y verificación de sesión' },
      { name: 'Users', description: 'Gestión de cuentas de usuario' },
      { name: 'Roles', description: 'Gestión de roles y permisos (RBAC)' },
      { name: 'Normas', description: 'Gestión de documentos normativos' },
      { name: 'Noticias', description: 'Gestión de noticias y comunicados' },
      { name: 'Establecimientos', description: 'Gestión de centros de salud' },
      { name: 'Servicios', description: 'Catálogo de servicios de salud' },
      { name: 'Estrategias', description: 'Programas y estrategias sanitarias' }
    ]
  },
  apis: ['./pages/api/**/*.ts']
};

export default options;