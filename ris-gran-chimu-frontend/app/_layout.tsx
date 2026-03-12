import { AuthProvider } from '@/src/hooks/useAuth';
import * as NavigationBar from 'expo-navigation-bar';
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Fondo blanco para la barra de navegación inferior
      NavigationBar.setBackgroundColorAsync('white');
      // Íconos oscuros (gris/negro) para que se vean sobre el fondo blanco
      NavigationBar.setButtonStyleAsync('dark');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </SafeAreaProvider>
  );
}