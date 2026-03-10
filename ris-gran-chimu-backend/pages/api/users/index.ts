// backend/pages/api/users/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../lib/middleware/auth';
import { requirePermission } from '../../../lib/middleware/requirePermission';
import { getAllUsers, createUser } from '../../../services/userService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const authError = authenticate(req, res);
  if (authError) return authError;

  const adminError = await requirePermission('manage_users')(req, res);
  if (adminError) return adminError;

  if (req.method === 'GET') {
    try {
      const users = await getAllUsers();
      return res.status(200).json(users);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  if (req.method === 'POST') {
    const { nombre, email, password, rol } = req.body;
    const createdBy = (req as any).user.id;

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Validar rol contra BD
    try {
      const { query } = require('../../../lib/db');
      const [roleExists]: any = await query('SELECT id FROM roles WHERE nombre = ? AND activo = 1', [rol]);
      if (!roleExists || roleExists.length === 0) {
        return res.status(400).json({ error: 'Rol inválido o inactivo' });
      }

      const userId = await createUser({ nombre, email, password, rol, createdBy });
      return res.status(201).json({ id: userId, nombre, email, rol });
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }
      console.error(error);
      return res.status(500).json({ error: 'Error al crear usuario' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}

/**
 * @openapi
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Listar todos los usuarios
 *     description: Obtiene la lista completa de usuarios registrados. Solo accesible para administradores.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (solo admin)
 *       500:
 *         description: Error interno del servidor
 *
 *   post:
 *     tags:
 *       - Users
 *     summary: Crear un nuevo usuario
 *     description: Registra una nueva cuenta de usuario con un rol específico.
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
 *               - email
 *               - password
 *               - rol
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos o rol inexistente
 *       409:
 *         description: El email ya está en uso
 *       500:
 *         description: Error interno
 */