// backend/models/User.ts
import { getDbConnection } from '../lib/db';
import { hashPassword } from '../utils/hash';

export type UserRole = string; // Allows dynamic roles from DB

export interface User {
  id: number;
  nombre: string;
  email: string;
  password: string; // ⚠️ Solo en backend
  rol: UserRole;
  created_at: Date;
  created_by: number | null;
  updated_at: Date;
  updated_by: number | null;
  nombre_usuario_creador?: string;
  nombre_usuario_actualizador?: string; // opcional: para mostrar en frontend
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const conn = await getDbConnection();
  const [rows] = await conn.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
  const results = rows as User[];
  return results.length > 0 ? results[0] : null;
}

export async function createUser({
  nombre,
  email,
  password,
  rol,
  createdBy,
}: {
  nombre: string;
  email: string;
  password: string;
  rol: UserRole;
  createdBy: number;
}): Promise<number> {
  const hashed = await hashPassword(password);
  const conn = await getDbConnection();
  const [result] = await conn.execute(
    `INSERT INTO usuarios (nombre, email, password, rol, created_at, created_by) 
     VALUES (?, ?, ?, ?, NOW(), ?)`,
    [nombre, email, hashed, rol, createdBy]
  );
  return (result as any).insertId;
}

export async function getAllUsers(): Promise<User[]> {
  const conn = await getDbConnection();
  const [rows] = await conn.query(`
    SELECT 
      u.id,
      u.nombre,
      u.email,
      u.rol,
      u.created_at,
      u.created_by,
      u.updated_at,
      u.updated_by,
      uc.nombre AS nombre_usuario_creador,
      ua.nombre AS nombre_usuario_actualizador
    FROM usuarios u
    LEFT JOIN usuarios uc ON u.created_by = uc.id
    LEFT JOIN usuarios ua ON u.updated_by = ua.id
    ORDER BY u.created_at DESC
  `);
  return rows as User[];
}

export async function getUserById(id: number): Promise<User | null> {
  const conn = await getDbConnection();
  const [rows] = await conn.execute(`
    SELECT 
      u.id,
      u.nombre,
      u.email,
      u.rol,
      u.created_at,
      u.created_by,
      u.updated_at,
      u.updated_by,
      uc.nombre AS nombre_usuario_creador,
      ua.nombre AS nombre_usuario_actualizador
    FROM usuarios u
    LEFT JOIN usuarios uc ON u.created_by = uc.id
    LEFT JOIN usuarios ua ON u.updated_by = ua.id
    WHERE u.id = ?
  `, [id]);
  const results = rows as User[];
  return results.length > 0 ? results[0] : null;
}

export async function updateUser(
  id: number,
  data: { nombre?: string; email?: string; rol?: UserRole; password?: string },
  updatedBy: number  // ← Nuevo parámetro
): Promise<boolean> {
  const conn = await getDbConnection();
  let query = 'UPDATE usuarios SET ';
  const fields: string[] = [];
  const values: any[] = [];

  if (data.nombre) {
    fields.push('nombre = ?');
    values.push(data.nombre);
  }
  if (data.email) {
    fields.push('email = ?');
    values.push(data.email);
  }
  if (data.rol) {
    fields.push('rol = ?');
    values.push(data.rol);
  }
  if (data.password) {
    const hashed = await hashPassword(data.password);
    fields.push('password = ?');
    values.push(hashed);
  }

  // Siempre actualizar updated_by
  fields.push('updated_by = ?');
  values.push(updatedBy);

  if (fields.length === 0) return false;

  query += fields.join(', ') + ' WHERE id = ?';
  values.push(id);

  const [result] = await conn.execute(query, values);
  return (result as any).affectedRows > 0;
}

export async function deleteUser(id: number): Promise<boolean> {
  const conn = await getDbConnection();
  const [result] = await conn.execute('DELETE FROM usuarios WHERE id = ?', [id]);
  return (result as any).affectedRows > 0;
}