// app/(main)/manage/normas/index.tsx
import { useAuth } from '@/src/hooks/useAuth';
import apiClient from '@/src/services/apiClient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Check, ChevronDown, FileText, Pencil, RefreshCw, X, Calendar } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type NormaTipo = {
    cod_tipo_norma: number;
    nombre: string;
};

type Norma = {
    id_norma: number;
    cod_tipo_norma: number;
    nombre_norma: string;
    descripcion: string;
    fecha_norma: string;
    archivo: string | null;
    activo: 0 | 1;
    fecha_registro: string;
    creado_por: string | number | null;
    fecha_actualizacion: string | null;
    actualizado_por: string | number | null;

    // Campos resueltos (pueden ser null o string)
    tipo_nombre?: string | null;
    creado_por_nombre?: string | null;
    actualizado_por_nombre?: string | null;
};

const ITEMS_PER_PAGE = 15;

export default function NormasScreen() {
    const { user: currentUser } = useAuth();
    const [normas, setNormas] = useState<Norma[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tipos, setTipos] = useState<NormaTipo[]>([]);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const [modalVisible, setModalVisible] = useState(false);
    const [editingNorma, setEditingNorma] = useState<Norma | null>(null);
    const [form, setForm] = useState({
        nombre_norma: '',
        descripcion: '',
        cod_tipo_norma: 0,
        fecha_norma: '',
        archivo: '',
        activo: 1 as 0 | 1,
    });

    const [showTipoDropdown, setShowTipoDropdown] = useState(false);
    const [descriptionHeight, setDescriptionHeight] = useState(48);
    const [nombreHeight, setNombreHeight] = useState(48);
    const [archivoHeight, setArchivoHeight] = useState(48);

    const [reauthVisible, setReauthVisible] = useState(false);
    const [reauthAction, setReauthAction] = useState<'create' | 'delete' | null>(null);
    const [reauthTargetId, setReauthTargetId] = useState<number | null>(null);
    const [reauthPassword, setReauthPassword] = useState('');
    const [reauthError, setReauthError] = useState<string | null>(null);
    const [reauthPasswordVisible, setReauthPasswordVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        loadTipos().then(loadNormas);
    }, []);

    const loadTipos = async () => {
        try {
            const res = await apiClient.get<NormaTipo[]>('/normas/tipos');
            setTipos(res.data);
        } catch (error) {
            console.error('Error cargando tipos de normas:', error);
        }
    };

    const loadNormas = async () => {
        try {
            const res = await apiClient.get<Norma[]>('/normas');
            let data = res.data;

            // Resolver nombre del tipo
            data = data.map((n) => {
                const tipo = tipos.find((t) => t.cod_tipo_norma === n.cod_tipo_norma);
                return {
                    ...n,
                    tipo_nombre: tipo?.nombre || `Tipo ${n.cod_tipo_norma}`,
                };
            });

            // Resolver nombres de usuarios
            const userIds = Array.from(
                new Set(
                    [
                        ...data.map((n) => n.creado_por),
                        ...data.map((n) => n.actualizado_por),
                    ]
                        .filter((id): id is number => typeof id === 'number')
                )
            );

            const userMap: Record<number, string> = {};
            await Promise.all(
                userIds.map(async (id) => {
                    try {
                        const r = await apiClient.get<any>(`/users/${id}`);
                        userMap[id] = r.data.nombre;
                    } catch (e) {
                        userMap[id] = `Usuario ${id}`;
                    }
                })
            );

            data = data.map((n) => ({
                ...n,
                creado_por_nombre:
                    typeof n.creado_por === 'number' ? userMap[n.creado_por] : n.creado_por,
                actualizado_por_nombre:
                    typeof n.actualizado_por === 'number' ? userMap[n.actualizado_por] : n.actualizado_por,
            }));

            setNormas(data.sort((a, b) => b.id_norma - a.id_norma));
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar las normas.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            nombre_norma: '',
            descripcion: '',
            cod_tipo_norma: 0,
            fecha_norma: '',
            archivo: '',
            activo: 1,
        });
        setEditingNorma(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (norma: Norma) => {
        setEditingNorma(norma);
        setForm({
            nombre_norma: norma.nombre_norma,
            descripcion: norma.descripcion,
            cod_tipo_norma: norma.cod_tipo_norma,
            fecha_norma: norma.fecha_norma?.split('T')[0] || '',
            archivo: norma.archivo || '',
            activo: norma.activo,
        });
        setModalVisible(true);
    };

    const saveNorma = async () => {
        if (!form.nombre_norma || !form.descripcion || !form.fecha_norma) {
            Alert.alert('Campos requeridos', 'Nombre, descripción y fecha son obligatorios');
            return;
        }

        if (!editingNorma) {
            setReauthAction('create');
            setReauthVisible(true);
            return;
        }

        try {
            const payload = {
                ...form,
                activo: form.activo ? 1 : 0,
            };

            const res = await apiClient.put<Norma>(`/normas/${editingNorma.id_norma}`, payload);
            setNormas(prev => prev.map(n => n.id_norma === res.data.id_norma ? { ...res.data, tipo_nombre: n.tipo_nombre } : n));
            setModalVisible(false);
            resetForm();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar la norma');
        }
    };

    const saveNormaAfterReauth = async () => {
        try {
            const payload = {
                ...form,
                activo: form.activo ? 1 : 0,
            };
            const res = await apiClient.post<Norma>('/normas', payload);
            const tipoNombre = tipos.find(t => t.cod_tipo_norma === res.data.cod_tipo_norma)?.nombre || '';
            setNormas(prev => [{ ...res.data, tipo_nombre: tipoNombre }, ...prev]);
            setModalVisible(false);
            resetForm();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo crear la norma');
        }
    };

    const confirmDeleteAfterReauth = async (id: number) => {
        try {
            await apiClient.delete(`/normas/${id}`);
            setNormas(prev => prev.filter(n => n.id_norma !== id));
        } catch (error: any) {
            Alert.alert('Error', 'No se pudo eliminar la norma');
        }
    };

    const verifyCurrentUserPassword = async (password: string): Promise<boolean> => {
        try {
            await apiClient.post('/auth/verify', { password });
            return true;
        } catch {
            try {
                const me = await apiClient.get<any>('/auth/me');
                const email = me.data?.email;
                if (email) {
                    try {
                        await apiClient.post('/auth/login', { email, password });
                        return true;
                    } catch { }
                }
            } catch { }
            return false;
        }
    };

    const onConfirmReauth = async () => {
        setReauthError(null);
        if (!reauthPassword) {
            setReauthError('Ingresa tu contraseña');
            return;
        }
        const ok = await verifyCurrentUserPassword(reauthPassword);
        if (!ok) {
            setReauthError('Contraseña incorrecta');
            return;
        }

        if (reauthAction === 'create') {
            setReauthVisible(false);
            setTimeout(saveNormaAfterReauth, 100);
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
                <Text>Cargando normas...</Text>
            </View>
        );
    }

    const filteredNormas = normas.filter(n => {
        const activo = Number(n.activo);
        if (activeFilter === 'active' && activo !== 1) return false;
        if (activeFilter === 'inactive' && activo !== 0) return false;
        return true;
    }).filter(n => {
        const query = search.toLowerCase().trim();
        if (!query) return true;
        return (
            n.id_norma.toString().includes(query) ||
            n.nombre_norma.toLowerCase().includes(query) ||
            n.descripcion.toLowerCase().includes(query) ||
            n.tipo_nombre?.toLowerCase().includes(query)
        );
    });

    const displayedNormas = filteredNormas.slice(0, visibleCount);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gestión de Normas</Text>

            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.flexButton} onPress={openCreateModal}>
                    <Pencil color="#fff" size={18} />
                    <Text style={styles.flexButtonText}>Nueva Norma</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.flexButtonAlt} onPress={loadNormas}>
                    <RefreshCw color="#007AFF" size={18} />
                    <Text style={styles.flexButtonTextAlt}>Actualizar</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    textAlign="left"
                    textAlignVertical="center"
                    placeholder="Buscar norma..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor="#999"
                />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {['all', 'active', 'inactive'].map(filter => (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            styles.flexButtonAlt,
                            activeFilter === filter && { borderWidth: 1, borderColor: '#007AFF' }
                        ]}
                        onPress={() => setActiveFilter(filter as any)}
                    >
                        <Text style={styles.flexButtonTextAlt}>
                            {filter === 'all' ? 'Todos' : filter === 'active' ? 'Activos' : 'Inactivos'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={displayedNormas}
                keyExtractor={(item) => item.id_norma.toString()}
                renderItem={({ item }) => (
                    <NormaRow norma={item} onDelete={deleteUser} onEdit={openEditModal} />
                )}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />

            {filteredNormas.length > visibleCount && (
                <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={() => setVisibleCount(v => v + ITEMS_PER_PAGE)}
                >
                    <Text style={styles.loadMoreText}>Ver 15 más ({filteredNormas.length - visibleCount} restantes)</Text>
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

            {/* Modal de creación/edición */}
            <Modal visible={modalVisible} animationType="slide" transparent={false}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Ambos funcionan mejor así
                    style={{ flex: 1 }} // Ocupa toda la pantalla
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Ajuste fino para Android
                >
                    <ScrollView
                        contentContainerStyle={styles.modalScrollContainer}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingNorma ? 'Editar Norma' : 'Nueva Norma'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X color="#007AFF" size={24} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalContent}>
                            <Text style={styles.label_modal}>Nombre</Text>
                            <TextInput
                                style={styles.input}
                                multiline
                                value={form.nombre_norma}
                                onChangeText={(text) => setForm({ ...form, nombre_norma: text })}
                                placeholder="Nombre de la norma"
                                onContentSizeChange={(event) => {
                                    setNombreHeight(event.nativeEvent.contentSize.height);
                                }}
                            />

                            <Text style={styles.label_modal}>Descripción</Text>
                            <TextInput
                                style={styles.input}
                                textAlign="left"
                                textAlignVertical="center"
                                value={form.descripcion}
                                onChangeText={(text) => setForm({ ...form, descripcion: text })}
                                placeholder="Descripción detallada"
                                multiline
                                onContentSizeChange={(event) => {
                                    const { height } = event.nativeEvent.contentSize;
                                    setDescriptionHeight(height);
                                }}
                            />

                            <Text style={styles.label_modal}>Tipo de Norma</Text>
                            <TouchableOpacity
                                style={styles.select}
                                onPress={() => setShowTipoDropdown(!showTipoDropdown)}
                            >
                                <Text style={form.cod_tipo_norma ? styles.selectText : styles.selectPlaceholder}>
                                    {tipos.find(t => t.cod_tipo_norma === form.cod_tipo_norma)?.nombre || 'Seleccionar tipo de norma'}
                                </Text>
                                <ChevronDown color="#6c757d" size={18} />
                            </TouchableOpacity>

                            {/* Menú desplegable */}
                            {showTipoDropdown && (
                                <View style={styles.dropdownMenu}>
                                    <ScrollView showsVerticalScrollIndicator={true}>
                                        {tipos.map((tipo) => (
                                            <TouchableOpacity
                                                key={`tipo-${tipo.cod_tipo_norma}`}
                                                style={[styles.dropdownItem, form.cod_tipo_norma === tipo.cod_tipo_norma && styles.dropdownItemSelected]}
                                                onPress={() => {
                                                    setForm({ ...form, cod_tipo_norma: tipo.cod_tipo_norma });
                                                    setShowTipoDropdown(false);
                                                }}
                                            >
                                                <Text style={styles.dropdownText}>{tipo.nombre}</Text>
                                                {form.cod_tipo_norma === tipo.cod_tipo_norma && <Check color="#007AFF" size={16} />}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                             <Text style={styles.label_modal}>Fecha de Norma</Text>
                            <TouchableOpacity
                                style={styles.datePickerButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Calendar color="#495057" size={20} />
                                <Text style={styles.datePickerButtonText}>
                                    {form.fecha_norma || 'Seleccionar fecha'}
                                </Text>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={form.fecha_norma ? new Date(form.fecha_norma + 'T12:00:00') : new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            const formattedDate = selectedDate.toISOString().split('T')[0];
                                            setForm({ ...form, fecha_norma: formattedDate });
                                        }
                                    }}
                                />
                            )}

                            <Text style={styles.label_modal}>URL del Archivo</Text>
                            <TextInput
                                style={styles.input}
                                multiline
                                value={form.archivo}
                                onChangeText={(text) => setForm({ ...form, archivo: text })}
                                placeholder="https://..."
                                onContentSizeChange={(event) => {
                                    setArchivoHeight(event.nativeEvent.contentSize.height);
                                }}
                            />

                            <Text style={styles.label_modal}>Estado</Text>
                            <View style={styles.toggleContainer}>
                                <Text style={styles.toggleLabel}>Inactivo</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.toggleSwitch,
                                        form.activo === 1 && styles.toggleSwitchOn,
                                    ]}
                                    onPress={() => setForm({ ...form, activo: form.activo === 1 ? 0 : 1 })}
                                >
                                    <View style={[styles.toggleThumb, form.activo === 1 && styles.toggleThumbOn]} />
                                </TouchableOpacity>
                                <Text style={styles.toggleLabel}>Activo</Text>
                            </View>
                        </View>

                        {/* Botones SIEMPRE visibles (fijos al final del scroll) */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={saveNorma}>
                                <Text style={styles.saveButtonText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal de reautenticación */}
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
                                    <FileText color="#007AFF" size={18} />
                                ) : (
                                    <FileText color="#6c757d" size={18} />
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

function NormaRow({ norma, onEdit, onDelete }: { norma: Norma; onEdit: (n: Norma) => void; onDelete: (id: number, name: string) => void }) {
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ' - ' +
            date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    };

    const estadoColor = norma.activo === 1 ? '#34C759' : '#FF3B30';

    return (
        <View style={styles.userCard}>
            <View style={styles.headerRow}>
                <Text style={styles.userName}>#{norma.id_norma} - {norma.nombre_norma}</Text>
                <View style={[styles.roleBadge, { backgroundColor: estadoColor }]}>
                    <Text style={styles.roleText}>{norma.activo === 1 ? 'ACTIVO' : 'INACTIVO'}</Text>
                </View>
            </View>
            <Text style={styles.smallText}>Tipo: {norma.tipo_nombre}</Text>
            <Text style={styles.userEmail}>{norma.descripcion}</Text>
            <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Fecha:</Text>
                    <Text style={styles.value}>{formatDateTime(norma.fecha_norma)}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Creado:</Text>
                    <Text style={styles.value}>{formatDateTime(norma.fecha_registro)}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Por:</Text>
                    <Text style={styles.value}>{norma.creado_por_nombre || 'Sistema'}</Text>
                </View>
                {norma.fecha_actualizacion && (
                    <>
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Editado:</Text>
                            <Text style={styles.value}>{formatDateTime(norma.fecha_actualizacion)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Por:</Text>
                            <Text style={styles.value}>{norma.actualizado_por_nombre || 'Sistema'}</Text>
                        </View>
                    </>
                )}
            </View>
            <View style={styles.actions}>
                {norma.archivo && (
                    <TouchableOpacity style={styles.pdfButton} onPress={() => Linking.openURL(norma.archivo!)}>
                        <FileText color="#fff" size={16} />
                        <Text style={styles.actionText}>PDF</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.editButton} onPress={() => onEdit(norma)}>
                    <Pencil color="#fff" size={16} />
                    <Text style={styles.actionText}>Editar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Estilos (basados en el diseño de usuarios)
const styles = {
    ...require('../../admin/users/index').default.styles,
    // Sobrescribir solo lo necesario
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8f9fa',
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
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 16,
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
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        fontSize: 16,
        color: '#333',
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
        marginBottom: 12,
    },
    datePickerButtonText: {
        fontSize: 16,
        color: '#495057',
    },
    list: {
        paddingBottom: 32,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    roleText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
    },
    smallText: {
        fontSize: 13,
        color: '#6c757d',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#495057',
        marginBottom: 8,
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
        width: 70,
    },
    label_modal: {
        fontSize: 13,
        color: '#495057',
        fontWeight: '600',
        width: 170,
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
    pdfButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#5856D6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    actionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },

    modalScrollContainer: {
        flexGrow: 1,
        padding: 16,
        backgroundColor: '#f8f9fa',
        paddingBottom: 40, // Espacio extra al final para que el último botón no quede pegado
    },

    modalContent: {
        gap: 16,
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
    form: {
        gap: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#fff',
        minHeight: 48,
        textAlignVertical: 'top', // importante para multiline
    },
    picker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pickerOption: {
        flex: 1,
        minWidth: '45%',
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    pickerSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#e9ecef',
    },
    pickerText: {
        fontSize: 16,
        color: '#333',
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24, // espacio sobre los botones
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
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
    toggleThumbOn: {
        transform: [{ translateX: 26 }],
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
    dropdown: {
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        maxHeight: 150,
        backgroundColor: '#fff',
    },
    dropdownScroll: {
        maxHeight: 148,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    dropdownItemSelected: {
        backgroundColor: '#e9ecef',
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
    },

    select: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#fff',
        minHeight: 48,
    },

    selectText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },

    selectPlaceholder: {
        fontSize: 16,
        color: '#999',
        fontStyle: 'italic',
        flex: 1,
    },

    dropdownMenu: {
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        maxHeight: 650,
        backgroundColor: '#fff',
        marginTop: 4,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    loadMoreButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
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
};