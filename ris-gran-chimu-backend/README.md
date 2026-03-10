# 🚀 RIS Gran Chimú - Backend API

![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)
![MySQL](https://img.shields.io/badge/MySQL-Database-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Swagger](https://img.shields.io/badge/Swagger-Docs-green)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)

API REST robusta desarrollada con **Next.js 16 (API Routes)** para la Red Integrada de Salud Gran Chimú. Este backend centraliza la gestión de noticias, establecimientos, servicios médicos, estrategias de salud y normativas institucionales.

🔗 **Proyecto Frontend:** [ris-gran-chimu-frontend](../ris-gran-chimu-frontend) (React Native + Expo)

## 📑 Tabla de Contenidos

- [ Características principales](#-características-principales)
- [🛠 Arquitectura y Tecnologías](#-arquitectura-y-tecnologías)
- [📦 Estructura del Proyecto](#-estructura-del-proyecto)
- [🔧 Configuración Local](#-configuración-local)
- [🌐 Endpoints del Sistema](#-endpoints-del-sistema)
- [📘 Documentación de la API (Swagger)](#-documentación-de-la-api-swagger)
- [🗂 Esquema de Base de Datos](#-esquema-de-base-de-datos)
- [🚀 Despliegue (Vercel)](#-despliegue-vercel)

## 📋 Características principales

- ✅ **Seguridad:** Autenticación basada en JWT (JSON Web Tokens) con expiración configurable.
- ✅ **Control de Acceso:** Sistema de roles (`admin`, `editor`, `public`) con middlewares de permisos.
- ✅ **Gestión de Contenidos:** CRUD completo para Noticias, Normas, Establecimientos, Servicios y Estrategias.
- ✅ **Auditoría Integrada:** Seguimiento automático de quién creó y actualizó cada registro.
- ✅ **Documentación Viva:** OpenAPI 3.0 integrado con Swagger UI para pruebas en tiempo real.
- ✅ **CORS:** Configuración optimizada para consumo desde aplicaciones móviles y web externas.

## 🛠 Arquitectura y Tecnologías

- **Framework:** Next.js 16 (Turbopack optimizado)
- **Base de Datos:** MySQL (Hosting en Railway/Vercel)
- **Seguridad:** `bcryptjs` para hashing de contraseñas y `jsonwebtoken` para sesiones.
- **Documentación:** `swagger-jsdoc` y `swagger-ui-react`.
- **Hosting:** Optimizado para **Vercel** con Serverless Functions.

## 📦 Estructura del proyecto

```text
├── pages/api/
│   ├── auth/              # Login y verificación de clave
│   ├── public/            # API pública (Noticias, Normas, etc.)
│   ├── establecimientos/  # CRUD de locales de salud
│   ├── estrategias/       # Gestión de planes de salud
│   ├── normas/            # Repositorio documental
│   ├── noticias/          # Publicaciones institucionales
│   ├── servicios/         # Catálogo de servicios médicos
│   ├── users/             # Gestión de cuentas administrativas
│   └── api-docs.json.ts   # Especificación OpenAPI
├── lib/
│   ├── middleware/        # Middlewares de Auth, Roles y Permisos
│   ├── db.ts              # Conexión pool de MySQL (mysql2)
│   └── jwt.ts             # Lógica de firmado y verificación JWT
├── models/                # Lógica de abstracción de datos
├── scripts/               # Utilidades (Sembrado de admin inicial)
├── swaggerDocs.ts         # Definición Swagger/OpenAPI 3.0
├── next.config.ts         # Configuración del servidor Next.js
└── package.json           # Dependencias y scripts del proyecto
```

## 🔧 Configuración Local

1. **Clonar e Instalar:**
   ```bash
   npm install
   ```

2. **Variables de Entorno (`.env.local`):**
   ```env
   DB_HOST=tu_host_mysql
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password
   DB_NAME=risgch_normas
   DB_PORT=XXXX
   JWT_SECRET=tu_clave_secreta
   JWT_EXPIRES_IN=24h
   ```

3. **Ejecutar:**
   ```bash
   npm run dev
   ```
   Acceso local: `http://localhost:3000`

## 🌐 Endpoints del Sistema

| Categoría | Método | Path | Descripción |
| :--- | :--- | :--- | :--- |
| **Auth** | POST | `/api/auth/login` | Inicio de sesión y obtención de token |
| **Público** | GET | `/api/public/noticias` | Listado de noticias (público) |
| **Público** | GET | `/api/public/normas` | Listado de normativas (público) |
| **Admin** | POST | `/api/noticias` | Crear noticia (Requiere rol editor/admin) |
| **Admin** | GET | `/api/users` | Gestión de usuarios (Solo admin) |

## 📘 Documentación de la API (Swagger)

La documentación interactiva completa está disponible en:
👉 **[https://ris-gran-chimu-backend.vercel.app/apidocs](https://ris-gran-chimu-backend.vercel.app/apidocs)** (Producción)
👉 `http://localhost:3000/apidocs` (Local)

## � Esquema de Base de Datos

El sistema utiliza un esquema relacional optimizado para auditoría:
- **`usuarios`**: Gestión de personal con roles específicos.
- **`noticias`**: Contenido dinámico con soporte de imágenes y links externos.
- **`normas`**: Repositorio documental legislativo/institucional.
- **`establecimientos` / `servicios` / `estrategias`**: Catálogo de atención de salud.

## � Despliegue (Vercel)

El proyecto está configurado para despliegue automático en Vercel. 
**Nota:** Asegúrate de configurar las variables de entorno en el panel de Vercel (Settings -> Environment Variables) antes del primer push.

---
© 2026 Red Integrada de Salud Gran Chimú. Todos los derechos reservados.