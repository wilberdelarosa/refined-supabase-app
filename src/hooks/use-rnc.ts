
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface RNCData {
  name: string;
  rnc: string;
  status: string;
}

export function useRNC() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RNCData | null>(null);

  const fetchRNC = useCallback(async (rnc: string) => {
    // Only fetch if 9 or 11 digits
    const cleanRNC = rnc.replace(/[^0-9]/g, '');
    if (cleanRNC.length !== 9 && cleanRNC.length !== 11) {
        return null;
    }

    setLoading(true);
    setData(null);

    try {
      // Using our local backend proxy
      // The vite proxy forwards /api -> http://localhost:3001/api
      const response = await fetch(`/api/rnc/${cleanRNC}`);
      
      if (!response.ok) {
        throw new Error('RNC no encontrado');
      }

      const result = await response.json();
      
      // Validation: API returns normalized data
      if (!result.name) {
          throw new Error('Datos incompletos');
      }
      
      const rncData: RNCData = {
        name: result.name,
        rnc: result.rnc,
        status: result.status || 'ACTIVO'
      };

      setData(rncData);
      return rncData;
    } catch (error) {
      console.error('Error fetching RNC:', error);
      toast.error('RNC no válido o no encontrado', { 
        description: 'Por favor verifique el número ingresado.' 
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchRNC, data, loading };
}
