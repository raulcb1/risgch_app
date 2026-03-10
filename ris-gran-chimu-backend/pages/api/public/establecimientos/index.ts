// backend/pages/api/public/establecimientos/index.ts
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
    // Consulta principal: establecimientos + servicios activos
    const rows = await query(`
      SELECT 
        e.id,
        e.nombre,
        e.direccion,
        e.telefono,
        e.map_link,
        s.id AS servicio_id,
        s.nombre AS servicio_nombre,
        s.descripcion AS servicio_descripcion
      FROM establecimientos e
      LEFT JOIN establecimientos_servicios es 
        ON e.id = es.establecimiento_id AND es.activo = TRUE
      LEFT JOIN servicios s 
        ON es.servicio_id = s.id AND s.activo = TRUE
      WHERE e.activo = 1
      ORDER BY e.nombre, s.nombre
    `) as any[];

    // Si no hay resultados
    if (!Array.isArray(rows)) {
      return res.status(200).json([]);
    }

    // Agrupar servicios por establecimiento
    const map = new Map();

    rows.forEach(row => {
      const key = row.id;

      if (!map.has(key)) {
        map.set(key, {
          id: row.id,
          nombre: row.nombre,
          direccion: row.direccion,
          telefono: row.telefono,
          map_link: row.map_link,
          servicios: []
        });
      }

      // Solo agregar servicio si existe (no NULL)
      if (row.servicio_id) {
        map.get(key).servicios.push({
          id: row.servicio_id,
          nombre: row.servicio_nombre,
          descripcion: row.servicio_descripcion
        });
      }
    });

    // Convertir a array
    const result = Array.from(map.values());

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al obtener establecimientos públicos:', error);
    return res.status(500).json({
      error: 'No se pudieron cargar los establecimientos'
    });
  }
}

/**
 * @openapi
 * /public/establecimientos:
 *   get:
 *     tags:
 *       - Public
 *     summary: Listar establecimientos públicos con sus servicios activos
 *     description: Retorna una lista de establecimientos públicos, incluyendo sus servicios activos asociados. No requiere autenticación.
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
 *                     example: 1
 *                   nombre:
 *                     type: string
 *                     example: "Centro de Salud Primavera"
 *                   direccion:
 *                     type: string
 *                     example: "Av. Los Laureles 456, Trujillo"
 *                   telefono:
 *                     type: string
 *                     example: "+51 987 654 321"
 *                   map_link:
 *                     type: string
 *                     example: "https://goo.gl/maps/abcd1234"
 *                   servicios:
 *                     type: array
 *                     description: Lista de servicios activos del establecimiento
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 2
 *                         nombre:
 *                           type: string
 *                           example: "Atención Médica General"
 *                         descripcion:
 *                           type: string
 *                           example: "Consultas médicas generales con personal calificado"
 *       405:
 *         description: Método no permitido (solo GET)
 *       500:
 *         description: Error interno del servidor
 */
