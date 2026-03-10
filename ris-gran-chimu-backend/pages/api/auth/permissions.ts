import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { authenticate } from '../../../lib/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authError = authenticate(req, res);
    if (authError) return authError;

    const user = (req as any).user;

    // Si es admin, devolver lista completa o un indicador especial
    if (user.role === 'admin') {
        // Podemos devolver todos los códigos de la tabla permisos
        const allPerms: any = await query('SELECT codigo FROM permisos');
        return res.status(200).json(allPerms.map((p: any) => p.codigo));
    }

    try {
        const results: any = await query(`
            SELECT p.codigo 
            FROM permisos p
            JOIN roles_permisos rp ON p.id = rp.permiso_id
            JOIN roles r ON rp.role_id = r.id
            WHERE r.nombre = ? AND r.activo = 1
        `, [user.role]);

        const codes = results.map((row: any) => row.codigo);
        return res.status(200).json(codes);
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener permisos' });
    }
}
