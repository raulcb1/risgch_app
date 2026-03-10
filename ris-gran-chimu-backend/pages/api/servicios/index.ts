// backend/pages/api/servicios/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { authenticate } from '../../../lib/middleware/auth';
import { requirePermission } from '../../../lib/middleware/requirePermission';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authError = authenticate(req, res);
  if (authError) return authError;

  if (req.method === 'POST') {
    const roleError = await requirePermission('manage_servicios')(req, res);
    if (roleError) return roleError;
  }

  try {
    if (req.method === 'GET') {
      const rows = await query(`
        SELECT 
          s.*,
          u.nombre as creado_por_nombre,
          u2.nombre as actualizado_por_nombre
        FROM servicios s
        JOIN usuarios u ON s.creado_por = u.id
        LEFT JOIN usuarios u2 ON s.actualizado_por = u2.id
        ORDER BY s.fecha_creacion DESC
      `);
      return res.status(200).json(Array.isArray(rows) ? rows : []);
    }

    if (req.method === 'POST') {
      const { nombre, descripcion } = req.body;
      const userId = (req as any).user.id;

      if (!nombre || !descripcion) {
        return res.status(400).json({ error: 'Campos requeridos faltantes' });
      }

      await query(
        `INSERT INTO servicios 
        (nombre, descripcion, activo, creado_por) 
        VALUES (?, ?, TRUE, ?)`,
        [nombre, descripcion, userId]
      );

      const result = await query(
        `SELECT 
          s.*, 
          u.nombre as creado_por_nombre 
        FROM servicios s
        JOIN usuarios u ON s.creado_por = u.id
        WHERE s.id = LAST_INSERT_ID()`
      );

      const newRow = Array.isArray(result) ? result[0] : null;
      if (!newRow) return res.status(500).json({ error: 'No se pudo crear el servicio' });

      return res.status(201).json(newRow);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end();
  } catch (error) {
    console.error('Error en /api/servicios:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * @openapi
 * /servicios:
 *   get:
 *     tags:
 *       - Servicios
 *     summary: Listar servicios
 *     description: Obtiene una lista de todos los servicios disponibles, incluyendo información sobre quién los creó y actualizó.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de servicios obtenida exitosamente
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
 *                   nombre:
 *                     type: string
 *                     example: "Consultoría Empresarial"
 *                   descripcion:
 *                     type: string
 *                     example: "Asesoramiento especializado en optimización de procesos internos."
 *                   activo:
 *                     type: boolean
 *                     example: true
 *                   creado_por:
 *                     type: integer
 *                     example: 2
 *                   actualizado_por:
 *                     type: integer
 *                     nullable: true
 *                   fecha_creacion:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-10-20T09:00:00Z"
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
 *       - Servicios
 *     summary: Crear un nuevo servicio
 *     description: Crea un nuevo servicio. Solo accesible para usuarios con rol **admin** o **editor**.
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
 *               - descripcion
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Capacitación en liderazgo"
 *               descripcion:
 *                 type: string
 *                 example: "Curso intensivo de liderazgo y gestión de equipos para mandos medios."
 *     responses:
 *       201:
 *         description: Servicio creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 10
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
 *       400:
 *         description: Faltan campos requeridos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (rol no permitido)
 *       500:
 *         description: Error interno del servidor
 */