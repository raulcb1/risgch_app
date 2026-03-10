// backend/pages/api/noticias/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { authenticate } from '../../../lib/middleware/auth';
import { requirePermission } from '../../../lib/middleware/requirePermission';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authError = authenticate(req, res);
  if (authError) return authError;

  if (req.method === 'POST') {
    const roleError = await requirePermission('manage_noticias')(req, res);
    if (roleError) return roleError;
  }

  try {
    if (req.method === 'GET') {
      const rows: any = await query(`
        SELECT 
          n.*,
          u.nombre as creado_por_nombre,
          u2.nombre as actualizado_por_nombre
        FROM noticias n
        JOIN usuarios u ON n.creado_por = u.id
        LEFT JOIN usuarios u2 ON n.actualizado_por = u2.id
        ORDER BY n.id DESC
      `);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { titulo, descripcion, imagen_url, link_facebook, fecha } = req.body;
      const userId = (req as any).user.id;

      if (!titulo || !descripcion || !link_facebook) {
        return res.status(400).json({ error: 'Campos requeridos faltantes' });
      }

      await query(
        `INSERT INTO noticias 
        (titulo, descripcion, imagen_url, link_facebook, fecha, creado_por) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [titulo, descripcion, imagen_url, link_facebook, fecha, userId]
      );

      const [newRow]: any = await query(
        `SELECT 
          n.*, 
          u.nombre as creado_por_nombre 
        FROM noticias n
        JOIN usuarios u ON n.creado_por = u.id
        WHERE n.id = LAST_INSERT_ID()`
      );

      return res.status(201).json(newRow);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end();
  } catch (error) {
    console.error('Error en /api/noticias:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * @openapi
 * /noticias:
 *   get:
 *     tags:
 *       - Noticias
 *     summary: Listar todas las noticias
 *     description: Obtiene la lista completa de noticias institucionales para el panel administrativo.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de noticias obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Noticia'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 *
 *   post:
 *     tags:
 *       - Noticias
 *     summary: Crear una nueva noticia
 *     description: Publica una nueva noticia en el sistema.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - descripcion
 *               - link_facebook
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: "Inauguración de nuevo centro de salud"
 *               descripcion:
 *                 type: string
 *                 example: "Se llevó a cabo la ceremonia de inauguración..."
 *               imagen_url:
 *                 type: string
 *                 nullable: true
 *                 example: "https://midominio.com/imagenes/noticia1.jpg"
 *               link_facebook:
 *                 type: string
 *                 example: "https://facebook.com/noticia/id123"
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2025-02-01"
 *     responses:
 *       201:
 *         description: Noticia creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Noticia'
 *       400:
 *         description: Campos requeridos faltantes
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 *       500:
 *         description: Error interno del servidor
 */
