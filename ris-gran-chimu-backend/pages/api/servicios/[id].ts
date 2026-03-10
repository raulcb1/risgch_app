// backend/pages/api/servicios/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { authenticate } from '../../../lib/middleware/auth';
import { requirePermission } from '../../../lib/middleware/requirePermission';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authError = authenticate(req, res);
  if (authError) return authError;

  const { id } = req.query;
  const servicioId = parseInt(id as string);

  if (isNaN(servicioId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  if (req.method === 'PUT') {
    const roleError = await requirePermission('manage_servicios')(req, res);
    if (roleError) return roleError;
  }

  try {
    if (req.method === 'GET') {
      const result = await query(`
        SELECT 
          s.*,
          u.nombre as creado_por_nombre,
          u2.nombre as actualizado_por_nombre
        FROM servicios s
        JOIN usuarios u ON s.creado_por = u.id
        LEFT JOIN usuarios u2 ON s.actualizado_por = u2.id
        WHERE s.id = ?
      `, [servicioId]);

      const row = Array.isArray(result) ? result[0] : null;
      if (!row) return res.status(404).json({ error: 'Servicio no encontrado' });
      return res.status(200).json(row);
    }

    if (req.method === 'PUT') {
      const { nombre, descripcion, activo } = req.body;
      const userId = (req as any).user.id;

      // Validar y convertir `activo` a booleano, default true si es undefined
      const isActive = activo !== undefined ? Boolean(activo) : true;

      await query(
        `UPDATE servicios SET 
          nombre = ?, 
          descripcion = ?, 
          activo = ?, 
          actualizado_por = ?
        WHERE id = ?`,
        [nombre, descripcion, isActive ? 1 : 0, userId, servicioId]
      );

      const result = await query(
        `SELECT 
          s.*, 
          u.nombre as creado_por_nombre,
          u2.nombre as actualizado_por_nombre
        FROM servicios s
        JOIN usuarios u ON s.creado_por = u.id
        LEFT JOIN usuarios u2 ON s.actualizado_por = u2.id
        WHERE s.id = ?`,
        [servicioId]
      );

      const updatedRow = Array.isArray(result) ? result[0] : null;
      if (!updatedRow) return res.status(404).json({ error: 'Servicio no encontrado' });

      return res.status(200).json(updatedRow);
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end();
  } catch (error) {
    console.error('Error en /api/servicios/[id]:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * @openapi
 * /servicios/{id}:
 *   get:
 *     tags:
 *       - Servicios
 *     summary: Obtener un servicio por ID
 *     description: Retorna la información detallada de un servicio específico, incluyendo los datos de quién lo creó y actualizó.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del servicio a obtener
 *         schema:
 *           type: integer
 *           example: 5
 *     responses:
 *       200:
 *         description: Servicio obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 5
 *                 nombre:
 *                   type: string
 *                   example: "Consultoría Empresarial"
 *                 descripcion:
 *                   type: string
 *                   example: "Asesoramiento especializado en optimización de procesos internos."
 *                 activo:
 *                   type: boolean
 *                   example: true
 *                 creado_por:
 *                   type: integer
 *                   example: 2
 *                 actualizado_por:
 *                   type: integer
 *                   nullable: true
 *                 fecha_creacion:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-10-20T09:00:00Z"
 *                 fecha_actualizacion:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 creado_por_nombre:
 *                   type: string
 *                   example: "Juan Pérez"
 *                 actualizado_por_nombre:
 *                   type: string
 *                   example: "María López"
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado (token faltante o inválido)
 *       404:
 *         description: Servicio no encontrado
 *       500:
 *         description: Error interno del servidor
 *
 *   put:
 *     tags:
 *       - Servicios
 *     summary: Actualizar un servicio existente
 *     description: Actualiza los datos de un servicio existente. Solo accesible para usuarios con rol **admin** o **editor**.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del servicio a actualizar
 *         schema:
 *           type: integer
 *           example: 5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - descripcion
 *               - activo
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Consultoría Estratégica"
 *               descripcion:
 *                 type: string
 *                 example: "Servicios de consultoría para mejora organizacional y planificación estratégica."
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Servicio actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 5
 *                 nombre:
 *                   type: string
 *                 descripcion:
 *                   type: string
 *                 activo:
 *                   type: boolean
 *                   example: true
 *                 creado_por_nombre:
 *                   type: string
 *                   example: "Juan Pérez"
 *                 actualizado_por_nombre:
 *                   type: string
 *                   example: "María López"
 *       400:
 *         description: ID inválido o datos incompletos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (rol no permitido)
 *       404:
 *         description: Servicio no encontrado
 *       500:
 *         description: Error interno del servidor
 */