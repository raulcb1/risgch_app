// app/(main)/dashboard/manage/servicios/index.tsx
import { useAuth } from '@/src/hooks/useAuth';
import apiClient from '@/src/services/apiClient';
import { Pencil, RefreshCw, X } from 'lucide-react-native';
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

// Íconos de healthicons-react-native
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

type Servicio = {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  creado_por: number;
  fecha_creacion: string;
  actualizado_por: number | null;
  fecha_actualizacion: string | null;
  creado_por_nombre: string;
  actualizado_por_nombre?: string;
};

const ITEMS_PER_PAGE = 10;

// Mapeo de nombres de servicios a íconos
function getServiceIcon(nombre: string) {
  const lowerName = nombre.toLowerCase();

  if (lowerName.includes('sangre') || lowerName.includes('transfusión')) return <BloodBag color="#fff" width="30em" height="30em" />;
  if (lowerName.includes('consulta') || lowerName.includes('general')) return <Stethoscope color="#fff" width="30em" height="30em" />;
  if (lowerName.includes('farmacia') || lowerName.includes('medicamento')) return <Medicines color="#fff" width="30em" height="30em" />;
  if (lowerName.includes('laboratorio') || lowerName.includes('análisis')) return <Microscope color="#fff" width="30em" height="30em" />;
  if (lowerName.includes('enfermería') || lowerName.includes('curaciones')) return <Nurse color="#fff" width="30em" height="30em" />;
  if (lowerName.includes('cardiología') || lowerName.includes('corazón')) return <HeartCardiogram color="#fff" width="30em" height="30em" />;
  if (lowerName.includes('vacuna') || lowerName.includes('inmunización')) return <VirusShield color="#fff" width="30em" height="30em" />;
  if (lowerName.includes('psiquiatría') || lowerName.includes('mental')) return <MentalDisorders color="#fff" width="30em" height="30em" />;
  if (lowerName.includes('prenatal') || lowerName.includes('gestación')) return <Fetus color="#fff" width="30em" height="30em" />;
  if (lowerName.includes('diálisis') || lowerName.includes('orina')) return <UrineSample color="#fff" width="30em" height="30em" />;


  return <Stethoscope color="#fff" width="30em" height="30em" />;
}

export default function ServiciosScreen() {
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Servicio | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    activo: true,
  });

  const [reauthVisible, setReauthVisible] = useState(false);
  const [reauthAction, setReauthAction] = useState<'create' | 'deactivate' | null>(null);
  const [reauthTargetId, setReauthTargetId] = useState<number | null>(null);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [reauthPasswordVisible, setReauthPasswordVisible] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await apiClient.get<Servicio[]>('/servicios');
      setItems(res.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los servicios.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      nombre: '',
      descripcion: '',
      activo: true,
    });
    setEditing(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (item: Servicio) => {
    setEditing(item);
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion,
      activo: item.activo,
    });
    setModalVisible(true);
  };

  const saveItem = async () => {
    if (!form.nombre || !form.descripcion) {
      Alert.alert('Campos requeridos', 'Nombre y descripción son obligatorios');
      return;
    }

    if (!editing) {
      setReauthAction('create');
      setReauthVisible(true);
      return;
    }

    try {
      const res = await apiClient.put<Servicio>(`/servicios/${editing.id}`, form);
      setItems(prev => prev.map(e => e.id === res.data.id ? res.data : e));
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar');
    }
  };

  const saveAfterReauth = async () => {
    try {
      const res = await apiClient.post<Servicio>('/servicios', form);
      setItems(prev => [{ ...res.data }, ...prev]);
      setModalVisible(false);
      resetForm();
      setReauthPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear');
    }
  };

  const deactivateService = async (id: number) => {
    try {
      await apiClient.put(`/servicios/${id}`, { activo: false });
      setItems(prev => prev.map(s => s.id === id ? { ...s, activo: false } : s));
      setReauthPassword('');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo desactivar el servicio');
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
    } else if (reauthAction === 'deactivate' && reauthTargetId != null) {
      setReauthVisible(false);
      setTimeout(() => deactivateService(reauthTargetId), 100);
    }
  };

  const toggleActive = (id: number, name: string) => {
    setReauthAction('deactivate');
    setReauthTargetId(id);
    setReauthVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Cargando servicios...</Text>
      </View>
    );
  }

  const filtered = items.filter(s => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      s.nombre.toLowerCase().includes(query) ||
      s.descripcion.toLowerCase().includes(query)
    );
  });

  const displayed = filtered.slice(0, visibleCount);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Servicios</Text>

      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.flexButton} onPress={openCreateModal}>
          <Pencil color="#fff" size={18} />
          <Text style={styles.flexButtonText}>Nuevo Servicio</Text>
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
          <ServicioRow item={item} onToggle={toggleActive} onEdit={openEditModal} />
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
              <Text style={styles.modalTitle}>{editing ? 'Editar Servicio' : 'Nuevo Servicio'}</Text>
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
                placeholder="Nombre del servicio"
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, { height: 120 }]}
                value={form.descripcion}
                onChangeText={(text) => setForm({ ...form, descripcion: text })}
                placeholder="Descripción detallada"
                multiline
              />

              <Text style={styles.label}>Estado</Text>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>{form.activo ? 'Activo' : 'Inactivo'}</Text>
                <TouchableOpacity
                  style={[styles.toggleSwitch, form.activo && styles.toggleSwitchOn]}
                  onPress={() => setForm({ ...form, activo: !form.activo })}
                >
                  <View style={styles.toggleThumb} />
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

function ServicioRow({ item, onEdit, onToggle }: { item: Servicio; onEdit: (n: Servicio) => void; onToggle: (id: number, name: string) => void }) {
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
        <View style={styles.iconContainer}>
          {getServiceIcon(item.nombre)}
        </View>
        <Text style={styles.userName}>{item.nombre}</Text>
        <View style={[styles.roleBadge, { backgroundColor: item.activo ? '#34C759' : '#FF3B30' }]}>
           <Text style={styles.roleText}>{item.activo ? 'ACTIVO' : 'INACTIVO'}</Text>
        </View>
      </View>
      <Text style={styles.smallText} numberOfLines={2}>{item.descripcion}</Text>

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
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  disabledButton: {
    backgroundColor: '#ccc',
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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#495057',
  },
  toggleSwitch: {
    width: 50,
    height: 24,
    backgroundColor: '#ccc',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchOn: {
    backgroundColor: '#34C759',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
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