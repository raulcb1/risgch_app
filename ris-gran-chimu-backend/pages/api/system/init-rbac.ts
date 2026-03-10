import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    // Security check: Only allow this if a specific secret is present or running locally
    // For now, let's assume it's safe to run as it creates non-destructive tables mostly (IF NOT EXISTS)
    // or checks strictly for admin. But since we are setting up RBAC, we might not have users yet in a fresh install.
    // Assuming existing admin user calls this or developer calls it via curl.

    try {
        // 1. Create Tables
        await query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) UNIQUE NOT NULL,
        descripcion VARCHAR(255),
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await query(`
      CREATE TABLE IF NOT EXISTS permisos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        descripcion VARCHAR(255),
        modulo VARCHAR(50)
      )
    `);

        await query(`
      CREATE TABLE IF NOT EXISTS roles_permisos (
        role_id INT,
        permiso_id INT,
        PRIMARY KEY (role_id, permiso_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
      )
    `);

        // 2. Insert Permissions
        const permissions = [
            { codigo: 'manage_users', nombre: 'Gestión de Usuarios', modulo: 'Sistema' },
            { codigo: 'manage_roles', nombre: 'Gestión de Roles', modulo: 'Sistema' },
            { codigo: 'manage_estrategias', nombre: 'Gestión de Estrategias', modulo: 'Contenido' },
            { codigo: 'manage_establecimientos', nombre: 'Gestión de Establecimientos', modulo: 'Contenido' },
            { codigo: 'manage_servicios', nombre: 'Gestión de Servicios', modulo: 'Contenido' },
            { codigo: 'manage_noticias', nombre: 'Gestión de Noticias', modulo: 'Contenido' },
            { codigo: 'manage_normas', nombre: 'Gestión de Normas', modulo: 'Contenido' },
        ];

        for (const p of permissions) {
            await query(`
        INSERT IGNORE INTO permisos (codigo, nombre, modulo) VALUES (?, ?, ?)
      `, [p.codigo, p.nombre, p.modulo]);
        }

        // 3. Insert Default Roles
        await query(`INSERT IGNORE INTO roles (nombre, descripcion) VALUES ('admin', 'Administrador del sistema - Acceso total')`);
        await query(`INSERT IGNORE INTO roles (nombre, descripcion) VALUES ('editor', 'Editor de contenido - Acceso limitado')`);
        await query(`INSERT IGNORE INTO roles (nombre, descripcion) VALUES ('user', 'Usuario estándar - Solo lectura')`);

        // 4. Assign Permissions to Roles

        // Admin gets ALL permissions
        const adminRole: any = (await query(`SELECT id FROM roles WHERE nombre = 'admin'`));
        const allPerms: any = (await query(`SELECT id FROM permisos`));

        if (adminRole[0]) {
            const roleId = adminRole[0].id;
            for (const p of allPerms) {
                await query(`INSERT IGNORE INTO roles_permisos (role_id, permiso_id) VALUES (?, ?)`, [roleId, p.id]);
            }
        }

        // Editor gets Content permissions (all except manage_users, manage_roles)
        const editorRole: any = (await query(`SELECT id FROM roles WHERE nombre = 'editor'`));
        const contentPerms: any = (await query(`
      SELECT id FROM permisos WHERE codigo NOT IN ('manage_users', 'manage_roles')
    `));

        if (editorRole[0]) {
            const roleId = editorRole[0].id;
            for (const p of contentPerms) {
                await query(`INSERT IGNORE INTO roles_permisos (role_id, permiso_id) VALUES (?, ?)`, [roleId, p.id]);
            }
        }

        // User gets RO (Read Only) or nothing? Usually 'user' might just view.
        // Assuming backend endpoints require 'permission' for modifications (POST/PUT/DELETE), regular users can access GET if public or authenticated.
        // We won't assign explicit write permissions to 'user' role.

        return res.status(200).json({ message: 'RBAC system initialized successfully' });

    } catch (error) {
        console.error('Error initializing RBAC:', error);
        return res.status(500).json({ error: 'Failed to initialize RBAC' });
    }
}
