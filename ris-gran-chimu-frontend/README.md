# 📱 RIS Gran Chimú - Mobile App

![Expo](https://img.shields.io/badge/Expo-000000?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)

Aplicación móvil oficial de la **Red Integrada de Salud Gran Chimú**. Esta herramienta permite a los ciudadanos acceder a información de salud en tiempo real y ofrece un panel administrativo para la gestión eficiente de contenidos institucionales.

🔗 **Backend API:** [ris-gran-chimu-backend](../ris-gran-chimu-backend)

## ✨ Características principales

- 📰 **Noticias Institucionales:** Carrusel dinámico con las últimas novedades de la RIS.
- 🏥 **Guía de Salud:** Información detallada sobre Establecimientos, Servicios y Estrategias.
- ⚖️ **Normativas:** Acceso público a resoluciones y documentos oficiales.
- 🔐 **Gestión Administrativa:** Panel de control protegido para editores y administradores.
- 📡 **Modo Offline:** Persistencia de sesión y optimización de carga de datos.
- 🎨 **Diseño Moderno:** Interfaz intuitiva basada en los estándares de accesibilidad del MINSA.

## 🛠 Stack Tecnológico

- **Framework:** Expo (SDK 51+) con React Native.
- **Navegación:** Expo Router (File-based routing).
- **Consumo de API:** Axios con interceptores para gestión de tokens JWT.
- **Seguridad:** `expo-secure-store` y `AsyncStorage` para manejo de sesiones asíncronas.
- **Iconografía:** `lucide-react-native`.

## 📦 Estructura del Proyecto

```text
├── app/                  # Rutas de la App (Expo Router)
│   ├── (auth)/           # Pantallas de Login y Recuperación
│   ├── (main)/           # Dashboard centralizado por roles
│   │   └── dashboard/    # Admin, Editor y Gestión (Manage)
│   ├── landing/          # Pantallas públicas (Inicio, Noticias)
│   │   ├── noticias.tsx  # Visor de noticias institucionales
│   │   └── contacto.tsx  # Canales de atención ciudadana
│   ├── _layout.tsx       # Configuración global de navegación
│   └── index.tsx         # Punto de entrada (Landing principal)
├── src/
│   ├── components/       # Elementos UI compartidos
│   ├── hooks/            # useAuth, useDebounce, useThemeColor
│   ├── services/         # apiClient (Axios) y authService
│   ├── types/            # Definiciones de TypeScript (Auth, Noticia)
│   └── context/          # Contextos de Permisos y Preferencias
├── assets/               # Logos, Imágenes y Splash Screen
├── app.json              # Configuración de Expo y EAS
└── package.json          # Dependencias y Scripts de build
```

## 🚀 Inicio Rápido

1. **Instalación:**
   ```bash
   npm install
   ```

2. **Configuración de API:**
   Asegúrate de que la `BASE_URL` en `src/services/apiClient.ts` apunte a tu servidor de producción o local:
   ```typescript
   const BASE_URL = 'https://ris-gran-chimu-backend.vercel.app/api';
   ```

3. **Ejecución:**
   ```bash
   npx expo start
   ```
   Escanea el código QR con la app **Expo Go** en tu dispositivo Android o iOS.

## 📦 Generación de APK (Android)

Para generar una versión instalable utilizando EAS Build:

```bash
eas build -p android --profile preview
```

## 🔐 Seguridad y Autenticación

La app implementa un sistema de validación de tokens en tiempo real:
- Si el token expira durante el uso, la app detecta automáticamente el estado `401` y redirige al usuario a la pantalla de bienvenida.
- Se utiliza un sistema de **"Lazy Auth"** para mantener la app funcional incluso si el servidor backend demora en responder.

---
© 2026 Red Integrada de Salud Gran Chimú. Desarrollo enfocado en la salud digital.

