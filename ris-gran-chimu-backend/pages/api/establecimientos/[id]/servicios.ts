import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../lib/db';
import { authenticate } from '../../../../lib/middleware/auth';
import { requirePermission } from '../../../../lib/middleware/requirePermission';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authError = authenticate(req, res);
  if (authError) return authError;

  const { id } = req.query;
  const establecimientoId = parseInt(id as string);

  if (isNaN(establecimientoId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  // Solo admin/editor pueden modificar asociaciones
  if (req.method === 'PUT') {
    const roleError = await requirePermission('manage_establecimientos')(req, res);
    if (roleError) return roleError;

    const { servicios_ids } = req.body; // Array de IDs de servicios

    if (!Array.isArray(servicios_ids)) {
      return res.status(400).json({ error: 'Formato de servicios inválido. Se espera un array de IDs.' });
    }

    try {
      // 1. Verificar que el establecimiento existe
      const [estExists]: any = await query('SELECT id FROM establecimientos WHERE id = ?', [establecimientoId]);
      if (!estExists || estExists.length === 0) {
        return res.status(404).json({ error: 'Establecimiento no encontrado' });
      }

      // 2. Transacción manual (MySql2 no soporta transaction block simple sin pool connection explícita a veces, 
      // pero aquí haremos delete-insert que es lo estándar para reemplazar asociaciones)

      // Eliminar asociaciones existentes
      await query('DELETE FROM establecimientos_servicios WHERE establecimiento_id = ?', [establecimientoId]);

      // Insertar nuevas asociaciones si hay
      if (servicios_ids.length > 0) {
        const values = servicios_ids.map((servicioId: number) => [establecimientoId, servicioId]);
        // Construir query para bulk insert
        // values es [[1, 2], [1, 3]]
        // query expects flatten array for placeholder ? if manually building, usually bulk insert is:
        // INSERT INTO table (col1, col2) VALUES ?
        // mysql2 supports this syntax with pool.query

        await query('INSERT INTO establecimientos_servicios (establecimiento_id, servicio_id) VALUES ?', [values]);
      }

      return res.status(200).json({ message: 'Servicios actualizados exitosamente' });

    } catch (error) {
      console.error('Error al actualizar servicios del establecimiento:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  if (req.method === 'GET') {
    try {
      const result: any = await query('SELECT servicio_id FROM establecimientos_servicios WHERE establecimiento_id = ?', [establecimientoId]);
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