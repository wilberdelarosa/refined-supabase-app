import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AIRecommendationProps {
  productName: string;
  productCategory: string;
}

export default function AIRecommendation({ productName, productCategory }: AIRecommendationProps) {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generateRecommendation() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-recommendation', {
        body: { productName, productCategory },
      });

      if (error) throw error;
      setRecommendation(data?.recommendation || 'No se pudo generar una recomendación.');
    } catch (e) {
      console.error('AI recommendation error:', e);
      setRecommendation('Error al generar recomendación. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {!recommendation ? (
          <Button
            onClick={generateRecommendation}
            disabled={loading}
            variant="outline"
            className="w-full gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? 'Generando recomendación...' : 'Obtener Recomendación con IA'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Recomendación IA
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{recommendation}</p>
            <Button variant="ghost" size="sm" onClick={() => setRecommendation(null)}>
              Generar otra
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
