// app/landing/establecimientos.tsx
import apiClient from '@/src/services/apiClient';
import * as Linking from 'expo-linking';
import { Building2, Clock, MapPin, Phone } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Servicio = {
  id: number;
  nombre: string;
  descripcion: string;
};

type Establecimiento = {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  map_link: string;
  servicios: Servicio[];
};

export default function EstablishmentsScreen() {
  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEstablecimientos();
  }, []);

  const loadEstablecimientos = async () => {
    try {
      const res = await apiClient.get('/public/establecimientos');
      // Limpia los enlaces (elimina espacios extra)
      const cleanedData = (res.data as Establecimiento[]).map((est: Establecimiento) => ({
        ...est,
        map_link: est.map_link?.trim(),
      }));
      setEstablecimientos(cleanedData);
    } catch (error) {
      console.error('Error cargando establecimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const openMapLink = (url: string | null | undefined) => {
    if (!url) return;
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    // Asegura que tenga protocolo
    const formattedUrl = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`;

    Linking.openURL(formattedUrl).catch((err) =>
      console.error('No se pudo abrir el enlace del mapa:', err)
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Fijo */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Building2 size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Establecimientos</Text>
        <Text style={styles.subtitle}>
          Red de centros de salud y hospitales a tu servicio
        </Text>
      </View>

      {/* ScrollView con contenido */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Lista de establecimientos */}
        <View style={styles.content}>
        {establecimientos.map((est) => (
          <View key={est.id} style={styles.card}>
            {/* Cabecera: Nombre e ícono de ubicación */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardName} numberOfLines={2}>
                {est.nombre}
              </Text>
              <TouchableOpacity
                style={styles.locationIconContainer}
                onPress={() => openMapLink(est.map_link)}
                activeOpacity={0.7}
              >
                <MapPin size={30} color="#0066CC" />
              </TouchableOpacity>
            </View>

            {/* Información detallada */}
            <View style={styles.cardInfo}>
              <View style={styles.infoRow}>
                <MapPin size={18} color="#1F2937" />
                <Text style={styles.infoText} numberOfLines={2}>
                  {est.direccion}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Phone size={18} color="#1F2937" />
                <Text style={styles.infoText}>{est.telefono}</Text>
              </View>

              <View style={styles.infoRow}>
                <Clock size={18} color="#1F2937" />
                <Text style={styles.infoText}>Atención continua</Text>
              </View>
            </View>

            {/* Badges de servicios - todos visibles */}
            {est.servicios.length > 0 && (
              <View style={styles.servicesContainer}>
                {est.servicios.map((servicio) => (
                  <View key={servicio.id} style={styles.serviceBadge}>
                    <Text style={styles.serviceBadgeText} numberOfLines={1}>
                      {servicio.nombre}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {!loading && establecimientos.length === 0 && (
          <Text style={styles.noDataText}>No hay establecimientos disponibles.</Text>
        )}
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
    marginTop: 248,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 10,
  },
  locationIconContainer: {
    padding: 6,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B2DDF7',
  },
  cardType: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
    marginBottom: 16,
  },
  cardInfo: {
    gap: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B2DDF7',
  },
  serviceBadgeText: {
    fontSize: 11,
    color: '#0066CC',
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 15,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});