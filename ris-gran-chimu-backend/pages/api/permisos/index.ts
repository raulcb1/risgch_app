import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { authenticate } from '../../../lib/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authError = authenticate(req, res);
    if (authError) return authError;

    // Permisos listables para cualquiera autenticado? O solo admins?
    // User wants to edit roles, so likely admin.
    // We can treat this as a utility for the role editor.

    if (req.method === 'GET') {
        try {
            const perms: any = await query('SELECT * FROM permisos ORDER BY modulo, id');
            return res.status(200).json(perms);
        } catch (error) {
            return res.status(500).json({ error: 'Error al obtener permisos' });
        }
    }

    return res.status(405).end();
}
