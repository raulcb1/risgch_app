// app/(main)/admin/users/index.tsx
import { useAuth } from '@/src/hooks/useAuth';
import apiClient from '@/src/services/apiClient';
import { Check, Eye, EyeOff, Pencil, Trash2, UserPlus, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type User = {
    id: number;
    nombre: string;
    email: string;
    password: string;
    rol: string;
    created_at: string;
    created_by: string | number;
    updated_at: string | null;
    updated_by: string | number | null;
};

// Generador de colores determinista
const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
        case 'admin': return '#007AFF'; // Azure
        case 'editor': return '#5856D6'; // Purple
        case 'user': return '#6c757d'; // Gray
        default:
            let hash = 0;
            for (let i = 0; i < role.length; i++) {
                hash = role.charCodeAt(i) + ((hash << 5) - hash);
            }
            const colors = [
                '#FF9500', // Orange
                '#FF3B30', // Red
                '#34C759', // Green
                '#00C7BE', // Teal
                '#AF52DE', // Indigo
                '#FF2D55', // Pink
                '#A2845E', // Brown
                '#5AC8FA', // Light Blue
            ];
            return colors[Math.abs(hash) % colors.length];
    }
};

export default function UsersScreen() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roles, setRoles] = useState<{ id: number; nombre: string; activo: number }[]>([]);

    // Formulario
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form, setForm] = useState({
        nombre: '',
        email: '',
        password: '',
        confirmPassword: '',
        rol: '',
    });
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    // Re-autenticación para acciones críticas
    const [reauthVisible, setReauthVisible] = useState(false);
    const [reauthAction, setReauthAction] = useState<'create' | 'delete' | null>(null);
    const [reauthTargetId, setReauthTargetId] = useState<number | null>(null);
    const [reauthPassword, setReauthPassword] = useState('');
    const [reauthError, setReauthError] = useState<string | null>(null);
    const [reauthPasswordVisible, setReauthPasswordVisible] = useState(false);

    useEffect(() => {
        loadUsers();
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            const res = await apiClient.get<any[]>('/roles');
            // Filtrar solo roles activos o mostrar todos? Para asignar, mejor solo activos.
            // Aunque si un usuario tiene un rol inactivo, deberíamos verlo.
            setRoles(res.data);
        } catch (error) {
            console.log('Error cargando roles', error);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await apiClient.get<User[]>('/users');
            setUsers(res.data);

            // Resolver nombres de creadores si el backend devolvió IDs
            const creatorIds = Array.from(
                new Set(
                    [
                        ...users.map(u => u.created_by),
                        ...users.map(u => u.updated_by).filter(Boolean),
                    ]
                        .filter(id => typeof id === 'number') as number[]
                )
            );

            if (creatorIds.length > 0) {
                const uniqueIds = [...new Set(creatorIds)];
                await Promise.all(
                    uniqueIds.map(async (id) => {
                        try {
                            const r = await apiClient.get<User>(`/users/${id}`);
                            setUsers((prev) =>
                                prev.map((u) => ({
                                    ...u,
                                    created_by: u.created_by === id ? r.data.nombre : u.created_by,
                                    updated_by: u.updated_by === id ? r.data.nombre : u.updated_by,
                                }))
                            );
                        } catch (e) {
                            // ignorar
                        }
                    })
                );
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar los usuarios.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ nombre: '', email: '', password: '', confirmPassword: '', rol: roles.length > 0 ? roles[0].nombre : '' });
        setEditingUser(null);
        setPasswordVisible(false);
        setConfirmPasswordVisible(false);
        setReauthError(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setForm({
            nombre: user.nombre,
            email: user.email,
            password: '',
            confirmPassword: '',
            rol: user.rol,
        });
        setModalVisible(true);
    };

    const validatePasswords = (): boolean => {
        if (!editingUser && !form.password) {
            Alert.alert('Error', 'La contraseña es obligatoria para nuevos usuarios');
            return false;
        }
        if (!editingUser && form.password !== form.confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return false;
        }
        return true;
    };

    const saveUser = async () => {
        if (!form.nombre || !form.email) {
            Alert.alert('Campos requeridos', 'Nombre, correo y contraseña son obligatorios');
            return;
        }

        if (!validatePasswords()) return;

        if (!editingUser) {
            setReauthAction('create');
            setReauthVisible(true);
            return;
        }

        try {
            const userData = {
                ...form,
                createdBy: currentUser?.name,
                password: form.password || undefined,
            };

            const res = await apiClient.put<User>(`/users/${editingUser.id}`, userData);
            setUsers((prev) => prev.map((u) => (u.id === res.data.id ? res.data : u)));
            setModalVisible(false);
            resetForm();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar el usuario');
        }
    };

    const saveUserAfterReauth = async () => {
        try {
            const userData = {
                ...form,
                createdBy: currentUser?.name,
                password: form.password || undefined,
            };

            const res = await apiClient.post<User>('/users', userData);
            setUsers((prev) => [...prev, res.data]);
            setModalVisible(false);
            resetForm();
            setReauthPassword('');
        } catch (error: any) {
            console.error('Save User Error:', error);
            const msg = error.response ? error.response.data.message : error.message;
            Alert.alert('Error', msg || 'No se pudo crear el usuario. Revisa tu conexión.');
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
        try {
            const ok = await verifyCurrentUserPassword(reauthPassword);
            if (!ok) {
                setReauthError('Contraseña incorrecta');
                return;
            }

            if (reauthAction === 'create') {
                setReauthVisible(false);
                setTimeout(saveUserAfterReauth, 100);
            } else if (reauthAction === 'delete' && reauthTargetId != null) {
                setReauthVisible(false);
                setTimeout(() => confirmDeleteAfterReauth(reauthTargetId), 100);
            }
        } catch (e: any) {
            console.error('Reauth Error:', e);
            setReauthError('Error de conexión al verificar contraseña');
            Alert.alert('Error', e.message || 'Error de red');
        }
    };

    const confirmDeleteAfterReauth = async (id: number) => {
        try {
            await apiClient.delete(`/users/${id}`);
            setUsers((prev) => prev.filter((u) => u.id !== id));
            setReauthPassword('');
        } catch (error: any) {
            Alert.alert('Error', 'No se pudo eliminar el usuario');
        }
    };

    const deleteUser = (id: number, nombre: string) => {
        if (id === Number(currentUser?.id)) {
            Alert.alert('Acción no permitida', 'No puedes eliminarte a ti mismo');
            return;
        }

        setReauthAction('delete');
        setReauthTargetId(id);
        setReauthVisible(true);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <Text>Cargando usuarios...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Encabezado */}
            <Text style={styles.title}>Gestión de Usuarios</Text>

            {/* Botones encabezado: izquierda y derecha */}
            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.flexButton} onPress={openCreateModal}>
                    <UserPlus color="#fff" size={18} />
                    <Text style={styles.flexButtonText}>Nuevo Usuario</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.flexButtonAlt} onPress={loadUsers}>
                    <Eye color="#007AFF" size={18} />
                    <Text style={styles.flexButtonTextAlt}>Revelar datos</Text>
                </TouchableOpacity>
            </View>

            {/* Barra de búsqueda */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por ID, nombre, email o rol..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor="#999"
                />
            </View>

            {/* Lista de usuarios */}
            <FlatList
                data={users.filter((user) => {
                    const query = search.toLowerCase().trim();
                    if (!query) return true;
                    return (
                        user.id.toString().includes(query) ||
                        user.nombre.toLowerCase().includes(query) ||
                        user.email.toLowerCase().includes(query) ||
                        user.rol.toLowerCase().includes(query)
                    );
                })}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <UserRow
                        user={item}
                        currentUser={currentUser}
                        onDelete={deleteUser}
                        onEdit={openEditModal}
                    />
                )}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />

            {/* Modal de creación/edición */}
            <Modal visible={modalVisible} animationType="slide" transparent={false}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</Text>
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
                            placeholder="Nombre completo"
                        />

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={form.email}
                            onChangeText={(text) => setForm({ ...form, email: text })}
                            placeholder="email@dominio.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        {!editingUser && (
                            <>
                                {/* Contraseña */}
                                <Text style={styles.label}>Contraseña</Text>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        style={styles.inputNoBorder}
                                        value={form.password}
                                        onChangeText={(text) => setForm({ ...form, password: text })}
                                        placeholder="Contraseña"
                                        secureTextEntry={!passwordVisible}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeButtonInInput}
                                        onPress={() => setPasswordVisible(!passwordVisible)}
                                    >
                                        {passwordVisible ? (
                                            <Eye color="#007AFF" size={18} />
                                        ) : (
                                            <EyeOff color="#6c757d" size={18} />
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {/* Confirmar contraseña */}
                                <Text
                                    style={{
                                        fontSize: 13,
                                        color: '#495057',
                                        fontWeight: '600',
                                        width: 170,
                                    }}
                                >Confirmar Contraseña</Text>
                                <View style={styles.passwordInputContainer}>
                                    <TextInput
                                        style={styles.inputNoBorder}
                                        value={form.confirmPassword}
                                        onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
                                        placeholder="Repite la contraseña"
                                        secureTextEntry={!confirmPasswordVisible}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeButtonInInput}
                                        onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                                    >
                                        {confirmPasswordVisible ? (
                                            <Eye color="#007AFF" size={18} />
                                        ) : (
                                            <EyeOff color="#6c757d" size={18} />
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {/* Mensaje de error */}
                                {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
                                    <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
                                )}
                            </>
                        )}

                        <Text style={styles.label}>Rol</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {roles.filter(r => r.activo === 1).map((role) => (
                                <TouchableOpacity
                                    key={role.id}
                                    style={[
                                        styles.pickerOption, 
                                        { flex: 0, minWidth: '30%' },
                                        form.rol === role.nombre && styles.pickerSelected
                                    ]}
                                    onPress={() => setForm({ ...form, rol: role.nombre })}
                                >
                                    <Text style={styles.pickerText}>{role.nombre}</Text>
                                    {form.rol === role.nombre && <Check color="#007AFF" size={16} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={saveUser}>
                            <Text style={styles.saveButtonText}>Guardar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
                                    <Eye color="#007AFF" size={18} />
                                ) : (
                                    <EyeOff color="#6c757d" size={18} />
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

// Componente interno: Fila de usuario
function UserRow({
    user,
    currentUser,
    onDelete,
    onEdit,
}: {
    user: User;
    currentUser: ReturnType<typeof useAuth>['user'];
    onDelete: (id: number, nombre: string) => void;
    onEdit: (user: User) => void;
}) {
    return (
        <View style={styles.userCard}>
            {/* Encabezado */}
            <View style={styles.headerRow}>
                <View style={styles.idAndName}>
                    <Text style={styles.userId}>#{user.id}</Text>
                    <Text style={styles.userName}>{user.nombre}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.rol) }]}>
                    <Text style={styles.roleText}>{user.rol.toUpperCase()}</Text>
                </View>
            </View>

            {/* Email */}
            <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
            </Text>

            {/* Detalles completos */}
            <View style={styles.detailsSection}>
                {/* Creado */}
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Creado:</Text>
                    <Text style={styles.value}>
                        {new Date(user.created_at).toLocaleString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Por:</Text>
                    <Text style={styles.value}>{typeof user.created_by === 'string' ? user.created_by : `ID: ${user.created_by}`}</Text>
                </View>

                {/* Editado */}
                {user.updated_at && (
                    <>
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Editado:</Text>
                            <Text style={styles.value}>
                                {new Date(user.updated_at).toLocaleString('es-PE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Por:</Text>
                            <Text style={styles.value}>
                                {user.updated_by
                                    ? typeof user.updated_by === 'string'
                                        ? user.updated_by
                                        : `ID: ${user.updated_by}`
                                    : 'Sistema'}
                            </Text>
                        </View>
                    </>
                )}
            </View>

            {/* Acciones */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.editButton} onPress={() => onEdit(user)}>
                    <Pencil color="#fff" size={16} />
                    <Text style={styles.actionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.deleteButton,
                        user.id === Number(currentUser?.id) && styles.deleteButtonDisabled,
                    ]}
                    onPress={() => onDelete(user.id, user.nombre)}
                    disabled={user.id === Number(currentUser?.id)}
                >
                    <Trash2 color="#fff" size={16} />
                    <Text style={styles.actionText}>Eliminar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Estilos
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
    // --- Botones flexibles ---
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
    // --- Barra de búsqueda ---
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
    list: {
        paddingBottom: 32,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // --- Tarjeta de usuario ---
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
    idAndName: {
        flex: 1,
        marginRight: 8,
    },
    userId: {
        fontSize: 12,
        color: '#6c757d',
        fontWeight: '500',
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#003366',
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
    userEmail: {
        fontSize: 14,
        color: '#495057',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginBottom: 10,
    },
    passwordLabel: {
        fontSize: 13,
        color: '#495057',
        fontWeight: '600',
        width: 70,
    },
    passwordText: {
        fontSize: 13,
        fontFamily: 'monospace',
        color: '#333',
        flex: 1,
    },
    eyeButton: {
        padding: 4,
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
    deleteButtonDisabled: {
        backgroundColor: '#adb5bd',
        opacity: 0.7,
    },
    actionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },

    // --- Modal ---
    modalContainer: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8f9fa',
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
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    picker: {
        flexDirection: 'row',
        gap: 12,
    },
    pickerOption: {
        flex: 1,
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

    // --- Campos con ojo ---
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0, // container provides visual border elsewhere
        borderColor: 'transparent',
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

    // --- Reautenticación ---
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
});