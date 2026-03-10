// backend/pages/api/estrategias/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { authenticate } from '../../../lib/middleware/auth';
import { requirePermission } from '../../../lib/middleware/requirePermission';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authError = authenticate(req, res);
  if (authError) return authError;

  if (req.method === 'POST') {
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
        ORDER BY e.fecha_creacion DESC
      `);

      const rows = Array.isArray(result) ? result : [];
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { titulo, descripcion } = req.body;
      const userId = (req as any).user.id;

      if (!titulo || !descripcion) {
        return res.status(400).json({ error: 'Título y descripción son obligatorios' });
      }

      await query(
        `INSERT INTO estrategias (titulo, descripcion, creado_por) VALUES (?, ?, ?)`,
        [titulo, descripcion, userId]
      );

      const insertResult = await query(
        `SELECT 
          e.*, 
          u.nombre as creado_por_nombre 
        FROM estrategias e
        JOIN usuarios u ON e.creado_por = u.id
        WHERE e.id = LAST_INSERT_ID()`
      );

      const newRow = Array.isArray(insertResult) ? insertResult[0] : null;
      if (!newRow) {
        return res.status(500).json({ error: 'No se pudo crear la estrategia' });
      }

      return res.status(201).json(newRow);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end();
  } catch (error) {
    console.error('Error en /api/estrategias:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * @openapi
 * /estrategias:
 *   get:
 *     tags:
 *       - Estrategias
 *     summary: Listar estrategias
 *     description: Obtiene una lista de todas las estrategias registradas, incluyendo información sobre quién las creó y actualizó.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estrategias obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   titulo:
 *                     type: string
 *                     example: "Estrategia de marketing digital"
 *                   descripcion:
 *                     type: string
 *                     example: "Plan integral para posicionar la marca en redes sociales"
 *                   creado_por:
 *                     type: integer
 *                     example: 2
 *                   actualizado_por:
 *                     type: integer
 *                     nullable: true
 *                   fecha_creacion:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-10-15T13:45:00Z"
 *                   fecha_actualizacion:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   creado_por_nombre:
 *                     type: string
 *                     example: "Juan Pérez"
 *                   actualizado_por_nombre:
 *                     type: string
 *                     example: "María López"
 *       401:
 *         description: No autorizado (token faltante o inválido)
 *       500:
 *         description: Error interno del servidor
 *
 *   post:
 *     tags:
 *       - Estrategias
 *     summary: Crear una nueva estrategia
 *     description: Permite registrar una nueva estrategia. Solo accesible para roles **admin** y **editor**.
 *     security:
 *       - bearerAuth: []
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
 *                 example: "Estrategia de crecimiento 2025"
 *               descripcion:
 *                 type: string
 *                 example: "Definir acciones clave para expandir la operación en nuevas regiones"
 *     responses:
 *       201:
 *         description: Estrategia creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 10
 *                 titulo:
 *                   type: string
 *                 descripcion:
 *                   type: string
 *                 creado_por_nombre:
 *                   type: string
 *                   example: "Juan Pérez"
 *       400:
 *         description: Faltan campos obligatorios
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (rol no permitido)
 *       500:
 *         description: Error interno del servidor
 */