// app/(auth)/login-admin.tsx
import { useAuth } from '@/src/hooks/useAuth';
import { useRouter } from 'expo-router';
import { Eye, EyeClosed, Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginAdminScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Correo y contraseña son obligatorios');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // El hook `useAuth` ya se encarga de redirigir según rol
    } catch (error: any) {
      console.error('Error en login:', error);
      Alert.alert('Error', error.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Lock size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Acceso Administrativo</Text>
        <Text style={styles.subtitle}>Sistema de Gestión de la Red de Salud</Text>
      </View>

      {/* Formulario */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Iniciar Sesión</Text>
        <Text style={styles.formSubtitle}>Solo para administradores y editores</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputWrapper}>
            <Mail color="#6c757d" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="correo@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputWrapper}>
            <Lock color="#6c757d" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              secureTextEntry={!passwordVisible}
              autoComplete="password"
              textContentType="password"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
              {passwordVisible ? (
                <Eye color="#6c757d" size={20} />
              ) : (
                <EyeClosed color="#6c757d" size={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#0066CC',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    padding: 24,
    flex: 1,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#003366',
    marginBottom: 4,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ced4da',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 16,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 20,
  },
});