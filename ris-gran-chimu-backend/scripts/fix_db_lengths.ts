import { getDbConnection } from '../lib/db';

async function fixLengths() {
    console.log('--- Iniciando corrección de longitudes de columnas ---');
    let conn;
    try {
        conn = await getDbConnection();

        console.log('Ampliando imagen_url en noticias...');
        await conn.execute('ALTER TABLE noticias MODIFY COLUMN imagen_url TEXT');

        console.log('Ampliando link_facebook en noticias...');
        await conn.execute('ALTER TABLE noticias MODIFY COLUMN link_facebook TEXT');

        console.log('Ampliando archivo en normas...');
        await conn.execute('ALTER TABLE normas MODIFY COLUMN archivo TEXT');

        console.log('✅ Correcciones completadas exitosamente.');
    } catch (error) {
        console.error('❌ Error durante la corrección:', error);
    } finally {
        // Si la conexión tiene un método end o destroy, pero usualmente con pools no es necesario cerrar aquí si el proceso termina
        process.exit(0);
    }
}

fixLengths();
