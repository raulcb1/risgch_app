// backend/types/Norma.ts
export interface Norma {
  id_norma: number;
  id_tipo_norma: number | null;
  cod_tipo_norma: string | null;
  id_cat_norma: number | null;
  cat_norma_1: string | null;
  cat_norma_2: string | null;
  numero: number | null;
  anho: number;
  sufijo: string | null;
  nombre_norma: string;
  descripcion: string;
  fecha_norma: string | null; // ISO Date
  archivo: string | null;
  fecha_registro: string;
  activo: boolean;
  creado_por: number | null;
  actualizado_por: number | null;
  fecha_actualizacion: string; // ISO Date

  // Campos adicionales (relaciones)
  nombre_usuario_creador?: string;
  nombre_usuario_actualizador?: string;
}