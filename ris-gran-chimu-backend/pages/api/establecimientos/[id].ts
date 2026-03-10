// backend/pages/api/establecimientos/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { authenticate } from '../../../lib/middleware/auth';
import { requirePermission } from '../../../lib/middleware/requirePermission';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authError = authenticate(req, res);
  if (authError) return authError;

  const { id } = req.query;
  const establecimientoId = parseInt(id as string);

  if (isNaN(establecimientoId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  // Solo admin/editor pueden modificar
  if (req.method === 'PUT') {
    const roleError = await requirePermission('manage_establecimientos')(req, res);
    if (roleError) return roleError;
  }

  try {
    if (req.method === 'GET') {
      const result = await query(`
        SELECT 
          e.id,
          e.nombre,
          e.direccion,
          e.telefono,
          e.map_link,
          e.activo,
          e.creado_por,
          e.fecha_creacion,
          e.actualizado_por,
          e.fecha_actualizacion,
          u.nombre AS creado_por_nombre,
          u2.nombre AS actualizado_por_nombre
        FROM establecimientos e
        JOIN usuarios u ON e.creado_por = u.id
        LEFT JOIN usuarios u2 ON e.actualizado_por = u2.id
        WHERE e.id = ?
      `, [establecimientoId]);

      const row = Array.isArray(result) ? result[0] : null;
      if (!row) {
        return res.status(404).json({ error: 'Establecimiento no encontrado' });
      }
      return res.status(200).json(row);
    }

    if (req.method === 'PUT') {
      const { nombre, direccion, telefono, map_link, activo } = req.body;
      const userId = (req as any).user.id;

      if (!nombre || !direccion || !telefono || !map_link) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }

      // Validar y convertir `activo` a booleano
      const isActive = activo !== undefined ? Boolean(activo) : true;

      await query(
        `UPDATE establecimientos SET 
          nombre = ?, 
          direccion = ?, 
          telefono = ?, 
          map_link = ?, 
          activo = ?, 
          actualizado_por = ?
        WHERE id = ?`,
        [nombre, direccion, telefono, map_link, isActive ? 1 : 0, userId, establecimientoId]
      );

      const updateResult = await query(
        `SELECT 
          e.*,
          u.nombre AS creado_por_nombre,
          u2.nombre AS actualizado_por_nombre
        FROM establecimientos e
        JOIN usuarios u ON e.creado_por = u.id
        LEFT JOIN usuarios u2 ON e.actualizado_por = u2.id
        WHERE e.id = ?`,
        [establecimientoId]
      );

      const updatedRow = Array.isArray(updateResult) ? updateResult[0] : null;
      if (!updatedRow) {
        return res.status(404).json({ error: 'Establecimiento no encontrado' });
      }

      return res.status(200).json(updatedRow);
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({
      error: 'Método no permitido. Usa PUT con activo=false para desactivar.'
    });
  } catch (error) {
    console.error('Error en /api/establecimientos/[id]:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * @openapi
 * /establecimientos/{id}:
 *   get:
 *     tags:
 *       - Establecimientos
 *     summary: Obtener un establecimiento por ID
 *     description: Retorna los detalles de un establecimiento específico. Requiere autenticación.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del establecimiento a obtener
 *         schema:
 *           type: integer
 *           example: 3
 *     responses:
 *       200:
 *         description: Establecimiento obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 3
 *                 nombre:
 *                   type: string
 *                   example: "RIS - Sede Central"
 *                 direccion:
 *                   type: string
 *                   example: "Av. Libertad 456, Trujillo"
 *                 telefono:
 *                   type: string
 *                   example: "+51 999 999 999"
 *                 map_link:
 *                   type: string
 *                   example: "https://goo.gl/maps/abcd1234"
 *                 creado_por:
 *                   type: integer
 *                   example: 1
 *                 actualizado_por:
 *                   type: integer
 *                   nullable: true
 *                 creado_por_nombre:
 *                   type: string
 *                   example: "María González"
 *                 actualizado_por_nombre:
 *                   type: string
 *                   example: "Luis Ramírez"
 *                 fecha_creacion:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-09-18T14:00:00Z"
 *                 fecha_actualizacion:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Establecimiento no encontrado
 *       500:
 *         description: Error interno del servidor
 *
 *   put:
 *     tags:
 *       - Establecimientos
 *     summary: Actualizar un establecimiento existente
 *     description: Permite modificar los datos de un establecimiento. Solo accesible para usuarios con rol **admin** o **editor**.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del establecimiento a actualizar
 *         schema:
 *           type: integer
 *           example: 3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - direccion
 *               - telefono
 *               - map_link
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "RIS - Sede Central"
 *               direccion:
 *                 type: string
 *                 example: "Av. Libertad 456, Trujillo"
 *               telefono:
 *                 type: string
 *                 example: "+51 999 999 999"
 *               map_link:
 *                 type: string
 *                 example: "https://goo.gl/maps/xyz789"
 *     responses:
 *       200:
 *         description: Establecimiento actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 3
 *                 nombre:
 *                   type: string
 *                   example: "RIS - Sede Central"
 *                 direccion:
 *                   type: string
 *                   example: "Av. Libertad 456, Trujillo"
 *                 telefono:
 *                   type: string
 *                   example: "+51 999 999 999"
 *                 map_link:
 *                   type: string
 *                   example: "https://goo.gl/maps/xyz789"
 *                 actualizado_por_nombre:
 *                   type: string
 *                   example: "Luis Ramírez"
 *       400:
 *         description: Datos inválidos o faltantes
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (rol no permitido)
 *       404:
 *         description: Establecimiento no encontrado
 *       500:
 *         description: Error interno del servidor
 *
*/
