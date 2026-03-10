// backend/pages/api/normas/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/middleware/auth';
import { requirePermission } from '../../../lib/middleware/requirePermission';
import { getNormaById, updateNorma } from '../../../models/Norma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;
  const normaId = parseInt(id as string);

  if (isNaN(normaId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const authError = authenticate(req, res);
  if (authError) return authError;

  if (req.method === 'GET') {
    const norma = await getNormaById(normaId);
    if (!norma) {
      return res.status(404).json({ error: 'Norma no encontrada' });
    }
    return res.status(200).json(norma);
  }

  if (req.method === 'PUT') {
    const roleError = await requirePermission('manage_normas')(req, res);
    if (roleError) return roleError;

    const userId = (req as any).user.id;

    try {
      const updated = await updateNorma(normaId, req.body, userId);
      if (!updated) {
        return res.status(404).json({ error: 'Norma no encontrada' });
      }
      return res.status(200).json(updated);
    } catch (error: any) {
      console.error('Error al actualizar norma:', error.message);
      return res.status(400).json({ error: error.message });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  res.status(405).json({ error: 'Método no permitido' });
}

/**
 * @openapi
 * /normas/{id}:
 *   get:
 *     tags:
 *       - Normas
 *     summary: Obtener una norma por ID
 *     description: Retorna los detalles de una norma específica. Requiere autenticación.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la norma a obtener
 *         schema:
 *           type: integer
 *           example: 4
 *     responses:
 *       200:
 *         description: Norma obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 4
 *                 titulo:
 *                   type: string
 *                   example: "Norma ISO 9001:2015"
 *                 descripcion:
 *                   type: string
 *                   example: "Estándar internacional para sistemas de gestión de calidad."
 *                 categoria:
 *                   type: string
 *                   example: "Gestión de Calidad"
 *                 fecha_publicacion:
 *                   type: string
 *                   format: date
 *                   example: "2015-09-23"
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
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado (token faltante o inválido)
 *       404:
 *         description: Norma no encontrada
 *       500:
 *         description: Error interno del servidor
 *
 *   put:
 *     tags:
 *       - Normas
 *     summary: Actualizar una norma existente
 *     description: Actualiza la información de una norma. Solo accesible para usuarios con rol **admin** o **editor**.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la norma a actualizar
 *         schema:
 *           type: integer
 *           example: 4
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: "Norma ISO 9001:2025"
 *               descripcion:
 *                 type: string
 *                 example: "Versión actualizada del estándar ISO para gestión de calidad."
 *               categoria:
 *                 type: string
 *                 example: "Gestión de Calidad"
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Norma actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 4
 *                 titulo:
 *                   type: string
 *                   example: "Norma ISO 9001:2025"
 *                 descripcion:
 *                   type: string
 *                   example: "Versión actualizada del estándar ISO para gestión de calidad."
 *                 categoria:
 *                   type: string
 *                   example: "Gestión de Calidad"
 *                 activo:
 *                   type: boolean
 *                   example: true
 *                 actualizado_por:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Datos inválidos o error en la actualización
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (rol no permitido)
 *       404:
 *         description: Norma no encontrada
 *       500:
 *         description: Error interno del servidor
 */
