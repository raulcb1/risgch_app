// app/(main)/dashboard/manage/noticias/index.tsx
import { useAuth } from '@/src/hooks/useAuth';
import apiClient from '@/src/services/apiClient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Facebook, Pencil, RefreshCw, Trash2, X, Calendar } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
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

type Noticia = {
    id: number;
    titulo: string;
    descripcion: string;
    imagen_url: string;
    link_facebook: string;
    fecha: string;
    creado_por: number;
    fecha_creacion: string;
    actualizado_por: number | null;
    fecha_actualizacion: string | null;
    creado_por_nombre: string;
    actualizado_por_nombre?: string;
};

const ITEMS_PER_PAGE = 6;

export default function NoticiasScreen() {
    const { user: currentUser } = useAuth();
    const [noticias, setNoticias] = useState<Noticia[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
    const [form, setForm] = useState({
        titulo: '',
        descripcion: '',
        imagen_url: '',
        link_facebook: '',
        fecha: new Date().toISOString().split('T')[0],
    });

    const [reauthVisible, setReauthVisible] = useState(false);
    const [descriptionHeight, setDescriptionHeight] = useState(48);
    const [reauthAction, setReauthAction] = useState<'create' | 'delete' | null>(null);
    const [reauthTargetId, setReauthTargetId] = useState<number | null>(null);
    const [reauthPassword, setReauthPassword] = useState('');
    const [reauthError, setReauthError] = useState<string | null>(null);
    const [reauthPasswordVisible, setReauthPasswordVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        loadNoticias();
    }, []);

    const loadNoticias = async () => {
        try {
            const res = await apiClient.get<Noticia[]>('/noticias');
            setNoticias(res.data);
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar las noticias.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            titulo: '',
            descripcion: '',
            imagen_url: '',
            link_facebook: '',
            fecha: new Date().toISOString().split('T')[0],
        });
        setEditingNoticia(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (noticia: Noticia) => {
        setEditingNoticia(noticia);
        setForm({
            titulo: noticia.titulo,
            descripcion: noticia.descripcion,
            imagen_url: noticia.imagen_url,
            link_facebook: noticia.link_facebook,
            fecha: noticia.fecha.split('T')[0], // ✅ Asegura formato YYYY-MM-DD
        });
        setModalVisible(true);
    };

    const saveNoticia = async () => {
        if (!form.titulo || !form.descripcion || !form.link_facebook) {
            Alert.alert('Campos requeridos', 'Todos los campos son obligatorios');
            return;
        }

        if (!editingNoticia) {
            setReauthAction('create');
            setReauthVisible(true);
            return;
        }

        try {
            const res = await apiClient.put<Noticia>(`/noticias/${editingNoticia.id}`, form);
            setNoticias(prev => prev.map(n => n.id === res.data.id ? res.data : n));
            setModalVisible(false);
            resetForm();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar');
        }
    };

    const saveNoticiaAfterReauth = async () => {
        try {
            const res = await apiClient.post<Noticia>('/noticias', form);
            setNoticias(prev => [{ ...res.data }, ...prev]);
            setModalVisible(false);
            resetForm();
            setReauthPassword('');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo crear');
        }
    };

    const confirmDeleteAfterReauth = async (id: number) => {
        try {
            await apiClient.delete(`/noticias/${id}`);
            setNoticias(prev => prev.filter(n => n.id !== id));
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
            setTimeout(saveNoticiaAfterReauth, 100);
        } else if (reauthAction === 'delete' && reauthTargetId != null) {
            setReauthVisible(false);
            setTimeout(() => confirmDeleteAfterReauth(reauthTargetId), 100);
        }
    };

    const deleteUser = (id: number, nombre: string) => {
        setReauthAction('delete');
        setReauthTargetId(id);
        setReauthVisible(true);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <Text>Cargando noticias...</Text>
            </View>
        );
    }

    const filtered = noticias.filter(n => {
        const query = search.toLowerCase().trim();
        if (!query) return true;
        return (
            n.titulo.toLowerCase().includes(query) ||
            n.descripcion.toLowerCase().includes(query)
        );
    });

    const displayed = filtered.slice(0, visibleCount);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gestión de Noticias</Text>

            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.flexButton} onPress={openCreateModal}>
                    <Pencil color="#fff" size={18} />
                    <Text style={styles.flexButtonText}>Nueva Noticia</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.flexButtonAlt} onPress={loadNoticias}>
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
                    <NoticiaRow noticia={item} onDelete={deleteUser} onEdit={openEditModal} />
                )}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />

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
                            <Text style={styles.modalTitle}>{editingNoticia ? 'Editar Noticia' : 'Nueva Noticia'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X color="#007AFF" size={24} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.form}>
                            <Text style={styles.label}>Título</Text>
                            <TextInput
                                style={styles.input}
                                value={form.titulo}
                                onChangeText={(text) => setForm({ ...form, titulo: text })}
                                placeholder="Título de la noticia"
                                multiline
                                onContentSizeChange={(event) => {
                                    const { height } = event.nativeEvent.contentSize;
                                    setDescriptionHeight(height);
                                }}
                            />

                            <Text style={styles.label}>Descripción</Text>
                            <TextInput
                                style={styles.input}
                                value={form.descripcion}
                                onChangeText={(text) => setForm({ ...form, descripcion: text })}
                                placeholder="Descripción breve"
                                multiline
                                onContentSizeChange={(event) => {
                                    const { height } = event.nativeEvent.contentSize;
                                    setDescriptionHeight(height);
                                }}
                            />

                            <Text style={styles.label}>URL de imagen</Text>
                            <TextInput
                                style={styles.input}
                                value={form.imagen_url}
                                onChangeText={(text) => setForm({ ...form, imagen_url: text })}
                                placeholder="https://..."
                                multiline
                                onContentSizeChange={(event) => {
                                    const { height } = event.nativeEvent.contentSize;
                                    setDescriptionHeight(height);
                                }}
                            />

                            <Text style={styles.label}>Link a Facebook</Text>
                            <TextInput
                                style={styles.input}
                                value={form.link_facebook}
                                onChangeText={(text) => setForm({ ...form, link_facebook: text })}
                                placeholder="https://facebook.com/..."
                                multiline
                                onContentSizeChange={(event) => {
                                    const { height } = event.nativeEvent.contentSize;
                                    setDescriptionHeight(height);
                                }}
                            />

                            <Text style={styles.label}>Fecha</Text>
                            <TouchableOpacity
                                style={styles.datePickerButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Calendar color="#495057" size={20} />
                                <Text style={styles.datePickerButtonText}>
                                    {form.fecha || 'Seleccionar fecha'}
                                </Text>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={form.fecha ? new Date(form.fecha + 'T12:00:00') : new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            const formattedDate = selectedDate.toISOString().split('T')[0];
                                            setForm({ ...form, fecha: formattedDate });
                                        }
                                    }}
                                />
                            )}

                            <Text style={styles.previewLabel}>Vista previa:</Text>
                            <PreviewCard {...form} />
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={saveNoticia}>
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

