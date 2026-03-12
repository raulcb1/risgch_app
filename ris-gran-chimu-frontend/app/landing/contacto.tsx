// app/landing/contacto.tsx
import * as Linking from 'expo-linking';
import {
  Clock,
  Facebook,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ContactScreen() {
  // Funciones de redirección
  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleMap = () => {
    const address = 'CASCAS - Red Integrada de Salud Gran Chimú';
    const query = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleFacebook = () => {
    const fbUrl = 'https://www.facebook.com/RedSaludGranChimuCascas'; // Reemplaza con tu URL real
    Linking.openURL(fbUrl).catch(() => {
      // Si no se puede abrir en Facebook App, abre en navegador
      Linking.openURL('https://www.facebook.com/RedSaludGranChimuCascas');
    });
  };

  return (
    <View style={styles.container}>
      {/* Header Fijo */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Phone size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Contacto</Text>
        <Text style={styles.subtitle}>Estamos aquí para atenderte</Text>
      </View>

      {/* ScrollView con contenido */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Contenido principal */}
        <View style={styles.content}>
        {/* Tarjeta de emergencias (primera) */}
        <TouchableOpacity
          style={styles.emergencyCard}
          onPress={() => handleCall('106')}
          activeOpacity={0.8}
        >
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyTitle}>Emergencias 24/7</Text>
            <Text style={styles.emergencyNumber}>106</Text>
            <Text style={styles.emergencySubtext}>
              Línea gratuita para emergencias médicas
            </Text>
          </View>
        </TouchableOpacity>

        {/* Información de contacto */}
        <Text style={styles.sectionTitle}>Información de Contacto</Text>

        {/* Teléfono */}
        <TouchableOpacity
          style={styles.infoCard}
          onPress={() => handleCall('999999999')}
          activeOpacity={0.8}
        >
          <View style={[styles.infoIcon, { backgroundColor: '#0066CC' }]}>
            <Phone size={24} color="#FFFFFF" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Teléfono</Text>
            <Text style={styles.infoValue}>999 999 999</Text>
          </View>
        </TouchableOpacity>

        {/* Correo */}
        <TouchableOpacity
          style={styles.infoCard}
          onPress={() => handleEmail('mesadepartes.risgch@redsaludgranchimu.pe')}
          activeOpacity={0.8}
        >
          <View style={[styles.infoIcon, { backgroundColor: '#00A8E8' }]}>
            <Mail size={24} color="#FFFFFF" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Correo Electrónico</Text>
            <Text style={styles.infoValue}>mesadepartes.risgch@redsaludgranchimu.pe</Text>
          </View>
        </TouchableOpacity>

        {/* Dirección */}
        <TouchableOpacity
          style={styles.infoCard}
          onPress={handleMap}
          activeOpacity={0.8}
        >
          <View style={[styles.infoIcon, { backgroundColor: '#0066CC' }]}>
            <MapPin size={24} color="#FFFFFF" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Dirección</Text>
            <Text style={styles.infoValue}>
              Jr. Unión 651, Cascas 13781, La Libertad
            </Text>
          </View>
        </TouchableOpacity>

        {/* Horario */}
        <View style={styles.infoCard}>
          <View style={[styles.infoIcon, { backgroundColor: '#00A8E8' }]}>
            <Clock size={24} color="#FFFFFF" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Horario de Atención</Text>
            <Text style={styles.infoValue}>
              Lunes a Viernes: 7:30 AM - 4:30 PM
            </Text>
          </View>
        </View>

        {/* Redes sociales */}
        <Text style={styles.sectionTitle}>Síguenos en Redes Sociales</Text>
        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
          onPress={handleFacebook}
          activeOpacity={0.8}
        >
          <Facebook size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0066CC',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
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
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    padding: 24,
    paddingTop: 24,
    marginTop: 247,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
  },
  emergencyCard: {
    backgroundColor: '#DC2626',
    borderRadius: 20,
    padding: 28,
    marginVertical: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  emergencyContent: {
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emergencyNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emergencySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
  },
  socialButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomSpacing: {
    height: 20,
  },
});