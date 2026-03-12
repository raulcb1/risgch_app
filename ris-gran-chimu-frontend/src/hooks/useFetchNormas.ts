import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Norma } from '../types/Norma';

export function useFetchNormas() {
  const [normas, setNormas] = useState<Norma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNormas = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/normas');
        const data = (res.data as { data: Norma[] }).data || [];
        setNormas(data);
      } catch (err: any) {
        setError(err);
        console.error('Error al cargar normas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNormas();
  }, []);

  return { normas, loading, error };
}