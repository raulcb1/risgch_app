// backend/pages/api/public/estrategias/index.ts
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
    const result = await query(`
      SELECT 
        e.titulo,
        e.descripcion
      FROM estrategias e
      ORDER BY e.fecha_creacion DESC
    `);

    // Aseguramos que sea un array
    const rows = Array.isArray(result) ? result : [];

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener estrategias públicas:', error);
    return res.status(500).json({
      error: 'No se pudieron cargar las estrategias'
    });
  }
}

/**
 * @openapi
 * /public/estrategias:
 *   get:
 *     tags:
 *       - Public
 *     summary: Listar estrategias públicas
 *     description: Retorna una lista de estrategias disponibles públicamente. No requiere autenticación.
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
 *                   titulo:
 *                     type: string
 *                     example: "Estrategia de Salud Familiar"
 *                   descripcion:
 *                     type: string
 *                     example: "Fortalecer la atención primaria con enfoque familiar y comunitario."
 *       405:
 *         description: Método no permitido (solo GET)
 *       500:
 *         description: Error interno del servidor
 */
