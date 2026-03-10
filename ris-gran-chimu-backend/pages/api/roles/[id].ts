import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { authenticate } from '../../../lib/middleware/auth';
import { requirePermission } from '../../../lib/middleware/requirePermission';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authError = authenticate(req, res);
    if (authError) return authError;

    const permError = await requirePermission('manage_roles')(req, res);
    if (permError) return permError;

    const { id } = req.query;
    const roleId = Number(id);

    if (req.method === 'PUT') {
        const { nombre, descripcion, activo, permisos_ids } = req.body;
        const updatedBy = (req as any).user.id;

        try {
            await query(
                `UPDATE roles SET nombre = ?, descripcion = ?, activo = ?, updated_by = ? WHERE id = ?`,
                [nombre, descripcion, activo ? 1 : 0, updatedBy, roleId]
            );

            // Actualizar permisos (Delete all & Insert)
            await query('DELETE FROM roles_permisos WHERE role_id = ?', [roleId]);

            if (Array.isArray(permisos_ids) && permisos_ids.length > 0) {
                const values = permisos_ids.map((pid: number) => [roleId, pid]);
                await query('INSERT INTO roles_permisos (role_id, permiso_id) VALUES ?', [values]);
            }

            return res.status(200).json({ message: 'Rol actualizado correctament' });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error al actualizar rol' });
        }
    }

    return res.status(405).end();
}
