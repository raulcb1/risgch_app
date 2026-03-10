// backend/models/Norma.ts
import { getDbConnection } from '../lib/db';

export interface Norma {
  id_norma: number;
  cod_tipo_norma: number | null;
  nombre_tipo_norma: string | null;
  sufijo_tipo_norma: string | null;
  anho: number;
  nombre_norma: string;
  descripcion: string;
  fecha_norma: string | null;
  archivo: string | null;
  activo: boolean;
  fecha_registro: string;
  creado_por: number | null;
  nombre_usuario_creador: string | null;
  fecha_actualizacion: string;
  actualizado_por: number | null;
  nombre_usuario_actualizador: string | null;
}

/**
 * Obtiene todas las normas (activas e inactivas) con información completa
 */
export async function getAllNormas(): Promise<Norma[]> {
  const conn = await getDbConnection();
  const [rows] = await conn.query(`
    SELECT 
      n.id_norma,
      n.cod_tipo_norma,
      t.nombre AS nombre_tipo_norma,
      t.sufijo AS sufijo_tipo_norma,
      n.anho,
      n.nombre_norma,
      n.descripcion,
      n.fecha_norma,
      n.archivo,
      n.activo,
      n.fecha_registro,
      n.creado_por,
      uc.nombre AS nombre_usuario_creador,
      n.fecha_actualizacion,
      n.actualizado_por,
      ua.nombre AS nombre_usuario_actualizador
    FROM normas n
    LEFT JOIN normas_tipo t ON n.cod_tipo_norma = t.cod_tipo_norma
    LEFT JOIN usuarios uc ON n.creado_por = uc.id
    LEFT JOIN usuarios ua ON n.actualizado_por = ua.id
    ORDER BY n.anho DESC, n.fecha_registro DESC
  `);
  return rows as Norma[];
}

/**
 * Obtiene una norma por ID (incluye desactivadas)
 */
export async function getNormaById(id: number): Promise<Norma | null> {
  const conn = await getDbConnection();
  const [rows] = await conn.execute(`
    SELECT 
      n.id_norma,
      n.cod_tipo_norma,
      t.nombre AS nombre_tipo_norma,
      t.sufijo AS sufijo_tipo_norma,
      n.anho,
      n.nombre_norma,
      n.descripcion,
      n.fecha_norma,
      n.archivo,
      n.activo,
      n.fecha_registro,
      n.creado_por,
      uc.nombre AS nombre_usuario_creador,
      n.fecha_actualizacion,
      n.actualizado_por,
      ua.nombre AS nombre_usuario_actualizador
    FROM normas n
    LEFT JOIN normas_tipo t ON n.cod_tipo_norma = t.cod_tipo_norma
    LEFT JOIN usuarios uc ON n.creado_por = uc.id
    LEFT JOIN usuarios ua ON n.actualizado_por = ua.id
    WHERE n.id_norma = ?
  `, [id]);
  const results = rows as Norma[];
  return results.length > 0 ? results[0] : null;
}

/**
 * Crea una nueva norma
 */
export async function createNorma(data: any, userId: number): Promise<Norma> {
  const conn = await getDbConnection();

  // Extrae datos con valores por defecto
  const {
    cod_tipo_norma,
    nombre_norma,
    descripcion,
    fecha_norma,
    archivo,
    activo = true
  } = data;

  // Extrae año de fecha_norma si existe
  const anho = fecha_norma ? new Date(fecha_norma).getFullYear() : new Date().getFullYear();

  // Validación básica
  if (!cod_tipo_norma || !nombre_norma || !descripcion) {
    throw new Error('Los campos cod_tipo_norma, nombre_norma y descripcion son obligatorios');
  }

  const [result] = await conn.execute(
    `INSERT INTO normas (
      cod_tipo_norma,
      anho,
      nombre_norma,
      descripcion,
      fecha_norma,
      archivo,
      activo,
      creado_por,
      actualizado_por
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cod_tipo_norma,
      anho,
      nombre_norma,
      descripcion,
      fecha_norma || null,
      archivo || null,
      Boolean(activo) ? 1 : 0,
      userId,
      userId
    ]
  );

  const insertId = (result as any).insertId;
  const nuevaNorma = await getNormaById(insertId);

  if (!nuevaNorma) {
    throw new Error('No se pudo crear la norma');
  }

  return nuevaNorma;
}

/**
 * Actualiza una norma existente
 */
export async function updateNorma(id: number, data: any, userId: number): Promise<Norma | null> {
  const conn = await getDbConnection();

  const {
    cod_tipo_norma,
    nombre_norma,
    descripcion,
    fecha_norma,
    archivo,
    activo = true
  } = data;

  // Calcula anho desde fecha_norma
  const anho = fecha_norma ? new Date(fecha_norma).getFullYear() : null;

  // Validación mínima
  if (!cod_tipo_norma || !nombre_norma || !descripcion) {
    throw new Error('campos requeridos faltantes');
  }

  const [result] = await conn.execute(
    `UPDATE normas SET
      cod_tipo_norma = ?,
      anho = ?,
      nombre_norma = ?,
      descripcion = ?,
      fecha_norma = ?,
      archivo = ?,
      activo = ?,
      actualizado_por = ?
    WHERE id_norma = ?`,
    [
      cod_tipo_norma,
      anho ?? new Date().getFullYear(),
      nombre_norma,
      descripcion,
      fecha_norma || null,
      archivo || null,
      Boolean(activo) ? 1 : 0,
      userId,
      id
    ]
  );

  return (result as any).affectedRows > 0 ? getNormaById(id) : null;
}