// backend/lib/middleware/requireRole.ts
import { NextApiRequest, NextApiResponse } from 'next';

export function requireRole(allowedRoles: string[]) {
  return (req: NextApiRequest, res: NextApiResponse) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Acceso denegado. Usuario no autenticado.' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}.`
      });
    }

    return null; // Permiso concedido
  };
}