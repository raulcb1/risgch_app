// backend/pages/api/auth/verify.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/middleware/auth'; // Ya verifica JWT
import { getDbConnection } from '../../../lib/db';
import { comparePassword } from '../../../utils/hash';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authError = authenticate(req, res);
  if (authError) return authError;

  const user = (req as any).user; // Viene del token: id, email, rol
  const { password } = req.body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Contraseña requerida' });
  }

  try {
    // Obtener el usuario real de la DB (con password hasheada)
    const conn = await getDbConnection();
    const [rows] = await conn.execute('SELECT password FROM usuarios WHERE id = ?', [user.id]);
    const results = rows as { password: string }[];

    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const hashedPassword = results[0].password;
    const isValid = await comparePassword(password, hashedPassword);

    return res.status(200).json({ valid: isValid });
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}