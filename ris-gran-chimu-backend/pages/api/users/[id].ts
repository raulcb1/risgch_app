// backend/pages/api/users/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/middleware/auth';
import { requirePermission } from '../../../lib/middleware/requirePermission';
import { getUserById, updateUser, deleteUser } from '../../../services/userService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const userId = parseInt(id as string);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const authError = authenticate(req, res);
  if (authError) return authError;

  const adminError = await requirePermission('manage_users')(req, res);
  if (adminError) return adminError;

  if (req.method === 'GET') {
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.status(200).json(user);
  }

  if (req.method === 'PUT') {
    const authError = authenticate(req, res);
    if (authError) return authError;

    const adminError = await requirePermission('manage_users')(req, res);
    if (adminError) return adminError;

    const { id } = req.query;
    const userId = parseInt(id as string);
    const updaterId = (req as any).user.id; // ← Quien está haciendo el PUT

    const { nombre, email, rol, password } = req.body;

    if (rol) {
      try {
        const { query } = require('../../../lib/db');
        const [roleExists]: any = await query('SELECT id FROM roles WHERE nombre = ? AND activo = 1', [rol]);
        if (!roleExists || roleExists.length === 0) {
          return res.status(400).json({ error: 'Rol inválido o inactivo' });
        }
      } catch (e) {
        console.error('Error validando rol:', e);
        return res.status(500).json({ error: 'Error interno' });
      }
    }

    const success = await updateUser(userId, { nombre, email, rol, password }, updaterId);

    if (!success) {
      return res.status(404).json({ error: 'Usuario no encontrado o sin cambios' });
    }

    const updatedUser = await getUserById(userId);
    return res.status(200).json(updatedUser);
  }

  if (req.method === 'DELETE') {
    const success = await deleteUser(userId);
    if (!success) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.status(204).end();
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end();
}

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Obtener un usuario por ID
 *     description: Devuelve los datos detallados de un usuario específico. Solo accesible para usuarios con rol **admin**.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del usuario a obtener
 *         schema:
 *           type: integer
 *           example: 3
 *     responses:
 *       200:
 *         description: Usuario obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 3
 *                 nombre:
 *                   type: string
 *                   example: "Carlos García"
 *                 email:
 *                   type: string
 *                   example: "carlos@example.com"
 *                 rol:
 *                   type: string
 *                   enum: [admin, editor, user]
 *                   example: "editor"
 *                 fecha_creacion:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-10-22T14:00:00Z"
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado (token faltante o inválido)
 *       403:
 *         description: Acceso denegado (solo admin)
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 *
 *   put:
 *     tags:
 *       - Users
 *     summary: Actualizar un usuario existente
 *     description: Permite actualizar los datos de un usuario. Solo accesible para usuarios con rol **admin**.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del usuario a actualizar
 *         schema:
 *           type: integer
 *           example: 3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Carlos García Actualizado"
 *               email:
 *                 type: string
 *                 example: "carlos.garcia@example.com"
 *               password:
 *                 type: string
 *                 example: "nuevoPasswordSeguro123"
 *               rol:
 *                 type: string
 *                 enum: [admin, editor, user]
 *                 example: "editor"
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 3
 *                 nombre:
 *                   type: string
 *                   example: "Carlos García Actualizado"
 *                 email:
 *                   type: string
 *                   example: "carlos.garcia@example.com"
 *                 rol:
 *                   type: string
 *                   example: "editor"
 *       400:
 *         description: ID inválido o datos incompletos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 *       404:
 *         description: Usuario no encontrado o sin cambios
 *       500:
 *         description: Error interno del servidor
 *
 *   delete:
 *     tags:
 *       - Users
 *     summary: Eliminar un usuario
 *     description: Elimina un usuario del sistema. Solo accesible para usuarios con rol **admin**.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del usuario a eliminar
 *         schema:
 *           type: integer
 *           example: 3
 *     responses:
 *       204:
 *         description: Usuario eliminado exitosamente (sin contenido)
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */