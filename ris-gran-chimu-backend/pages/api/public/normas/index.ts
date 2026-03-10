// pages/api/public/normas/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getDbConnection } from '../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.setHeader('Allow', ['GET']), res.status(405).end();
  }

  try {
    const conn = await getDbConnection();
    const [rows] = await conn.query(`
      SELECT 
        id_norma,
        anho,
        nombre_norma,
        descripcion,
        fecha_norma,
        archivo
      FROM normas 
      WHERE activo = 1 
      ORDER BY anho DESC, fecha_norma DESC
    `);

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener normas públicas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * @openapi
 * /public/normas:
 *   get:
 *     tags:
 *       - Public
 *     summary: Listar normas públicas
 *     description: Retorna una lista de normas activas disponibles públicamente. No requiere autenticación.
 *     responses:
 *       200:
 *         description: Lista de normas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PublicNorma'
 *       405:
 *         description: Método no permitido (solo GET)
 *       500:
 *         description: Error interno del servidor
 */

export const config = { api: { bodyParser: true } };