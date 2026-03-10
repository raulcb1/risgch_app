// backend/pages/api/noticias/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { authenticate } from '../../../lib/middleware/auth';
import { requirePermission } from '../../../lib/middleware/requirePermission';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authError = authenticate(req, res);
  if (authError) return authError;

  const { id } = req.query;
  const noticiaId = parseInt(id as string);

  if (isNaN(noticiaId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  if (req.method === 'PUT') {
    const roleError = await requirePermission('manage_noticias')(req, res);
    if (roleError) return roleError;
  }

  try {
    if (req.method === 'GET') {
      const [row]: any = await query(`
        SELECT 
          n.*,
          u.nombre as creado_por_nombre,
          u2.nombre as actualizado_por_nombre
        FROM noticias n
        JOIN usuarios u ON n.creado_por = u.id
        LEFT JOIN usuarios u2 ON n.actualizado_por = u2.id
        WHERE n.id = ?
      `, [noticiaId]);

      if (!row) return res.status(404).json({ error: 'Noticia no encontrada' });
      return res.status(200).json(row);
    }

    if (req.method === 'PUT') {
      const { titulo, descripcion, imagen_url, link_facebook, fecha } = req.body;
      const userId = (req as any).user.id;

      await query(
        `UPDATE noticias SET 
          titulo = ?, 
          descripcion = ?, 
          imagen_url = ?, 
          link_facebook = ?, 
          fecha = ?, 
          actualizado_por = ?
        WHERE id = ?`,
        [titulo, descripcion, imagen_url, link_facebook, fecha, userId, noticiaId]
      );

      const [updatedRow]: any = await query(
        `SELECT 
          n.*, 
          u.nombre as creado_por_nombre,
          u2.nombre as actualizado_por_nombre
        FROM noticias n
        JOIN usuarios u ON n.creado_por = u.id
        LEFT JOIN usuarios u2 ON n.actualizado_por = u2.id
        WHERE n.id = ?`,
        [noticiaId]
      );

      if (!updatedRow) return res.status(404).json({ error: 'Noticia no encontrada' });

      return res.status(200).json(updatedRow);
    }

    if (req.method === 'DELETE') {
      const roleError = await requirePermission('manage_noticias')(req, res);
      if (roleError) return roleError;

      const result: any = await query('DELETE FROM noticias WHERE id = ?', [noticiaId]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Noticia no encontrada' });
      }

      return res.status(200).json({ message: 'Noticia eliminada' });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end();
  } catch (error) {
    console.error('Error en /api/noticias/[id]:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * @openapi
 * /noticias/{id}:
 *   get:
 *     tags:
 *       - Noticias
 *     summary: Obtener una noticia por ID
 *     description: Devuelve la información detallada de una noticia específica, incluyendo los datos de quién la creó y actualizó.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la noticia a obtener
 *         schema:
 *           type: integer
 *           example: 7
 *     responses:
 *       200:
 *         description: Noticia obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 7
 *                 titulo:
 *                   type: string
 *                   example: "Nueva certificación ISO para la empresa"
 *                 descripcion:
 *                   type: string
 *                   example: "Nuestra empresa obtuvo la certificación ISO 14001 en gestión ambiental."
 *                 imagen_url:
 *                   type: string
 *                   example: "https://example.com/imagenes/iso.jpg"
 *                 link_facebook:
 *                   type: string
 *                   example: "https://facebook.com/empresaISO"
 *                 fecha:
 *                   type: string
 *                   format: date
 *                   example: "2025-11-01"
 *                 creado_por:
 *                   type: integer
 *                   example: 3
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
 *         description: No autorizado
 *       404:
 *         description: Noticia no encontrada
 *       500:
 *         description: Error interno del servidor
 *
 *   put:
 *     tags:
 *       - Noticias
 *     summary: Actualizar una noticia existente
 *     description: Actualiza la información de una noticia. Solo accesible para usuarios con rol **admin** o **editor**.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la noticia a actualizar
 *         schema:
 *           type: integer
 *           example: 7
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: "Actualización de la certificación ISO"
 *               descripcion:
 *                 type: string
 *                 example: "Se renovó la certificación ISO 14001 con mejoras en los procesos internos."
 *               imagen_url:
 *                 type: string
 *                 example: "https://example.com/imagenes/iso-update.jpg"
 *               link_facebook:
 *                 type: string
 *                 example: "https://facebook.com/empresaISOupdate"
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-05"
 *     responses:
 *       200:
 *         description: Noticia actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 7
 *                 titulo:
 *                   type: string
 *                   example: "Actualización de la certificación ISO"
 *                 descripcion:
 *                   type: string
 *                   example: "Se renovó la certificación ISO 14001 con mejoras en los procesos internos."
 *                 imagen_url:
 *                   type: string
 *                   example: "https://example.com/imagenes/iso-update.jpg"
 *                 link_facebook:
 *                   type: string
 *                   example: "https://facebook.com/empresaISOupdate"
 *                 fecha:
 *                   type: string
 *                   format: date
 *                   example: "2025-11-05"
 *                 actualizado_por_nombre:
 *                   type: string
 *                   example: "Admin General"
 *       400:
 *         description: ID inválido o datos incompletos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (rol no permitido)
 *       404:
 *         description: Noticia no encontrada
 *       500:
 *         description: Error interno del servidor
 *
 *   delete:
 *     tags:
 *       - Noticias
 *     summary: Eliminar una noticia
 *     description: Elimina una noticia del sistema. Solo accesible para usuarios con rol **admin** o **editor**.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la noticia a eliminar
 *         schema:
 *           type: integer
 *           example: 7
 *     responses:
 *       200:
 *         description: Noticia eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Noticia eliminada"
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (rol no permitido)
 *       404:
 *         description: Noticia no encontrada
 *       500:
 *         description: Error interno del servidor
 */
