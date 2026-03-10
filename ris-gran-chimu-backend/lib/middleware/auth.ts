// backend/lib/middleware/auth.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../jwt';

export function authenticate(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }

  // Adjuntar usuario al request
  (req as any).user = decoded;
  return null; // éxito
}