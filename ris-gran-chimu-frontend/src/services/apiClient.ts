// src/services/apiClient.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// URL
// URL
const BASE_URL = 'https://ris-gran-chimu-backend.vercel.app/api';

// Instancia de axios
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// `common` para establecer el header global
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('🔐 [setAuthToken] Header configurado con token');
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    console.log('🔓 [setAuthToken] Header eliminado');
  }
};

// Recuperar el token al iniciar la app
export const getStoredToken = async () => {
  try {
    const stored = await SecureStore.getItemAsync('authToken');
    if (stored) {
      setAuthToken(stored);
    }
    return stored;
  } catch (error) {
    console.error('Error al recuperar el token:', error);
    return null;
  }
};

export default apiClient;