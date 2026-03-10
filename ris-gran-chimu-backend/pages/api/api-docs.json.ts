// backend/pages/api/api-docs.json.ts
import { NextApiRequest, NextApiResponse } from 'next';
import swaggerJsdoc from 'swagger-jsdoc';
import options from '../../swaggerDocs'; // Ruta correcta

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const specs = swaggerJsdoc(options);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(specs);
  } catch (error) {
    console.error('Error generando specs de Swagger:', error);
    res.status(500).json({ error: 'No se pudo generar la documentación' });
  }
}