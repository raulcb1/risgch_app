// app/index.tsx
import { useAuth } from '@/src/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Espera a que termine la carga del auth
    if (!loading) {
      console.log('🚦 index.tsx: Definiendo redirección');
      console.log('👤 user:', user);

      // Redirige según plataforma
      if (Platform.OS === 'web') {
        console.log('➡️ Web: redirigiendo al inicio');
        router.replace('/landing');
      } else {
        if (user) {
          console.log('✅ Usuario encontrado, redirigiendo al dashboard');
          if (user.role === 'admin') {
            router.replace('/(main)/dashboard/admin');
          } else if (user.role === 'editor') {
            router.replace('/(main)/dashboard/editor');
          }
        } else {
          console.log('❌ No hay usuario, yendo al inicio');
          router.replace('/landing');
        }
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando autenticación...</Text>
      </View>
    );
  }
  return null;
}