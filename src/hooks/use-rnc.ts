import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface RNCData {
  name: string;
  rnc: string;
  status: string;
}

export function useRNC() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RNCData | null>(null);

  const fetchRNC = useCallback(async (rnc: string) => {
    const cleanRNC = rnc.replace(/[^0-9]/g, '');
    if (cleanRNC.length !== 9 && cleanRNC.length !== 11) {
      return null;
    }

    setLoading(true);
    setData(null);

    try {
      const { data: result, error } = await supabase.functions.invoke('validate-rnc', {
        body: { rnc: cleanRNC },
      });

      if (error) {
        throw new Error('RNC no encontrado');
      }

      if (!result || !result.valid) {
        throw new Error('RNC no válido');
      }

      const rncData: RNCData = {
        name: result.name || '',
        rnc: result.rnc,
        status: result.status || 'ACTIVO',
      };

      setData(rncData);

      if (!rncData.name) {
        toast.info('RNC válido', {
          description: 'El número es válido pero no se pudo obtener la razón social de DGII.',
        });
      }

      return rncData;
    } catch (error) {
      console.error('Error fetching RNC:', error);
      toast.error('RNC no válido o no encontrado', {
        description: 'Por favor verifique el número ingresado.',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchRNC, data, loading };
}
