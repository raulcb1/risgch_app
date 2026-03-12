import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';

type PermissionContextType = {
    permissions: string[];
    loading: boolean;
    hasPermission: (code: string) => boolean;
    refreshPermissions: () => Promise<void>;
};

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPermissions = async () => {
        if (!user) {
            setPermissions([]);
            setLoading(false);
            return;
        }

        // Si es admin, tiene todo (optimización local). Pero el backend es la autoridad.
        // Aquí pedimos los permisos reales.
        
        try {
            // Necesitamos un endpoint que nos diga "mis permisos"
            // Por ahora, usaremos una lógica simple o un endpoint dedicado.
            // Opción A: GET /auth/me/permissions
            
            // Si no tenemos ese endpoint, podemos asumir algo temporal o crearlo.
            // Vamos a consumir un endpoint nuevo GET /auth/permissions
            const res = await apiClient.get<string[]>('/auth/permissions');
            setPermissions(res.data);
        } catch (error) {
            console.error('Error cargando permisos', error);
            setPermissions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPermissions();
    }, [user]);

    const hasPermission = (code: string) => {
        if (user?.role === 'admin') return true;
        return permissions.includes(code);
    }

    return (
        <PermissionContext.Provider value={{ permissions, loading, hasPermission, refreshPermissions: loadPermissions }}>
            {children}
        </PermissionContext.Provider>
    );
}

export function usePermissions() {
    const context = useContext(PermissionContext);
    if (!context) throw new Error('usePermissions must be used within PermissionProvider');
    return context;
}
