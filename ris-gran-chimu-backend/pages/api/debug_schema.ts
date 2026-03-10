import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const columns = await query('SHOW COLUMNS FROM noticias');
        return res.status(200).json(columns);
    } catch (error: any) {
        return res.status(500).json({ error: error.message, stack: error.stack });
    }
}
