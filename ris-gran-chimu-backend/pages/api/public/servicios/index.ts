// backend/pages/api/public/servicios/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitimos GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  try {
    const rows = await query(`
      SELECT 
        s.nombre,
        s.descripcion
      FROM servicios s
      WHERE s.activo = 1
      ORDER BY s.fecha_creacion DESC
    `);

    // Aseguramos que sea un array
    const servicios = Array.isArray(rows) ? rows : [];

    return res.status(200).json(servicios);
  } catch (error) {
    console.error('Error al obtener servicios públicos:', error);
    return res.status(500).json({
      error: 'No se pudieron cargar los servicios'
    });
  }
}

/**
 * @openapi
 * /public/servicios:
 *   get:
 *     tags:
 *       - Public
 *     summary: Listar servicios públicos
 *     description: Retorna una lista de servicios activos disponibles públicamente. No requiere autenticación.
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
 *                   nombre:
 *                     type: string
 *                     example: "Atención Médica General"
 *                   descripcion:
 *                     type: string
 *                     example: "Consultas médicas generales para todos los usuarios registrados."
 *       405:
 *         description: Método no permitido (solo GET)
 *       500:
 *         description: Error interno del servidor
 */
