// src/hooks/useAuth.tsx
import type { LoginResponse } from '@/src/types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, AppState, Platform } from 'react-native';
import apiClient, { setAuthToken } from '../services/apiClient';

// === Tipos ===
type UserRole = string;

type User = {
  id: string;
  name: string;
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
};

// === Contexto ===
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// === Clave para almacenamiento ===
const USER_STORAGE_KEY = '@ris_gran_chimu_user';

// === Provider ===
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const expiryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpia timeout de expiración
  const clearExpiry = () => {
    if (expiryTimeoutRef.current) {
      clearTimeout(expiryTimeoutRef.current);
      expiryTimeoutRef.current = null;
    }
  };

  // Cierra sesión
  const signOut = async () => {
    clearExpiry();
    setUser(null);
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.warn('Error removing user storage on signOut', e);
    }
    delete apiClient.defaults.headers.common['Authorization'];
    router.replace('/landing');
  };

  // Decodifica JWT para verificar exp
  const decodeJwt = (token: string): { exp?: number } | null => {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  };

  // Programa cierre de sesión cuando expire el token
  const scheduleExpiry = (token: string | null) => {
    if (!token) return;
    clearExpiry();

    const payload = decodeJwt(token);
    if (!payload?.exp) return;

    const now = Math.floor(Date.now() / 1000);
    const delayMs = (payload.exp - now) * 1000;

    if (delayMs <= 0) {
      Alert.alert('Sesión expirada', 'Tu sesión ha caducado. Se cerrará la sesión.', [
        { text: 'Aceptar', onPress: signOut },
      ]);
      return;
    }

    expiryTimeoutRef.current = setTimeout(() => {
      Alert.alert('Sesión expirada', 'Tu sesión ha caducado. Se cerrará la sesión.', [
        { text: 'Aceptar', onPress: signOut },
      ]);
    }, delayMs);
  };

  // Carga el usuario desde AsyncStorage al montar
  useEffect(() => {
    loadUser();

    // Opcional: cierra sesión al fondo (opcional)
    let removeAppListener: (() => void) | null = null;
    if (Platform.OS !== 'web' && AppState) {
      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'background') {
          // Opcional: desactivar esto si no quieres cerrar al fondo
          // signOut();
        }
      });
      removeAppListener = () => subscription.remove();
    } else if (typeof window !== 'undefined') {
      const onBeforeUnload = () => {
        // No elimines el token aquí si quieres mantener sesión
      };
      window.addEventListener('beforeunload', onBeforeUnload);
      removeAppListener = () => window.removeEventListener('beforeunload', onBeforeUnload);
    }

    return () => {
      if (removeAppListener) removeAppListener();
      clearExpiry();
    };
  }, []);

  const loadUser = async () => {
    try {
      const saved = await AsyncStorage.getItem(USER_STORAGE_KEY);
      console.log('💾 [loadStoredUser] Valor crudo de AsyncStorage:', saved);

      if (!saved) {
        console.log('🔍 [loadStoredUser] No hay sesión guardada');
        return;
      }

      const parsed = JSON.parse(saved);
      const { user: storedUser, token } = parsed;

      if (!storedUser || !token) {
        console.log('⚠️ [loadStoredUser] Datos incompletos en almacenamiento');
        return;
      }

      // Validación básica del tipo
      if (
        typeof storedUser.id !== 'string' ||
        typeof storedUser.name !== 'string' ||
        typeof storedUser.role !== 'string'
      ) {
        console.warn('⚠️ [loadStoredUser] Tipo de usuario inválido');
        return;
      }

      console.log('✅ [loadStoredUser] Usuario cargado:', storedUser);
      console.log('🔑 [loadStoredUser] Token cargado (longitud):', token.length);

      setAuthToken(token);

      // Intenta validar con el backend
      try {
        await apiClient.get('/auth/me');
        setUser(storedUser);
        scheduleExpiry(token);
      } catch (err: any) {
        console.warn('⚠️ [loadStoredUser] Validación de token falló:', err.response?.status);
        if (err.response?.status === 401) {
          Alert.alert('Sesión expirada', 'Tu sesión ha caducado. Se cerrará la sesión.', [
            { text: 'Aceptar', onPress: signOut },
          ]);
          return;
        }

        // Valida localmente si el token está vencido
        const payload = decodeJwt(token);
        const now = Math.floor(Date.now() / 1000);
        if (payload?.exp && payload.exp < now) {
          Alert.alert('Sesión expirada', 'Tu sesión ha caducado. Se cerrará la sesión.', [
            { text: 'Aceptar', onPress: signOut },
          ]);
          return;
        }

        // Usa el token local si parece válido
        setUser(storedUser);
        scheduleExpiry(token);
      }
    } catch (error) {
      console.error('❌ [loadStoredUser] Error al cargar:', error);
    } finally {
      setLoading(false);
    }
  };

  // Iniciar sesión
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('🔐 Paso 1: Iniciando login...');
      const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
      const { user: userData, token } = response.data;

      // Mapea los campos del backend al modelo frontend
      const mappedUser: User = {
        id: String(userData.id),
        name: userData.nombre || userData.nombre || 'Usuario',
        role: (userData.rol || userData.rol || 'guest') as UserRole,
      };

      console.log('✅ Paso 2: Usuario mapeado:', mappedUser);

      console.log('💾 Paso 3: Intentando guardar en AsyncStorage...');
      await AsyncStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify({ user: mappedUser, token })
      );
      console.log('🎉 Paso 4: Guardado EXITOSO en AsyncStorage');

      setUser(mappedUser);
      setAuthToken(token);
      scheduleExpiry(token);

      // Redirige al dashboard unificado
      setTimeout(() => {
          router.replace('/(main)/dashboard' as any);
      }, 100);
    } catch (error: any) {
      console.error('ERROR en signIn:', error);

      let errorMessage = 'No se pudo iniciar sesión. Revisa tus credenciales e inténtalo de nuevo.';

      if (error.response) {
        // El servidor respondió con un código de error
        switch (error.response.status) {
          case 401:
            errorMessage = 'Correo o contraseña incorrectos.';
            break;
          case 404:
            errorMessage = 'Usuario no encontrado.';
            break;
          case 500:
            errorMessage = 'Error del servidor. Intenta más tarde.';
            break;
          default:
            errorMessage = 'No se pudo conectar con el servidor.';
        }
      } else if (error.request) {
        // No hubo respuesta (problema de red)
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
      } else {
        // Otro tipo de error (raro)
        errorMessage = 'Ocurrió un error inesperado. Intenta nuevamente.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}