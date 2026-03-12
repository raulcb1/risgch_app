// app/(main)/dashboard/index.tsx
import { useAuth } from '@/src/hooks/useAuth';
import { usePermissions } from '@/src/context/PermissionContext';
import { useRouter } from 'expo-router';
import { FileText, Hospital, LogOut, Newspaper, Settings, Shield, Target, User, Users } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DynamicDashboard() {
  const { user, signOut } = useAuth();
  const { hasPermission, loading } = usePermissions();
  const router = useRouter();

  // Definición centralizada de opciones
  const allOptions = [
    {
      code: 'manage_roles',
      label: 'Gestionar Roles',
      description: 'Configurar roles y permisos',
      icon: Shield,
      route: './dashboard/manage/roles',
      color: '#FF9500',
    },
    {
      code: 'manage_users', // Permiso requerido
      label: 'Gestionar Usuarios',
      description: 'Crear, editar, eliminar y ver usuarios',
      icon: Users,
      route: './dashboard/admin/users', // Ajustar rutas
      color: '#007AFF',
    },
    {
      code: 'manage_normas',
      label: 'Gestionar Normas',
      description: 'Administrar normativas',
      icon: FileText,
      route: './dashboard/manage/normas',
      color: '#5856D6',
    },
    {
      code: 'manage_noticias',
      label: 'Gestionar Noticias',
      description: 'Publicar noticias',
      icon: Newspaper,
      route: './dashboard/manage/noticias',
      color: '#FF2D55',
    },
    {
      code: 'manage_servicios',
      label: 'Gestionar Servicios',
      description: 'Configurar servicios de salud',
      icon: Settings,
      route: './dashboard/manage/servicios',
      color: '#FF9500',
    },
    {
      code: 'manage_establecimientos',
      label: 'Gestionar Establecimientos',
      description: 'Registrar centros de salud',
      icon: Hospital,
      route: './dashboard/manage/establecimientos',
      color: '#34C759',
    },
    {
      code: 'manage_estrategias',
      label: 'Gestionar Estrategias',
      description: 'Programas de salud',
      icon: Target,
      route: './dashboard/manage/estrategias',
      color: '#AF52DE',
    },
  ];

  // Filtrar opciones basado en permisos
  const availableOptions = allOptions.filter(opt => hasPermission(opt.code));

  if (loading) return <View style={styles.container}><Text>Cargando menú...</Text></View>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Cabecera */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: '#007AFF' }]}>
            <User color="#ffffff" size={24} />
          </View>
          <View>
            <Text style={styles.welcomeText}>¡Bienvenido!</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.roleBadge}>
              <Shield color="#fff" size={12} />
              <Text style={styles.roleText}>{user?.role.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() =>
            Alert.alert(
              'Cerrar sesión',
              '¿Estás seguro de que deseas cerrar tu sesión?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Cerrar sesión',
                  style: 'destructive',
                  onPress: () => signOut(),
                },
              ]
            )
          }
        >
          <LogOut color="#007AFF" size={20} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Opciones */}
      <View style={styles.optionsContainer}>
        {availableOptions.length > 0 ? (
            availableOptions.map((option, index) => (
            <TouchableOpacity
                key={index}
                style={styles.optionCard}
                onPress={() => router.push(option.route as any)}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconWrapper, { backgroundColor: option.color + '20' }]}>
                    <option.icon color={option.color} size={20} />
                </View>
                <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={styles.optionTitle} numberOfLines={1} ellipsizeMode="tail">
                    {option.label}
                    </Text>
                    <Text
                    style={styles.optionDescription}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    >
                    {option.description}
                    </Text>
                </View>
                </View>
            </TouchableOpacity>
            ))
        ) : (
            <Text style={{textAlign: 'center', marginTop: 20, color: '#666'}}>
                No tienes permisos asignados. Contacta al administrador.
            </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>RIS Gran Chimu</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6c757d',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  logoutText: {
    color: '#007AFF',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 6,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
  },
});
