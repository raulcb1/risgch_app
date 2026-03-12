// app/(main)/dashboard/editor/index.tsx
import { useAuth } from '@/src/hooks/useAuth';
import { useRouter } from 'expo-router';
import { FileText, Hospital, LogOut, Newspaper, Settings, Target, User } from 'lucide-react-native';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EditorDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Opciones del editor (sin gestión de usuarios)
  // app/(main)/editor/index.tsx
  const options = [
    {
      label: 'Gestionar Normas',
      description: 'Administrar todas las normativas activas e inactivas',
      icon: FileText,
      onPress: () => router.push('./manage/normas'),
      color: '#5856D6',
    },
    {
      label: 'Gestionar Noticias',
      description: 'Publicar y editar noticias institucionales',
      icon: Newspaper,
      onPress: () => router.push('./manage/noticias'),
      color: '#FF2D55',
    },
    {
      label: 'Gestionar Servicios',
      description: 'Configurar servicios de salud disponibles',
      icon: Settings,
      onPress: () => router.push('./manage/servicios'),
      color: '#FF9500',
    },
    {
      label: 'Gestionar Establecimientos',
      description: 'Registrar y actualizar centros de salud',
      icon: Hospital,
      onPress: () => router.push('./manage/establecimientos'),
      color: '#34C759',
    },
    {
      label: 'Gestionar Estrategias',
      description: 'Definir y promover programas de salud',
      icon: Target,
      onPress: () => router.push('./manage/estrategias'),
      color: '#AF52DE',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Cabecera */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: '#5856D6' }]}>
            <User color="#ffffff" size={24} />
          </View>
          <View>
            <Text style={styles.welcomeText}>Bienvenido</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.roleBadge}>
              <FileText color="#fff" size={12} />
              <Text style={styles.roleText}>{user?.role.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Botón de cerrar sesión con confirmación */}
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

      {/* Opciones principales */}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionCard}
            onPress={option.onPress}
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
        ))}
      </View>

      {/* Footer opcional */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Panel de Editor - RIS Gran Chimu</Text>
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
    backgroundColor: '#5856D6',
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