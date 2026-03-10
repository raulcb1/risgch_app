// backend/pages/api/estrategias/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { authenticate } from '../../../lib/middleware/auth';
import { requirePermission } from '../../../lib/middleware/requirePermission';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authError = authenticate(req, res);
  if (authError) return authError;

  const { id } = req.query;
  const estrategiaId = parseInt(id as string);

  if (isNaN(estrategiaId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  // Aplicar roles para PUT y DELETE
  if (['PUT', 'DELETE'].includes(req.method!)) {
    const roleError = await requirePermission('manage_estrategias')(req, res);
    if (roleError) return roleError;
  }

  try {
    if (req.method === 'GET') {
      const result = await query(`
        SELECT 
          e.*,
          u.nombre as creado_por_nombre,
          u2.nombre as actualizado_por_nombre
        FROM estrategias e
        JOIN usuarios u ON e.creado_por = u.id
        LEFT JOIN usuarios u2 ON e.actualizado_por = u2.id
        WHERE e.id = ?
      `, [estrategiaId]);

      const row = Array.isArray(result) ? result[0] : null;
      if (!row) {
        return res.status(404).json({ error: 'Estrategia no encontrada' });
      }
      return res.status(200).json(row);
    }

    if (req.method === 'PUT') {
      const { titulo, descripcion, activo } = req.body;
      const userId = (req as any).user.id;

      if (!titulo || !descripcion) {
        return res.status(400).json({ error: 'Título y descripción son obligatorios' });
      }

      // Validar y convertir `activo` a booleano, default true si es undefined
      const isActive = activo !== undefined ? Boolean(activo) : true;

      await query(
        `UPDATE estrategias SET 
          titulo = ?, 
          descripcion = ?,
          activo = ?,
          actualizado_por = ?
        WHERE id = ?`,
        [titulo, descripcion, isActive ? 1 : 0, userId, estrategiaId]
      );

      const updateResult = await query(
        `SELECT 
          e.*, 
          u.nombre as creado_por_nombre,
          u2.nombre as actualizado_por_nombre
        FROM estrategias e
        JOIN usuarios u ON e.creado_por = u.id
        LEFT JOIN usuarios u2 ON e.actualizado_por = u2.id
        WHERE e.id = ?`,
        [estrategiaId]
      );

      const updatedRow = Array.isArray(updateResult) ? updateResult[0] : null;
      if (!updatedRow) {
        return res.status(404).json({ error: 'Estrategia no encontrada' });
      }

      return res.status(200).json(updatedRow);
    }

    if (req.method === 'DELETE') {
      // Verificar si existe antes de borrar
      const [exists]: any = await query('SELECT id FROM estrategias WHERE id = ?', [estrategiaId]);
      if (!Array.isArray(exists) || exists.length === 0) {
        return res.status(404).json({ error: 'Estrategia no encontrada' });
      }

      const result: any = await query('DELETE FROM estrategias WHERE id = ?', [estrategiaId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'No se pudo eliminar la estrategia' });
      }

      return res.status(200).json({ message: 'Estrategia eliminada exitosamente' });
    }

    // Métodos no permitidos
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({
      error: `Método ${req.method} no permitido. Usa GET, PUT o DELETE.`
    });
  } catch (error) {
    console.error('Error en /api/estrategias/[id]:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * @openapi
 * /estrategias/{id}:
 *   get:
 *     tags:
 *       - Estrategias
 *     summary: Obtener una estrategia por ID
 *     description: Retorna la información detallada de una estrategia específica. Requiere autenticación.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la estrategia a obtener
 *         schema:
 *           type: integer
 *           example: 2
 *     responses:
 *       200:
 *         description: Estrategia obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 2
 *                 titulo:
 *                   type: string
 *                   example: "Plan de digitalización institucional"
 *                 descripcion:
 *                   type: string
 *                   example: "Implementar herramientas digitales para optimizar procesos administrativos."
 *                 creado_por:
 *                   type: integer
 *                   example: 1
 *                 actualizado_por:
 *                   type: integer
 *                   nullable: true
 *                 creado_por_nombre:
 *                   type: string
 *                   example: "Ana Rodríguez"
 *                 actualizado_por_nombre:
 *                   type: string
 *                   example: "Carlos Pérez"
 *                 fecha_creacion:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-10-18T10:30:00Z"
 *                 fecha_actualizacion:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Estrategia no encontrada
 *       500:
 *         description: Error interno del servidor
 *
 *   put:
 *     tags:
 *       - Estrategias
 *     summary: Actualizar una estrategia existente
 *     description: Permite modificar el título y la descripción de una estrategia. Solo accesible para usuarios con rol **admin** o **editor**.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la estrategia a actualizar
 *         schema:
 *           type: integer
 *           example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - descripcion
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: "Actualización del plan de digitalización"
 *               descripcion:
 *                 type: string
 *                 example: "Nueva fase del plan con enfoque en automatización de reportes."
 *     responses:
 *       200:
 *         description: Estrategia actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 2
 *                 titulo:
 *                   type: string
 *                   example: "Actualización del plan de digitalización"
 *                 descripcion:
 *                   type: string
 *                   example: "Nueva fase del plan con enfoque en automatización de reportes."
 *                 actualizado_por_nombre:
 *                   type: string
 *                   example: "Carlos Pérez"
 *       400:
 *         description: Datos inválidos o campos requeridos faltantes
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (rol no permitido)
 *       404:
 *         description: Estrategia no encontrada
 *       500:
 *         description: Error interno del servidor
 *   delete:
 *     tags:
 *       - Estrategias
 *     summary: Eliminar una estrategia
 *     description: Elimina permanentemente una estrategia. Solo accesible para usuarios con rol **admin** o **editor**.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la estrategia a eliminar
 *         schema:
 *           type: integer
 *           example: 2
 *     responses:
 *       200:
 *         description: Estrategia eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Estrategia eliminada exitosamente"
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (rol no permitido)
 *       404:
 *         description: Estrategia no encontrada o ya eliminada
 *       500:
 *         description: Error interno del servidor
 */