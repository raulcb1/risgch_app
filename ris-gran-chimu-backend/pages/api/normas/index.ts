// backend/pages/api/normas/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/middleware/auth';
import { requirePermission } from '../../../lib/middleware/requirePermission';
import { getAllNormas, createNorma } from '../../../models/Norma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const authError = authenticate(req, res);
  if (authError) return authError;

  if (req.method === 'GET') {
    try {
      const normas = await getAllNormas();
      return res.status(200).json(normas);
    } catch (error) {
      console.error('Error al obtener normas:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  if (req.method === 'POST') {
    const roleError = await requirePermission('manage_normas')(req, res);
    if (roleError) return roleError;

    const { /* todos tus campos */ } = req.body;
    const userId = (req as any).user.id;

    try {
      const nuevaNorma = await createNorma(req.body, userId);
      return res.status(201).json(nuevaNorma);
    } catch (error) {
      console.error('Error al crear norma:', error);
      return res.status(500).json({ error: 'No se pudo crear la norma' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}

/**
 * @openapi
 * /normas:
 *   get:
 *     tags:
 *       - Normas
 *     summary: Listar todas las normas
 *     description: Obtiene la lista completa de documentos normativos registrados. Incluye información detallada del tipo de norma y usuarios responsables.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de normas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Norma'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 *
 *   post:
 *     tags:
 *       - Normas
 *     summary: Crear una nueva norma
 *     description: Registra un nuevo documento normativo. Solo accesible para administradores y editores.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cod_tipo_norma
 *               - nombre_norma
 *               - descripcion
 *             properties:
 *               cod_tipo_norma:
 *                 type: integer
 *                 example: 1
 *               nombre_norma:
 *                 type: string
 *                 example: "RD N° 045-2025-RIS-GC"
 *               descripcion:
 *                 type: string
 *                 example: "Aprobar cronograma de actividades de salud ambiental."
 *               fecha_norma:
 *                 type: string
 *                 format: date
 *                 example: "2025-02-01"
 *               archivo:
 *                 type: string
 *                 example: "https://midominio.com/archivos/rd045.pdf"
 *               activo:
 *                 type: integer
 *                 enum: [0, 1]
 *                 default: 1
 *     responses:
 *       201:
 *         description: Norma creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Norma'
 *       400:
 *         description: Datos inválidos o faltantes
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 *       500:
 *         description: Error interno del servidor
 */
