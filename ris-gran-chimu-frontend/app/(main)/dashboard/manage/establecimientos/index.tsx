// app/(main)/dashboard/manage/establecimientos/index.tsx
import { useAuth } from '@/src/hooks/useAuth';
import apiClient from '@/src/services/apiClient';
import {
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Servicio = {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
};

type Establecimiento = {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  map_link: string;
  creado_por: number;
  fecha_creacion: string;
  actualizado_por: number | null;
  fecha_actualizacion: string | null;
  creado_por_nombre: string;
  actualizado_por_nombre?: string;
  activo: boolean; // 0 o 1 en DB, pero axios podría traerlo como number o bool. asumiremos bool o number que se puede evaluar.
};

const ITEMS_PER_PAGE = 10;

export default function EstablecimientosScreen() {
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState<Establecimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Establecimiento | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    map_link: '',
    activo: true,
  });

  // Para servicios
  const [allServices, setAllServices] = useState<Servicio[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  const [reauthVisible, setReauthVisible] = useState(false);
  const [reauthAction, setReauthAction] = useState<'create' | 'delete' | null>(null);
  const [reauthTargetId, setReauthTargetId] = useState<number | null>(null);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [reauthPasswordVisible, setReauthPasswordVisible] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await apiClient.get<Establecimiento[]>('/establecimientos');
      setItems(res.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los establecimientos.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      nombre: '',
      direccion: '',
      telefono: '',
      map_link: '',
      activo: true,
    });
    setSelectedServiceIds([]);
    setEditing(null);
  };

  const openCreateModal = async () => {
    resetForm();
    await loadAllServices();
    setModalVisible(true);
  };

  const openEditModal = async (item: Establecimiento) => {
    setEditing(item);
    setForm({
      nombre: item.nombre,
      direccion: item.direccion,
      telefono: item.telefono,
      map_link: item.map_link,
      activo: Boolean(item.activo), // Asegurar booleano
    });

    try {
      await loadAllServices(item.id);
      setModalVisible(true); // Abrir modal SOLO si todo salió bien
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los servicios. No se puede editar.');
      console.error('Error en openEditModal:', error);
    }
  };

  const loadAllServices = async (establecimientoId?: number) => {
    try {
      setServicesLoading(true);
      const res = await apiClient.get<Servicio[]>(`/servicios`);
      setAllServices(res.data.filter(s => s.activo));

      if (establecimientoId) {
        const asignadosRes = await apiClient.get<number[]>(`/establecimientos/${establecimientoId}/servicios`);
        setSelectedServiceIds(asignadosRes.data);
      } else {
        setSelectedServiceIds([]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los servicios.');
    } finally {
      setServicesLoading(false);
    }
  };

  const toggleService = (id: number) => {
    setSelectedServiceIds(prev =>
      prev.includes(id)
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    );
  };

  const saveItem = async () => {
    if (!form.nombre || !form.direccion || !form.telefono || !form.map_link) {
      Alert.alert('Campos requeridos', 'Todos los campos son obligatorios');
      return;
    }

    if (!editing) {
      setReauthAction('create');
      setReauthVisible(true);
      return;
    }

    try {
      await apiClient.put(`/establecimientos/${editing.id}`, form);
      await apiClient.put(`/establecimientos/${editing.id}/servicios`, {
        servicios_ids: selectedServiceIds,
      });

      setItems(prev => prev.map(e => e.id === editing.id ? { ...e, ...form } : e));
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar');
    }
  };

  const saveAfterReauth = async () => {
    try {
      const res = await apiClient.post<Establecimiento>('/establecimientos', form);
      await apiClient.put(`/establecimientos/${res.data.id}/servicios`, {
        servicios_ids: selectedServiceIds,
      });
      setItems(prev => [{ ...res.data }, ...prev]);
      setModalVisible(false);
      resetForm();
      setReauthPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear');
    }
  };

  const confirmDeleteAfterReauth = async (id: number) => {
    try {
      await apiClient.delete(`/establecimientos/${id}`);
      setItems(prev => prev.filter(e => e.id !== id));
      setReauthPassword('');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo eliminar');
    }
  };

  const verifyCurrentUserPassword = async (password: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ valid: boolean }>('/auth/verify', { password });
      return response.data.valid === true;
    } catch (error) {
      console.error('Error al verificar contraseña:', error);
      return false;
    }
  };

  const onConfirmReauth = async () => {
    setReauthError(null);
    if (!reauthPassword) {
      setReauthError('Ingresa tu contraseña para confirmar');
      return;
    }
    const ok = await verifyCurrentUserPassword(reauthPassword);
    if (!ok) {
      setReauthError('La contraseña ingresada es incorrecta.');
      return;
    }

    if (reauthAction === 'create') {
      setReauthVisible(false);
      setTimeout(saveAfterReauth, 100);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Cargando establecimientos...</Text>
      </View>
    );
  }

  const filtered = items.filter(e => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      e.nombre.toLowerCase().includes(query) ||
      e.direccion.toLowerCase().includes(query) ||
      e.telefono.includes(query)
    );
  });

  const displayed = filtered.slice(0, visibleCount);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Establecimientos</Text>

      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.flexButton} onPress={openCreateModal}>
          <Pencil color="#fff" size={18} />
          <Text style={styles.flexButtonText}>Nuevo Establecimiento</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.flexButtonAlt} onPress={loadItems}>
          <RefreshCw color="#007AFF" size={18} />
          <Text style={styles.flexButtonTextAlt}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <EstablecimientoRow item={item} onEdit={openEditModal} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {filtered.length > visibleCount && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={() => setVisibleCount(v => v + ITEMS_PER_PAGE)}
        >
          <Text style={styles.loadMoreText}>Ver más ({filtered.length - visibleCount} restantes)</Text>
        </TouchableOpacity>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.modalContentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? 'Editar Establecimiento' : 'Nuevo Establecimiento'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#007AFF" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={form.nombre}
                onChangeText={(text) => setForm({ ...form, nombre: text })}
                placeholder="Nombre del establecimiento"
              />

              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={styles.input}
                value={form.direccion}
                onChangeText={(text) => setForm({ ...form, direccion: text })}
                placeholder="Dirección completa"
              />

              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={form.telefono}
                onChangeText={(text) => setForm({ ...form, telefono: text })}
                placeholder="+51 ..."
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Link de Google Maps</Text>
              <TextInput
                style={styles.input}
                value={form.map_link}
                onChangeText={(text) => setForm({ ...form, map_link: text })}
                placeholder="https://goo.gl/maps/..."
                autoCapitalize="none"
              />

              <Text style={styles.label}>Servicios ofrecidos</Text>
              {servicesLoading ? (
                <Text>Cargando servicios...</Text>
              ) : (
                <View style={styles.servicesGrid}>
                  {allServices.map((servicio) => (
                    <TouchableOpacity
                      key={servicio.id}
                      style={[
                        styles.serviceChip,
                        selectedServiceIds.includes(servicio.id) && styles.serviceChipSelected,
                      ]}
                      onPress={() => toggleService(servicio.id)}
                    >
                      <Text
                        style={[
                          styles.serviceChipText,
                          selectedServiceIds.includes(servicio.id) && styles.serviceChipTextSelected,
                        ]}
                      >
                        {servicio.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Estado</Text>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>{form.activo ? 'Activo' : 'Inactivo'}</Text>
                <TouchableOpacity
                  style={[styles.toggleSwitch, form.activo && styles.toggleSwitchOn]}
                  onPress={() => setForm({ ...form, activo: !form.activo })}
                >
                  <View style={[styles.switchThumb, form.activo && styles.switchThumbOn]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveItem}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reautenticación */}
      <Modal visible={reauthVisible} animationType="fade" transparent={true}>
        <View style={styles.reauthOverlay}>
          <View style={styles.reauthCard}>
            <Text style={styles.reauthTitle}>Confirma tu contraseña</Text>
            <Text style={styles.reauthMessage}>
              Por seguridad, ingresa tu contraseña para confirmar esta acción.
            </Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.inputNoBorder}
                placeholder="Tu contraseña"
                secureTextEntry={!reauthPasswordVisible}
                value={reauthPassword}
                onChangeText={setReauthPassword}
              />
              <TouchableOpacity
                style={styles.eyeButtonInInput}
                onPress={() => setReauthPasswordVisible(!reauthPasswordVisible)}
              >
                {reauthPasswordVisible ? (
                  <Pencil color="#007AFF" size={18} />
                ) : (
                  <Pencil color="#6c757d" size={18} />
                )}
              </TouchableOpacity>
            </View>
            {reauthError ? <Text style={styles.errorText}>{reauthError}</Text> : null}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setReauthVisible(false);
                  setReauthPassword('');
                  setReauthError(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={onConfirmReauth}>
                <Text style={styles.saveButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PreviewCard({ nombre, direccion, servicios }: { nombre: string; direccion: string; servicios: Servicio[] }) {
  return (
    <View style={styles.previewCard}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapTitle}>{nombre || 'Nuevo establecimiento'}</Text>
        <Text style={styles.mapAddress} numberOfLines={2}>{direccion || 'Dirección no especificada'}</Text>

        {servicios.length > 0 && (
          <View style={styles.badgesContainer}>
            {servicios.slice(0, 3).map((servicio) => (
              <View key={servicio.id} style={styles.badge}>
                <Text style={styles.badgeText}>{servicio.nombre}</Text>
              </View>
            ))}
            {servicios.length > 3 && (
              <View style={styles.badgeMore}>
                <Text style={styles.badgeMoreText}>+{servicios.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </View>
      <View style={styles.mapButtonDisabled}>
        <Text style={styles.mapButtonText}>📍 Ver ubicación en Google Maps</Text>
      </View>
    </View>
  );
}

function EstablecimientoRow({ item, onEdit }: { item: Establecimiento; onEdit: (n: Establecimiento) => void }) {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' - ' +
      date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <View style={styles.userCard}>
      <View style={styles.headerRow}>
        <Text style={styles.userName}>#{item.id} - {item.nombre}</Text>
        <View style={[styles.roleBadge, { backgroundColor: item.activo ? '#34C759' : '#FF3B30' }]}>
           <Text style={styles.roleText}>{item.activo ? 'ACTIVO' : 'INACTIVO'}</Text>
        </View>
      </View>
      <Text style={styles.smallText}>{item.direccion}</Text>
      <Text style={styles.smallText}>📞 {item.telefono}</Text>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Fecha:</Text>
          <Text style={styles.value}>{formatDate(item.fecha_creacion)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Creado:</Text>
          <Text style={styles.value}>{formatDateTime(item.fecha_creacion)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Por:</Text>
          <Text style={styles.value}>{item.creado_por_nombre}</Text>
        </View>
        {item.fecha_actualizacion && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Editado:</Text>
              <Text style={styles.value}>{formatDateTime(item.fecha_actualizacion)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Por:</Text>
              <Text style={styles.value}>{item.actualizado_por_nombre}</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(item)}>
          <Pencil color="#fff" size={16} />
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 32,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  flexButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  flexButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  flexButtonAlt: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  flexButtonTextAlt: {
    color: '#007AFF',
    fontWeight: '500',
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
    color: '#333',
  },
  userCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    flex: 1,
  },
  smallText: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 4,
  },
  detailsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '600',
    width: 100,
  },
  value: {
    fontSize: 13,
    color: '#495057',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContentContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  serviceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
  },
  serviceChipSelected: {
    backgroundColor: '#007AFF',
  },
  serviceChipText: {
    fontSize: 14,
    color: '#495057',
  },
  serviceChipTextSelected: {
    color: '#fff',
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003366',
    marginTop: 16,
    marginBottom: 8,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 8,
  },
  mapPlaceholder: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
  },
  mapAddress: {
    fontSize: 14,
    color: '#495057',
    marginTop: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  badgeMore: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#6c757d',
  },
  badgeMoreText: {
    color: '#fff',
    fontSize: 12,
  },
  mapButtonDisabled: {
    backgroundColor: '#ccc',
    padding: 12,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  eyeButtonInInput: {
    padding: 8,
    marginLeft: 0,
  },
  inputNoBorder: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    borderWidth: 0,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  reauthOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  reauthCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  reauthTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  reauthMessage: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
  },
  loadMoreButton: {
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  loadMoreText: {
    color: '#333',
    fontWeight: '500',
  },
  form: {
    gap: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
    minWidth: 80,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    padding: 2,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  toggleSwitchOn: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  roleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});