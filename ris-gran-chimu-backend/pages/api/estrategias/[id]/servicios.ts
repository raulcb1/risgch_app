import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../lib/db';
import { authenticate } from '../../../../lib/middleware/auth';
import { requirePermission } from '../../../../lib/middleware/requirePermission';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authError = authenticate(req, res);
    if (authError) return authError;

    const { id } = req.query;
    const estrategiaId = parseInt(id as string);

    if (isNaN(estrategiaId)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    // Solo admin/editor pueden modificar asociaciones
    if (req.method === 'PUT') {
        const roleError = await requirePermission('manage_estrategias')(req, res);
        if (roleError) return roleError;

        const { servicios } = req.body; // Array de IDs de servicios

        if (!Array.isArray(servicios)) {
            return res.status(400).json({ error: 'Formato de servicios inválido. Se espera un array de IDs.' });
        }

        try {
            // 1. Verificar que la estrategia existe
            const rows: any = await query('SELECT id FROM estrategias WHERE id = ?', [estrategiaId]);
            if (!rows || rows.length === 0) {
                return res.status(404).json({ error: 'Estrategia no encontrada' });
            }

            // 2. Eliminar asociaciones existentes
            await query('DELETE FROM estrategia_servicios WHERE estrategia_id = ?', [estrategiaId]);

            // 3. Insertar nuevas asociaciones
            if (servicios.length > 0) {
                const values = servicios.map((servicioId: number) => [estrategiaId, servicioId]);
                await query('INSERT INTO estrategia_servicios (estrategia_id, servicio_id) VALUES ?', [values]);
            }

            return res.status(200).json({ message: 'Servicios actualizados exitosamente' });

        } catch (error) {
            console.error('Error al actualizar servicios de la estrategia:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    if (req.method === 'GET') {
        try {
            const result: any = await query('SELECT servicio_id FROM estrategia_servicios WHERE estrategia_id = ?', [estrategiaId]);
            const serviceIds = result.map((row: any) => row.servicio_id);
            return res.status(200).json(serviceIds);
        } catch (error) {
            console.error('Error al obtener servicios:', error);
            return res.status(500).json({ error: 'Error interno' });
        }
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).end();
}
