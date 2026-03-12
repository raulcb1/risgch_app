// app/(main)/_layout.tsx
import { useAuth } from '@/src/hooks/useAuth';
import { PermissionProvider } from '@/src/context/PermissionContext';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function MainLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log('🔄 [MainLayout] user:', user);
  console.log('⏳ [MainLayout] loading:', loading);

  useEffect(() => {
    if (!loading && !user) {
      console.log('❌ [MainLayout] Sin usuario → redirigiendo al inicio..');
      router.replace('/landing');
    } else if (!loading && user) {
      console.log('✅ [MainLayout] Usuario autenticado:', user);
    }
  }, [user, loading]);

  if (loading) return null;

  return (
    <PermissionProvider>
        <Stack />
    </PermissionProvider>
  );
}