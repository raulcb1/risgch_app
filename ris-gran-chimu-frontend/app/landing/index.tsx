// app/landing/index.tsx
import apiClient from '@/src/services/apiClient';
import * as Linking from 'expo-linking';
import { useFocusEffect, useRouter } from 'expo-router';
import { ExternalLink, Shield } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Noticia = {
  id?: number;
  titulo: string;
  descripcion: string;
  imagen_url?: string | null;
  fecha: string;
  link_facebook?: string | null;
};

// Preguntas frecuentes
const faqs = [
  {
    id: 1,
    pregunta: '¿Qué hacer si no puedo acceder a mi Carnet de Vacunación?',
    respuesta:
      'Primero verificar si ha obtenido un nuevo Documento de Identidad y colocar la nueva fecha de emisión. Si no soluciona con esta opción, debe enviar un mensaje al correo soporte_aplicativos@minsa.gob.pe adjuntando captura de pantalla donde se visualicen sus datos al intentar acceder, foto de DNI ambos lados y alguna otra evidencia de sus vacunas.',
  },
  {
    id: 2,
    pregunta: '¿Dónde está ubicada la nueva oficina de la Unidad de Aseguramiento?',
    respuesta:
      'Está ubicada en Jr. Unión 651 - 1° Piso (Responsable la Lic. Alexandra Camacho).',
  },
  {
    id: 3,
    pregunta: '¿Qué necesito para poder atenderme en un establecimiento del Minsa?',
    respuesta:
      'Necesitas tu documento de identificación, como DNI u otro documento oficial que te identifique.',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(150)).current;

  useEffect(() => {
    loadNoticias();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Restablecer el scroll para ocultar el botón admin al volver a la pantalla
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ x: 0, y: 150, animated: true });
        }
      }, 100);

      return () => clearTimeout(timer);
    }, [])
  );

  const loadNoticias = async () => {
    try {
      // Forzamos que no se envíe el Authorization header para evitar 401 si hay un token viejo
      const res = await apiClient.get<Noticia[]>('/public/noticias', {
        headers: { Authorization: undefined }
      });
      setNoticias(res.data);
    } catch (error) {
      console.error('Error cargando noticias públicas:', error);
    } finally {
      setLoading(false);
    }
  };

  const openFacebookLink = (url: string | undefined | null) => {
    if (!url) return;
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    const formattedUrl = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`;
    Linking.openURL(formattedUrl).catch((err) =>
      console.error('No se pudo abrir el enlace:', err)
    );
  };

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  // Render item del carrusel
  const renderNoticiaItem = ({ item }: { item: Noticia }) => (
    <View style={styles.carouselCard}>
      {item.imagen_url ? (
        <Image source={{ uri: item.imagen_url }} style={styles.carouselCardImage} />
      ) : (
        <View style={styles.carouselImagePlaceholder}>
          <Text style={styles.carouselPlaceholderText}>Sin imagen</Text>
        </View>
      )}

      <View style={styles.carouselCardContent}>
        <Text style={styles.carouselCardTitle} numberOfLines={2}>
          {item.titulo}
        </Text>

        <Text style={styles.carouselCardDescription} numberOfLines={2}>
          {item.descripcion}
        </Text>

        <Text style={styles.carouselCardDate}>
          {new Date(item.fecha).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </Text>

        {item.link_facebook && (
          <TouchableOpacity
            style={styles.carouselFacebookButton}
            onPress={() => openFacebookLink(item.link_facebook)}
            activeOpacity={0.7}
          >
            <ExternalLink size={14} color="#1877F2" />
            <Text style={styles.carouselFacebookButtonText}>Ver en Facebook</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentOffset={{ x: 0, y: 150 }}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
    >
      {/* Header */}
      <View style={styles.header}>
        {/* Botón Admin Oculto con Seguridad (Opacidad y Escala dinámicas) */}
        <Animated.View
          style={{
            height: 150,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10,
            opacity: scrollY.interpolate({
              inputRange: [-50, 0, 100],
              outputRange: [1, 1, 0],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                scale: scrollY.interpolate({
                  inputRange: [-50, 0, 100],
                  outputRange: [1.1, 1, 0.5],
                  extrapolate: 'clamp',
                }),
              },
              {
                translateY: scrollY.interpolate({
                  inputRange: [-50, 0, 150],
                  outputRange: [0, 0, 50],
                  extrapolate: 'clamp',
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => router.push('/(auth)/login-admin')}
            activeOpacity={0.8}
          >
            <Shield size={20} color="#FFFFFF" />
            <Text style={styles.adminButtonText}>Acceso Administradores</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Espaciador para la barra de estado (Status Bar) */}
        <View style={{ height: 60 }} />

        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/gran_chimu_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Red Integrada de Salud</Text>
        <Text style={styles.subtitle}>Gran Chimú</Text>
        <Text style={styles.span}>"Año de la recuperación y consolidación de la economía peruana"</Text>
      </View>

      {/* Carrusel de Noticias */}
      <View style={styles.carouselSection}>
        <Text style={styles.carouselSectionTitle}>Noticias Recientes</Text>

        {loading ? (
          <Text style={styles.loadingText}>Cargando noticias...</Text>
        ) : noticias.length === 0 ? (
          <Text style={styles.noNewsText}>No hay noticias disponibles.</Text>
        ) : (
          <FlatList
            data={noticias}
            renderItem={renderNoticiaItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={CARD_WIDTH + 16}
            snapToAlignment="start"
            decelerationRate="fast"
            keyExtractor={(item) => item.id?.toString() || item.titulo.slice(0, 10)}
          />
        )}
      </View>

      {/* Sección de Preguntas Frecuentes */}
      <View style={styles.faqSection}>
        <Text style={styles.faqTitle}>Preguntas Frecuentes</Text>
        <Text style={styles.faqSubtitle}>Algunas preguntas más frecuentes que nos realizan.</Text>

        {faqs.map((faq) => (
          <View key={faq.id} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqHeader}
              onPress={() => toggleFaq(faq.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.faqQuestion}>{faq.pregunta}</Text>
              <Text style={styles.faqIcon}>{expandedFaq === faq.id ? '−' : '+'}</Text>
            </TouchableOpacity>

            {expandedFaq === faq.id && (
              <View style={styles.faqAnswerContainer}>
                <Text style={styles.faqAnswer}>{faq.respuesta}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.bottomSpacing} />
    </Animated.ScrollView>
  );
}

const CARD_WIDTH = 280;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0066CC',
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 180,
    height: 180,
    margin: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
  span: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#E0E0E0',
    marginBottom: 5,
    textAlign: 'center',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    gap: 8,
    marginTop: 50,
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  carouselSection: {
    padding: 24,
  },
  carouselSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  carouselContent: {
    paddingHorizontal: 8,
  },
  carouselCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    width: CARD_WIDTH,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 10,
  },
  carouselCardImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  carouselImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  carouselPlaceholderText: {
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
  },
  carouselCardContent: {
    padding: 16,
  },
  carouselCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  carouselCardDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  carouselCardDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  carouselFacebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9F5FF',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
    margin: 8,
  },
  carouselFacebookButtonText: {
    color: '#1877F2',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 20,
  },
  noNewsText: {
    fontSize: 15,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },

  // Estilos FAQs
  faqSection: {
    paddingHorizontal: 24,
  },
  faqTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  faqSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0066CC',
    marginRight: 12,
  },
  faqIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  faqAnswerContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});