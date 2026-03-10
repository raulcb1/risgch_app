import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../db';

// Cache simple para evitar consultas excesivas (opcional, por ahora lo haremos directo)
// const permissionsCache = new Map<string, string[]>();

export function requirePermission(requiredPermission: string) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ error: 'Acceso denegado. Usuario no autenticado.' });
        }

        const userRole = user.role; // string: 'admin', 'editor', etc.

        // Super-admin escape hatch (optional, but good for safety)
        if (userRole === 'admin') return null;

        try {
            // Consultar permisos del rol
            // Optimización: Podríamos guardar los permisos en el token JWT para evitar esta consulta,
            // pero para "Gestionar roles" necesitamos que los cambios sean inmediatos.

            const results: any = await query(`
        SELECT p.codigo 
        FROM permisos p
        JOIN roles_permisos rp ON p.id = rp.permiso_id
        JOIN roles r ON rp.role_id = r.id
        WHERE r.nombre = ? AND r.activo = 1
      `, [userRole]);

            const permissions = results.map((row: any) => row.codigo);

            if (!permissions.includes(requiredPermission)) {
                return res.status(403).json({
                    error: `Acceso denegado. Se requiere el permiso: ${requiredPermission}.`
                });
            }

            return null; // Éxito

        } catch (error) {
            console.error('Error verificando permisos:', error);
            return res.status(500).json({ error: 'Error interno verificando permisos' });
        }
    };
}

// Wrapper para usar similar a requireRole pero asíncrono
// Ojo: requireRole era síncrono porque solo chequeaba el string.
// requirePermission es asíncrono. Esto requerirá cambios en cómo se llama en los handlers.
