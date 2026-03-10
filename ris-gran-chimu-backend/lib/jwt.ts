// backend/lib/jwt.ts
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

// Asegura que las variables de entorno estén definidas
if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
  throw new Error('JWT_SECRET and JWT_EXPIRES_IN must be defined in the environment variables.');
}

// Usamos aserción de tipo para indicar que son strings
const secret: Secret = process.env.JWT_SECRET;

// Aserción de tipo para `expiresIn`
const expiresIn = process.env.JWT_EXPIRES_IN as SignOptions['expiresIn'];

export function generateToken(payload: { id: number; role: string; email: string }) {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string): { id: number; role: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, secret);
    // Aseguramos que es del tipo esperado
    if (typeof decoded === 'object' && 'id' in decoded && 'role' in decoded && 'email' in decoded) {
      return decoded as { id: number; role: string; email: string };
    }
    return null;
  } catch (error) {
    console.error('Token inválido o expirado:', error);
    return null;
  }
}