function PreviewCard({ titulo, descripcion, imagen_url, fecha }: any) {
    return (
        <View style={[styles.carouselCard, { width: '100%', marginRight: 0 }]}>
            {imagen_url ? (
                <Image source={{ uri: imagen_url }} style={styles.carouselCardImage} />
            ) : (
                <View style={styles.carouselImagePlaceholder}>
                    <Text style={styles.carouselPlaceholderText}>Sin imagen</Text>
                </View>
            )}

            <View style={styles.carouselCardContent}>
                <Text style={styles.carouselCardTitle} numberOfLines={2}>
                    {titulo || 'Título de la noticia'}
                </Text>

                <Text style={styles.carouselCardDescription} numberOfLines={2}>
                    {descripcion || 'Descripción de la noticia...'}
                </Text>

                <Text style={styles.carouselCardDate}>
                    {new Date(fecha || new Date()).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                    })}
                </Text>

                {/* El botón de Facebook se deshabilita para el modal según requerimiento */}
            </View>
        </View>
    );
}

function NoticiaRow({ noticia, onEdit, onDelete }: { noticia: Noticia; onEdit: (n: Noticia) => void; onDelete: (id: number, name: string) => void }) {
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
                <Text style={styles.userName}>#{noticia.id} - {noticia.titulo}</Text>
            </View>
            <Text style={styles.smallText} numberOfLines={2}>{noticia.descripcion}</Text>

            <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>ID:</Text>
                    <Text style={styles.value}>{noticia.id}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Fecha:</Text>
                    <Text style={styles.value}>{formatDate(noticia.fecha)}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Creado:</Text>
                    <Text style={styles.value}>{formatDateTime(noticia.fecha_creacion)}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Por:</Text>
                    <Text style={styles.value}>{noticia.creado_por_nombre}</Text>
                </View>
                {noticia.fecha_actualizacion && (
                    <>
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Editado:</Text>
                            <Text style={styles.value}>{formatDateTime(noticia.fecha_actualizacion)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Por:</Text>
                            <Text style={styles.value}>{noticia.actualizado_por_nombre}</Text>
                        </View>
                    </>
                )}
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.editButton} onPress={() => onEdit(noticia)}>
                    <Pencil color="#fff" size={16} />
                    <Text style={styles.actionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(noticia.id, noticia.titulo)}>
                    <Trash2 color="#fff" size={16} />
                    <Text style={styles.actionText}>Eliminar</Text>
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
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
        gap: 10,
    },
    datePickerButtonText: {
        fontSize: 16,
        color: '#495057',
    },
    previewLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#003366',
        marginTop: 16,
        marginBottom: 8,
    },
    carouselCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
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
    form: {
        gap: 12,
    }
});