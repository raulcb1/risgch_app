// backend/services/authService.ts
import { findUserByEmail } from '../models/User';
import { comparePassword } from '../utils/hash';
import { generateToken } from '../lib/jwt';

export async function loginUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) return null;

  const { password: _, ...safeUser } = user;
  return {
    user: safeUser,
    token: generateToken({ id: user.id, email: user.email, role: user.rol }),
  };
}