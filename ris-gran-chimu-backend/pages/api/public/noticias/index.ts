// backend/pages/api/public/noticias/index.ts
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
        n.id,
        n.titulo,
        n.descripcion,
        n.imagen_url,
        n.fecha,
        n.link_facebook
      FROM noticias n
      ORDER BY n.id DESC
    `);

    // Devolvemos solo los datos solicitados
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener noticias públicas:', error);
    return res.status(500).json({
      error: 'No se pudieron cargar las noticias'
    });
  }
}

/**
 * @openapi
 * /public/noticias:
 *   get:
 *     tags:
 *       - Public
 *     summary: Listar noticias públicas
 *     description: Retorna las noticias institucionales filtradas para el público general.
 *     responses:
 *       200:
 *         description: Lista de noticias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PublicNoticia'
 *       500:
 *         description: Error al obtener noticias
 */