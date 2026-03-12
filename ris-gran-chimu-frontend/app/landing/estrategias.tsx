// app/landing/estrategias/index.tsx
import apiClient from '@/src/services/apiClient';
import {
  BloodBag,
  Fetus,
  HeartCardiogram,
  Medicines,
  MentalDisorders,
  Microscope,
  Nurse,
  Stethoscope,
  UrineSample,
  VirusShield,
} from 'healthicons-react-native';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Heart,
  Stethoscope as LucideStethoscope,
  PackageCheck,
  Shield,
  Target,
  Users,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Estrategia = {
  id?: number;
  titulo: string;
  descripcion: string;
};

type Servicio = {
  nombre: string;
  descripcion: string;
};

export default function StrategiesScreen() {
  const [estrategias, setEstrategias] = useState<Estrategia[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para expansión de estrategias (solo estrategias)
  const [expandedEstrategias, setExpandedEstrategias] = useState<number[]>([]);

  useEffect(() => {
    loadEstrategias();
    loadServicios();
  }, []);

  const loadEstrategias = async () => {
    try {
      const res = await apiClient.get<Estrategia[]>('/public/estrategias');
      setEstrategias(res.data);
    } catch (error) {
      console.error('Error cargando estrategias:', error);
    }
  };

  const loadServicios = async () => {
    try {
      const res = await apiClient.get<Servicio[]>('/public/servicios');
      setServicios(res.data);
    } catch (error) {
      console.error('Error cargando servicios:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandEstrategia = (index: number) => {
    setExpandedEstrategias((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Íconos estrategias
  const getIconForStrategy = (titulo: string) => {
    const lower = titulo.toLowerCase();
    if (lower.includes('atención') && lower.includes('primaria')) return LucideStethoscope;
    if (lower.includes('promoción') || lower.includes('prevención')) return Shield;
    if (lower.includes('especializada')) return Heart;
    if (lower.includes('comunitaria') || lower.includes('participación')) return Users;
    if (lower.includes('medicina preventiva') || lower.includes('vacunación')) return Activity;
    if (lower.includes('gestión') || lower.includes('recursos')) return PackageCheck;
    return Target;
  };

  // Paleta estrategias
  const strategyPalette = [
    { primary: '#2E7D32', secondary: '#E8F5E9', border: '#B4E0B7' }, // Verde
    { primary: '#0066CC', secondary: '#E0F2FE', border: '#B2DDF7' }, // Azul
    { primary: '#EF6C00', secondary: '#FFF3E0', border: '#F7C99E' }, // Naranja
    { primary: '#7B1FA2', secondary: '#F3E5F5', border: '#D1A9E1' }, // Morado
    { primary: '#D32F2F', secondary: '#FDECEC', border: '#F5B5B5' }, // Rojo
    { primary: '#F9A825', secondary: '#FFF8E1', border: '#FFE59C' }, // Amarillo
  ];
  const getStrategyColor = (index: number) => strategyPalette[index % strategyPalette.length];


  // Paleta servicios
  const servicePalette = [
    { primary: '#EF6C00', secondary: '#FFF3E0', border: '#F7C99E' }, // Naranja
    { primary: '#0066CC', secondary: '#E0F2FE', border: '#B2DDF7' }, // Azul
    { primary: '#D32F2F', secondary: '#FDECEC', border: '#F5B5B5' }, // Rojo
    { primary: '#F9A825', secondary: '#FFF8E1', border: '#FFE59C' }, // Amarillo
    { primary: '#2E7D32', secondary: '#E8F5E9', border: '#B4E0B7' }, // Verde
    { primary: '#7B1FA2', secondary: '#F3E5F5', border: '#D1A9E1' }, // Morado
  ];
  const getServiceColor = (index: number) => servicePalette[index % servicePalette.length];

  // Íconos servicios
  const getIconForService = (nombre: string, color: string) => {
    const lowerName = nombre.toLowerCase();
    if (lowerName.includes('sangre') || lowerName.includes('transfusión'))
      return <BloodBag color={color} width={40} height={40} />;
    if (lowerName.includes('consulta') || lowerName.includes('general'))
      return <Stethoscope color={color} width={40} height={40} />;
    if (lowerName.includes('farmacia') || lowerName.includes('medicamento'))
      return <Medicines color={color} width={40} height={40} />;
    if (lowerName.includes('laboratorio') || lowerName.includes('análisis'))
      return <Microscope color={color} width={40} height={40} />;
    if (lowerName.includes('enfermería') || lowerName.includes('curaciones'))
      return <Nurse color={color} width={40} height={40} />;
    if (lowerName.includes('cardiología') || lowerName.includes('corazón'))
      return <HeartCardiogram color={color} width={40} height={40} />;
    if (lowerName.includes('vacuna') || lowerName.includes('inmunización'))
      return <VirusShield color={color} width={40} height={40} />;
    if (lowerName.includes('psiquiatría') || lowerName.includes('mental'))
      return <MentalDisorders color={color} width={40} height={40} />;
    if (lowerName.includes('prenatal') || lowerName.includes('gestación'))
      return <Fetus color={color} width={40} height={40} />;
    if (lowerName.includes('diálisis') || lowerName.includes('orina'))
      return <UrineSample color={color} width={40} height={40} />;
    return <Shield color={color} width={40} height={40} />;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Target size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Estrategias de Salud</Text>
          <Text style={styles.subtitle}>Nuestro compromiso con la salud del pueblo</Text>
        </View>
        <View style={styles.centered}>
          <Text>Cargando contenido...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Fijo */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Target size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Estrategias de Salud</Text>
        <Text style={styles.subtitle}>Nuestro compromiso con la salud del pueblo</Text>
      </View>

      {/* ScrollView con contenido */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

      {/* Estrategias */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nuestras Estrategias</Text>
        {estrategias.length > 0 ? (
          estrategias.map((estrategia, index) => {
            const Icon = getIconForStrategy(estrategia.titulo);
            const color = getStrategyColor(index).primary;
            const isExpanded = expandedEstrategias.includes(index);

            return (
              <View key={estrategia.id ?? index} style={styles.card}>
                <View style={[styles.cardIcon, { backgroundColor: color }]}>
                  <Icon size={32} color="#FFFFFF" />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>{estrategia.titulo}</Text>
                    <TouchableOpacity onPress={() => toggleExpandEstrategia(index)}>
                      {isExpanded ? <ChevronUp size={20} color="#4B5563" /> : <ChevronDown size={20} color="#4B5563" />}
                    </TouchableOpacity>
                  </View>

                  {isExpanded ? (
                    <Text style={styles.cardDescription}>{estrategia.descripcion}</Text>
                  ) : (
                    <Text style={styles.cardDescription} numberOfLines={3}>
                      {estrategia.descripcion}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.noDataText}>No hay estrategias disponibles.</Text>
        )}
      </View>

      {/* Servicios */}
      <View style={styles.section2}>
        <Text style={styles.sectionTitle}>Nuestros Servicios</Text>
        {servicios.length > 0 ? (
          <View style={styles.gridContainer}>
            {servicios.map((servicio, index) => {
              const colors = getServiceColor(index);
              return (
                <View
                  key={index}
                  style={styles.serviceCard}
                >
                  <View style={styles.serviceIcon}>
                    {getIconForService(servicio.nombre, colors.primary)}
                  </View>
                  <Text style={[styles.serviceTitle, { color: '#1F2937' }]}>{servicio.nombre}</Text>
                  <Text style={styles.serviceDescriptionFull}>{servicio.descripcion}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noDataText}>No hay servicios disponibles.</Text>
        )}
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.95)', textAlign: 'center', lineHeight: 22 },
  section: { paddingHorizontal: 24, paddingTop: 40, marginTop: 232 },
  section2: { paddingHorizontal: 24, marginTop: 25},
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 0,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  cardDescription: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginTop: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  serviceCard: {
    width: '48%',
    borderWidth: 0.3,
    borderColor: 'gray',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIcon: { marginBottom: 12 },
  serviceTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  serviceDescriptionFull: { fontSize: 13, color: '#4B5563', textAlign: 'center', lineHeight: 18, marginTop: 4 },
  noDataText: { fontSize: 15, color: '#6B7280', fontStyle: 'italic', textAlign: 'center', marginVertical: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomSpacing: { height: 20 },
});
