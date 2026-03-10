// backend/scripts/create-admin.ts
import bcrypt from 'bcryptjs';

async function main() {
  const password = 'AdminPass2025!'; // ← Cambia si quieres
  const saltRounds = 12;

  try {
    const hash = await bcrypt.hash(password, saltRounds);

    console.log('🔐 Contraseña:', password);
    console.log('🧩 Hash bcrypt:', hash);

    console.log('\n✅ Ejecuta este SQL en MySQL Workbench:');
    console.log(`
INSERT INTO usuarios (nombre, email, password, rol, created_by)
VALUES (
  'Administrador Principal',
  'admin@chimu.com',
  '${hash}',
  'admin',
  NULL
);
    `.trim());
  } catch (error) {
    console.error('Error al generar el hash:', error);
  }
}

main();