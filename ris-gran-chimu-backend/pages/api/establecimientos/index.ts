// backend/pages/api/establecimientos/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { authenticate } from '../../../lib/middleware/auth';
import { requirePermission } from '../../../lib/middleware/requirePermission';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authError = authenticate(req, res);
  if (authError) return authError;

  if (req.method === 'POST') {
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
        ORDER BY e.fecha_creacion DESC
      `);

      const rows = Array.isArray(result) ? result : [];
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { nombre, direccion, telefono, map_link } = req.body;
      const userId = (req as any).user.id;

      if (!nombre || !direccion || !telefono || !map_link) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }

      await query(
        `INSERT INTO establecimientos 
        (nombre, direccion, telefono, map_link, activo, creado_por) 
        VALUES (?, ?, ?, ?, TRUE, ?)`,
        [nombre, direccion, telefono, map_link, userId]
      );

      const insertResult = await query(
        `SELECT 
          e.*, 
          u.nombre AS creado_por_nombre 
        FROM establecimientos e
        JOIN usuarios u ON e.creado_por = u.id
        WHERE e.id = LAST_INSERT_ID()`
      );

      const newRow = Array.isArray(insertResult) ? insertResult[0] : null;
      if (!newRow) {
        return res.status(500).json({ error: 'No se pudo crear el establecimiento' });
      }

      return res.status(201).json(newRow);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end();
  } catch (error) {
    console.error('Error en /api/establecimientos:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * @openapi
 * /establecimientos:
 *   get:
 *     tags:
 *       - Establecimientos
 *     summary: Listar establecimientos
 *     description: Obtiene una lista de todos los establecimientos registrados, incluyendo quién los creó y actualizó.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de establecimientos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                     example: Restaurante El Buen Sabor
 *                   direccion:
 *                     type: string
 *                     example: Calle 123 #45-67, Lima
 *                   telefono:
 *                     type: string
 *                     example: "+51 999 888 777"
 *                   map_link:
 *                     type: string
 *                     example: "https://goo.gl/maps/abc123"
 *                   creado_por:
 *                     type: integer
 *                   actualizado_por:
 *                     type: integer
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
 *       - Establecimientos
 *     summary: Crear un nuevo establecimiento
 *     description: Permite crear un nuevo establecimiento. Solo accesible para roles **admin** y **editor**.
 *     security:
 *       - bearerAuth: []
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
 *                 example: Cafetería Central
 *               direccion:
 *                 type: string
 *                 example: Av. Siempre Viva 742
 *               telefono:
 *                 type: string
 *                 example: "+34 600 123 456"
 *               map_link:
 *                 type: string
 *                 example: "https://goo.gl/maps/xyz789"
 *     responses:
 *       201:
 *         description: Establecimiento creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 direccion:
 *                   type: string
 *                 telefono:
 *                   type: string
 *                 map_link:
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