// backend/pages/api/normas/tipos/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getDbConnection } from '../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.setHeader('Allow', ['GET']), res.status(405).end();
  }

  try {
    const conn = await getDbConnection();
    const [rows] = await conn.query(`
      SELECT 
        cod_tipo_norma,
        nombre,
        sufijo
      FROM normas_tipo
      ORDER BY cod_tipo_norma
    `);

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener tipos de normas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}