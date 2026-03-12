// app/external/normas-publicas.tsx
import apiClient from '@/src/services/apiClient';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronLeft, ChevronUp, ExternalLink, FileText, Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

type Norma = {
  id_norma: number;
  anho: number | string;
  nombre_norma: string;
  descripcion: string;
  archivo?: string;
  fecha_norma: string;
};

const ITEMS_PER_PAGE = 15;

export default function NormasPublicasScreen() {
  const router = useRouter();
  const [normas, setNormas] = useState<Norma[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    loadNormas();
  }, []);

  const loadNormas = async () => {
    try {
      const res = await apiClient.get<Norma[]>('/public/normas');
      setNormas(res.data);
    } catch (error) {
      console.error('Error al cargar normas:', error);
      Alert.alert('Error', 'No se pudieron cargar las normas.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredNormas = normas.filter((item) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const keywords = query.split(/\s+/).filter(Boolean);
    const textToSearch = `${item.nombre_norma} ${item.anho} ${item.descripcion}`.toLowerCase();
    return keywords.every((keyword) => textToSearch.includes(keyword));
  });

  const displayedNormas = filteredNormas.slice(0, visibleCount);

  const loadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#003366" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Normas de la Entidad</Text>
          <Text style={styles.subtitle}>Marco normativo y legal del sector salud</Text>
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Search color="#6c757d" size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar norma..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
          autoCapitalize="none"
        />
      </View>

      {/* Lista de normas */}
      <FlatList
        data={displayedNormas}
        keyExtractor={(item) => item.id_norma.toString()}
        renderItem={({ item }) => {
          const isExpanded = expanded[item.id_norma];
          const needsExpansion = item.descripcion.length > 180;

          return (
            <View style={styles.normCard}>
              <View style={styles.normContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={styles.pdfIcon}>
                    <FileText size={28} color="#DC2626" />
                  </View>
                  <View>
                    <Text style={styles.normTitle}>{item.nombre_norma}</Text>
                    <Text style={styles.normDate}>
                      {new Date(item.fecha_norma).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>

                {/* Descripción condicional */}
                {!isExpanded && needsExpansion ? (
                  <Text style={styles.normDescription} numberOfLines={3}>
                    {item.descripcion}
                  </Text>
                ) : (
                  <Text style={styles.normDescription}>{item.descripcion}</Text>
                )}

                {/* Botones: Ver más/ver menos y PDF */}
                {(needsExpansion || item.archivo) && (
                  <View style={styles.buttonsRow}>
                    {needsExpansion && (
                      <TouchableOpacity
                        style={styles.expandButton}
                        onPress={() => toggleExpand(item.id_norma)}
                      >
                        <Text style={styles.expandButtonText}>
                          {isExpanded ? 'Ver menos' : 'Ver más'}
                        </Text>
                        {isExpanded ? (
                          <ChevronUp color="#007AFF" size={16} />
                        ) : (
                          <ChevronDown color="#007AFF" size={16} />
                        )}
                      </TouchableOpacity>
                    )}

                    {item.archivo && (
                      <TouchableOpacity
                        style={styles.pdfButton}
                        onPress={() => {
                          const url = item.archivo;
                          if (!url) return;
                          Linking.canOpenURL(url).then((supported) => {
                            if (supported) {
                              Linking.openURL(url);
                            } else {
                              Alert.alert('Enlace no soportado', 'No se puede abrir el documento.');
                            }
                          });
                        }}
                      >
                        <ExternalLink size={20} color="#6B7280" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Botón "Ver más normas" debajo de la lista */}
      {filteredNormas.length > visibleCount && (
        <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
          <Text style={styles.loadMoreText}>
            Ver {ITEMS_PER_PAGE} normas más ({filteredNormas.length - visibleCount} restantes)
          </Text>
        </TouchableOpacity>
      )}

      {/* Mensaje si no hay resultados */}
      {filteredNormas.length === 0 && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>
            No se encontraron normas que coincidan con tu búsqueda.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0066CC',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  normCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pdfIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  normContent: {
    flex: 1,
  },
  normTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 19,
    maxWidth: '90%',
  },
  normDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  normDescription: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 13,
    paddingBottom: 12,
    paddingTop: 12,
    borderRadius: 8,
    gap: 10,
  },
  expandButtonText: {
    color: '#007AFF',
    fontWeight: '500',
    fontSize: 14,
  },
  pdfButton: {
    width: 44,
    height: 44,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  loadMoreText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noResultsText: {
    color: '#6c757d',
    fontSize: 16,
    textAlign: 'center',
  },
});