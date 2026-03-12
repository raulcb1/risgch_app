import { useAuth } from '@/src/hooks/useAuth';
import apiClient from '@/src/services/apiClient';
import {
    Pencil,
    RefreshCw,
    Shield,
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
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type Permiso = {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    modulo: string;
};

type Role = {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
    permisos: number[];
    created_at?: string;
    nombre_creador?: string;
    updated_at?: string;
    nombre_actualizador?: string;
};

export default function RolesScreen() {
    const { user: currentUser } = useAuth();
    const [items, setItems] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permiso[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<Role | null>(null);
    const [form, setForm] = useState<{
        nombre: string;
        descripcion: string;
        activo: boolean;
        permisos_ids: number[];
    }>({
        nombre: '',
        descripcion: '',
        activo: true,
        permisos_ids: [],
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                apiClient.get<Role[]>('/roles'),
                apiClient.get<Permiso[]>('/permisos')
            ]);
            setItems(rolesRes.data);
            setAllPermissions(permsRes.data);
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar los roles o permisos.');
        } finally {
            setLoading(false);
        }
    };

    const loadRoles = async () => {
        try {
            const [rolesRes, permsRes] = await Promise.all([
                apiClient.get<Role[]>('/roles'),
                apiClient.get<Permiso[]>('/permisos')
            ]);
            setItems(rolesRes.data);
            setAllPermissions(permsRes.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudieron actualizar los datos.');
        }
    };

    const resetForm = () => {
        setForm({
            nombre: '',
            descripcion: '',
            activo: true,
            permisos_ids: [],
        });
        setEditing(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (item: Role) => {
        setEditing(item);
        setForm({
            nombre: item.nombre,
            descripcion: item.descripcion,
            activo: Boolean(item.activo), // asegura boolean
            permisos_ids: item.permisos || [],
        });
        setModalVisible(true);
    };

    const togglePermission = (permId: number) => {
        setForm(prev => {
            const exists = prev.permisos_ids.includes(permId);
            return {
                ...prev,
                permisos_ids: exists
                    ? prev.permisos_ids.filter(id => id !== permId)
                    : [...prev.permisos_ids, permId]
            };
        });
    };

    const saveItem = async () => {
        if (!form.nombre) {
            Alert.alert('Campos requeridos', 'El nombre del rol es obligatorio');
            return;
        }

        try {
            if (editing) {
                await apiClient.put(`/roles/${editing.id}`, form);
                Alert.alert('Éxito', 'Rol actualizado correctamente', [
                    { text: 'OK', onPress: () => { setModalVisible(false); loadRoles(); } }
                ]);
            } else {
                await apiClient.post('/roles', form);
                Alert.alert('Éxito', 'Rol creado correctamente', [
                    { text: 'OK', onPress: () => { setModalVisible(false); loadRoles(); } }
                ]);
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.error || 'No se pudo guardar');
        }
    };

    // Agrupar permisos por módulo
    const groupedPermissions = allPermissions.reduce((acc, perm) => {
        if (!acc[perm.modulo]) acc[perm.modulo] = [];
        acc[perm.modulo].push(perm);
        return acc;
    }, {} as Record<string, Permiso[]>);

    if (loading) {
        return (
            <View style={styles.centered}>
                <Text>Cargando roles...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gestión de Roles</Text>

            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.flexButton} onPress={openCreateModal}>
                    <Shield color="#fff" size={18} />
                    <Text style={styles.flexButtonText}>Nuevo Rol</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.flexButtonAlt} onPress={loadRoles}>
                    <RefreshCw color="#007AFF" size={18} />
                    <Text style={styles.flexButtonTextAlt}>Actualizar</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <RoleRow item={item} onEdit={openEditModal} />
                )}
                contentContainerStyle={styles.list}
            />

            <Modal visible={modalVisible} animationType="slide" transparent={false}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editing ? 'Editar Rol' : 'Nuevo Rol'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X color="#007AFF" size={24} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Nombre del Rol</Text>
                        <TextInput
                            style={styles.input}
                            value={form.nombre}
                            onChangeText={(t) => setForm({ ...form, nombre: t })}
                            placeholder="Ej. Marketing"
                            editable={editing?.nombre !== 'admin'} // Admin role name locked usually
                        />

                        <Text style={styles.label}>Descripción</Text>
                        <TextInput
                            style={styles.input}
                            value={form.descripcion}
                            onChangeText={(t) => setForm({ ...form, descripcion: t })}
                            placeholder="Descripción de funciones"
                        />

                        <View style={styles.toggleRow}>
                            <Text style={styles.label}>Activo</Text>
                            <Switch
                                value={form.activo}
                                onValueChange={(v) => setForm({ ...form, activo: v })}
                                trackColor={{ false: "#767577", true: "#34C759" }}
                            />
                        </View>

                        <Text style={[styles.label, { marginTop: 16 }]}>Permisos</Text>
                        <View style={styles.permissionsContainer}>
                            {Object.entries(groupedPermissions).map(([modulo, perms]) => (
                                <View key={modulo} style={styles.moduleSection}>
                                    <Text style={styles.moduleTitle}>{modulo}</Text>
                                    {perms.map(p => {
                                        const isSelected = form.permisos_ids.includes(p.id);
                                        return (
                                            <TouchableOpacity 
                                                key={p.id} 
                                                style={styles.permItem}
                                                onPress={() => togglePermission(p.id)}
                                            >
                                                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                                    {isSelected && <View style={styles.checkboxInner} />}
                                                </View>
                                                <View style={{flex: 1}}>
                                                    <Text style={styles.permName}>{p.nombre}</Text>
                                                    <Text style={styles.permDesc}>{p.descripcion || p.codigo}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>

                        <View style={styles.modalFooter}>
                             <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={saveItem}>
                                <Text style={styles.saveButtonText}>Guardar Rol</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

function RoleRow({ item, onEdit }: { item: Role; onEdit: (r: Role) => void }) {
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.nombre}</Text>
                {item.activo ? (
                    <View style={styles.badgeActive}><Text style={styles.badgeText}>ACTIVO</Text></View>
                ) : (
                    <View style={styles.badgeInactive}><Text style={styles.badgeText}>INACTIVO</Text></View>
                )}
            </View>
            <Text style={styles.cardDesc}>{item.descripcion}</Text>

            <View style={styles.detailsContainer}>
                {item.created_at && (
                    <Text style={styles.detailText}>
                        Creado: {new Date(item.created_at).toLocaleDateString()}
                        {item.nombre_creador ? ` por ${item.nombre_creador}` : ''}
                    </Text>
                )}
                {item.updated_at && (
                    <Text style={styles.detailText}>
                        Editado: {new Date(item.updated_at).toLocaleDateString()}
                        {item.nombre_actualizador ? ` por ${item.nombre_actualizador}` : ''}
                    </Text>
                )}
            </View>

            <Text style={styles.permCount}>{item.permisos?.length || 0} permisos asignados</Text>
            
            <TouchableOpacity style={styles.editButton} onPress={() => onEdit(item)}>
                <Pencil color="#fff" size={16} />
                <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 16,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    flexButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    flexButtonText: { color: '#fff', fontWeight: 'bold' },
    flexButtonAlt: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#e9ecef',
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    flexButtonTextAlt: { color: '#007AFF', fontWeight: 'bold' },
    list: { paddingBottom: 40 },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    cardDesc: { color: '#666', marginBottom: 8 },
    detailsContainer: { marginBottom: 8, padding: 8, backgroundColor: '#f9f9f9', borderRadius: 6 },
    detailText: { fontSize: 11, color: '#888', marginBottom: 2 },
    permCount: { fontSize: 12, color: '#999', marginBottom: 12 },
    badgeActive: { backgroundColor: '#34C759', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    badgeInactive: { backgroundColor: '#FF3B30', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    editButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        padding: 8,
        borderRadius: 6,
        alignSelf: 'flex-start',
        alignItems: 'center',
        gap: 6,
    },
    editText: { color: '#fff', fontWeight: '500' },
    modalContent: { padding: 20, paddingBottom: 50 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#003366' },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    permissionsContainer: { gap: 16 },
    moduleSection: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
    moduleTitle: { fontWeight: 'bold', color: '#555', marginBottom: 8, textTransform: 'uppercase', fontSize: 12 },
    permItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 },
    permName: { fontWeight: '600', color: '#333' },
    permDesc: { fontSize: 12, color: '#666' },
    checkbox: {
        width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#007AFF', alignItems: 'center', justifyContent: 'center'
    },
    checkboxSelected: { backgroundColor: '#007AFF' },
    checkboxInner: { width: 10, height: 10, backgroundColor: '#fff', borderRadius: 2 },
    modalFooter: { flexDirection: 'row', gap: 12, marginTop: 32 },
    cancelButton: { flex: 1, padding: 14, backgroundColor: '#e9ecef', borderRadius: 8, alignItems: 'center' },
    cancelButtonText: { color: '#333', fontWeight: 'bold' },
    saveButton: { flex: 1, padding: 14, backgroundColor: '#007AFF', borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: '#fff', fontWeight: 'bold' },
});
