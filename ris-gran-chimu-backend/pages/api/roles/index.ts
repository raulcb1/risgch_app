import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { authenticate } from '../../../lib/middleware/auth';
import { requirePermission } from '../../../lib/middleware/requirePermission';

/**
 * @openapi
 * /roles:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Listar roles
 *     description: Obtiene la lista de roles del sistema con sus permisos asociados.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 *
 *   post:
 *     tags:
 *       - Roles
 *     summary: Crear nuevo rol
 *     description: Registra un nuevo rol y asigna permisos iniciales. Solo accesible para administradores.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Editor de Noticias"
 *               descripcion:
 *                 type: string
 *                 example: "Usuario que puede crear y editar noticias."
 *               activo:
 *                 type: boolean
 *                 default: true
 *               permisos_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 5]
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
 *       400:
 *         description: Nombre duplicado o datos inválidos
 *       403:
 *         description: Permisos insuficientes
 *       500:
 *         description: Error del servidor
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authError = authenticate(req, res);
    if (authError) return authError;

    // Solo quien tenga permiso de gestionar roles puede ver esto
    // Permiso 'manage_roles' se requerirá explícitamente para POST
    // Para GET, permitiremos a cualquier usuario autenticado (para llenar selects)
    // O podríamos requerir 'manage_users' o 'manage_roles'. Por simplicidad, autenticado es suficiente
    // ya que no revela datos sensibles.

    // if (permError) return permError; // Eliminado de bloque global

    if (req.method === 'GET') {
        try {
            // Obtener roles con nombres de creadores
            const roles: any = await query(`
                SELECT r.*, 
                       uc.nombre as nombre_creador, 
                       ua.nombre as nombre_actualizador 
                FROM roles r
                LEFT JOIN usuarios uc ON r.created_by = uc.id
                LEFT JOIN usuarios ua ON r.updated_by = ua.id
                ORDER BY r.id ASC
            `);

            // Obtener permisos por rol
            const rolePermissions: any = await query(`
                SELECT rp.role_id, p.id as permiso_id, p.codigo 
                FROM roles_permisos rp
                JOIN permisos p ON rp.permiso_id = p.id
            `);

            // Mapear permisos a cada rol
            const rolesWithPerms = roles.map((r: any) => ({
                ...r,
                permisos: rolePermissions
                    .filter((rp: any) => rp.role_id === r.id)
                    .map((rp: any) => rp.permiso_id)
            }));

            return res.status(200).json(rolesWithPerms);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error al obtener roles' });
        }
    }

    if (req.method === 'POST') {
        const permError = await requirePermission('manage_roles')(req, res);
        if (permError) return permError;

        const { nombre, descripcion, activo, permisos_ids } = req.body;
        const createdBy = (req as any).user.id; // User ID from token

        if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

        try {
            // Crear rol
            const insertRes: any = await query(
                `INSERT INTO roles (nombre, descripcion, activo, created_by) VALUES (?, ?, ?, ?)`,
                [nombre, descripcion, (activo !== undefined ? activo : true) ? 1 : 0, createdBy]
            );

            const newRoleId = insertRes.insertId;

            // Asignar permisos
            if (Array.isArray(permisos_ids) && permisos_ids.length > 0) {
                const values = permisos_ids.map((pid: number) => [newRoleId, pid]);
                await query('INSERT INTO roles_permisos (role_id, permiso_id) VALUES ?', [values]);
            }

            return res.status(201).json({ id: newRoleId, message: 'Rol creado' });

        } catch (error: any) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'El nombre del rol ya existe' });
            }
            return res.status(500).json({ error: 'Error al crear rol' });
        }
    }

    return res.status(405).end();
}
